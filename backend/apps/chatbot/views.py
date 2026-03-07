import base64
import io
import logging
import wave

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response

from apps.gemini_client import (
    ask_text, ask_with_audio, ask_with_image,
    create_ephemeral_token, text_to_speech,
)


def _pcm_to_wav(pcm_data: bytes, sample_rate: int = 24000, channels: int = 1, sample_width: int = 2) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(sample_rate)
        wf.writeframes(pcm_data)
    return buf.getvalue()

logger = logging.getLogger(__name__)

CHATBOT_SYSTEM_PROMPT = (
    "You are Agromod Assistant, a friendly and knowledgeable AI helper for Indian farmers. "
    "You can answer questions about:\n"
    "- Crop diseases, pests, and treatments\n"
    "- Yield estimation and crop planning\n"
    "- Weather impacts on farming\n"
    "- Government schemes and subsidies for farmers\n"
    "- Market prices and selling strategies\n"
    "- Organic and sustainable farming practices\n"
    "- Soil health and fertiliser recommendations\n\n"
    "Keep answers concise (50-150 words), practical, and in simple language. "
    "If the question is not related to agriculture, politely redirect the conversation. "
    "Use bullet points where helpful."
)

KISAN_MITRA_SYSTEM_PROMPT = (
    "You are Kisan Mitra (किसान मित्र) — a warm, patient, and expert agricultural advisor "
    "for Indian farmers. You MUST follow these rules strictly:\n\n"
    "1. LANGUAGE: Detect the language the farmer is speaking (Hindi, Tamil, Telugu, Kannada, "
    "   Bengali, Marathi, Gujarati, Punjabi, Malayalam, Odia, Assamese, Urdu, or English) and "
    "   ALWAYS reply in the SAME language. Use simple, everyday words — no technical jargon.\n\n"
    "2. SCOPE: ONLY answer questions related to agriculture, farming, crops, livestock, soil, "
    "   water, weather, seeds, fertilisers, pesticides, government schemes for farmers, market "
    "   prices, organic farming, farm equipment, irrigation, post-harvest, and rural livelihood. "
    "   If the farmer asks anything outside agriculture, politely say in their language: "
    "   'I can only help with farming-related questions. Please ask me about your crops, soil, "
    "   weather, or any farming problem.'\n\n"
    "3. IMAGE ANALYSIS: If an image is provided, carefully examine it for crop diseases, pest "
    "   damage, soil conditions, weed identification, or nutrient deficiencies. Describe what "
    "   you see and provide actionable advice.\n\n"
    "4. TONE: Be like a knowledgeable elder or friend from the village. Use empathy, "
    "   encouragement, and practical step-by-step solutions. Keep answers concise (50-200 words).\n\n"
    "5. SAFETY: Never recommend banned pesticides. Always suggest consulting local KVK "
    "   (Krishi Vigyan Kendra) for serious issues.\n\n"
    "6. FORMAT: Use short sentences. Use numbered steps for treatments. "
    "   Avoid markdown formatting — respond in plain conversational text suitable for "
    "   text-to-speech reading."
)

MAX_AUDIO_SIZE = 10 * 1024 * 1024
MAX_IMAGE_SIZE = 5 * 1024 * 1024
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/wav", "audio/ogg", "audio/mpeg", "audio/mp4", "audio/mp3"}
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}



@api_view(["POST"])
def chatbot_message(request):
    message = request.data.get("message", "").strip()
    if not message:
        return Response(
            {"error": "Message is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        reply = ask_text(CHATBOT_SYSTEM_PROMPT, message, max_tokens=512)
    except Exception:
        logger.exception("Gemini chatbot failed")
        return Response(
            {"error": "Unable to get a response. Please try again later."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({"reply": reply})


# ── Kisan Mitra: Gemini Live API token (primary — real-time voice) ────────

@api_view(["POST"])
def kisan_mitra_token(request):
    """
    Returns an ephemeral token + config so the frontend can open a direct
    WebSocket to Gemini Live API for real-time two-way voice chat.
    """
    try:
        token_data = create_ephemeral_token()
    except Exception:
        logger.exception("Failed to create Gemini ephemeral token")
        return Response(
            {"error": "Unable to start voice session. Please try again."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response({
        "token": token_data["token"],
        "uri": "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent",
        "model": "models/gemini-2.5-flash-preview-native-audio-dialog",
        "systemInstruction": KISAN_MITRA_SYSTEM_PROMPT,
    })


# ── Kisan Mitra: fallback voice endpoint (record → send → get reply) ─────

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def kisan_mitra_voice(request):
    audio_file = request.FILES.get("audio")
    image_file = request.FILES.get("image")
    preferred_lang = request.POST.get("language", "").strip()

    if not audio_file:
        return Response({"error": "Audio recording is required."}, status=status.HTTP_400_BAD_REQUEST)
    if audio_file.size > MAX_AUDIO_SIZE:
        return Response({"error": "Audio file too large (max 10 MB)."}, status=status.HTTP_400_BAD_REQUEST)

    audio_mime = audio_file.content_type or "audio/webm"
    if audio_mime not in ALLOWED_AUDIO_TYPES:
        audio_mime = "audio/webm"
    audio_bytes = audio_file.read()

    image_bytes = None
    image_mime = "image/jpeg"
    if image_file:
        if image_file.size > MAX_IMAGE_SIZE:
            return Response({"error": "Image too large (max 5 MB)."}, status=status.HTTP_400_BAD_REQUEST)
        image_mime = image_file.content_type or "image/jpeg"
        if image_mime not in ALLOWED_IMAGE_TYPES:
            return Response({"error": "Unsupported image format."}, status=status.HTTP_400_BAD_REQUEST)
        image_bytes = image_file.read()

    system_prompt = KISAN_MITRA_SYSTEM_PROMPT
    if preferred_lang and preferred_lang.lower() != "english":
        system_prompt += f"\n\nIMPORTANT: The user prefers {preferred_lang}. Reply in {preferred_lang}."

    try:
        text_reply = ask_with_audio(
            system_prompt, audio_bytes, audio_mime,
            image_bytes=image_bytes, image_mime=image_mime,
            max_tokens=2048, temperature=0.4,
        )
    except Exception:
        logger.exception("Kisan Mitra audio understanding failed")
        return Response({"error": "Unable to understand the audio. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)

    if not text_reply:
        text_reply = "I could not understand your message. Please try again with a clearer recording."

    return Response({"reply": text_reply})


# ── Kisan Mitra: text + optional image endpoint ──────────────────────────

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def kisan_mitra_text(request):
    message = ""
    image_bytes = None
    image_mime = "image/jpeg"

    if request.content_type and "multipart" in request.content_type:
        message = request.POST.get("message", "").strip()
        image_file = request.FILES.get("image")
        if image_file:
            if image_file.size > MAX_IMAGE_SIZE:
                return Response({"error": "Image too large (max 5 MB)."}, status=status.HTTP_400_BAD_REQUEST)
            image_mime = image_file.content_type or "image/jpeg"
            if image_mime not in ALLOWED_IMAGE_TYPES:
                return Response({"error": "Unsupported image format."}, status=status.HTTP_400_BAD_REQUEST)
            image_bytes = image_file.read()
    else:
        message = request.data.get("message", "").strip()

    if not message:
        return Response({"error": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        if image_bytes:
            text_reply = ask_with_image(KISAN_MITRA_SYSTEM_PROMPT, message, image_bytes, image_mime, max_tokens=2048)
        else:
            text_reply = ask_text(KISAN_MITRA_SYSTEM_PROMPT, message, max_tokens=2048)
    except Exception:
        logger.exception("Kisan Mitra text failed")
        return Response({"error": "Unable to get a response. Please try again."}, status=status.HTTP_502_BAD_GATEWAY)

    if not text_reply:
        text_reply = "I could not generate a response. Please rephrase your question and try again."

    return Response({"reply": text_reply})


# ── Kisan Mitra: separate TTS endpoint (called async after text reply) ────

@api_view(["POST"])
@parser_classes([JSONParser])
def kisan_mitra_tts(request):
    text = (request.data.get("text") or "").strip()
    if not text:
        return Response({"error": "Text is required."}, status=status.HTTP_400_BAD_REQUEST)

    if len(text) > 3000:
        text = text[:3000]

    try:
        pcm_audio = text_to_speech(text)
        audio_b64 = base64.b64encode(_pcm_to_wav(pcm_audio)).decode("ascii")
    except Exception:
        logger.exception("Kisan Mitra TTS failed")
        return Response({"error": "TTS failed."}, status=status.HTTP_502_BAD_GATEWAY)

    return Response({"audio": audio_b64})
