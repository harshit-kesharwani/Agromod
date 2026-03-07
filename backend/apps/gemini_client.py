"""
Shared Google Gemini client used by yield_prediction, disease, and chatbot apps.

Uses gemini-2.5-flash for text, vision (image), and audio tasks.
"""
import base64
import logging

from google import genai
from django.conf import settings

logger = logging.getLogger(__name__)

_client = None

GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"


def _get_client():
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


def _extract_text(response) -> str:
    """Safely extract text from a Gemini response, handling None / empty candidates."""
    try:
        if response.text:
            return response.text
    except (AttributeError, ValueError):
        pass
    for candidate in getattr(response, "candidates", []):
        for part in getattr(candidate.content, "parts", []):
            if hasattr(part, "text") and part.text:
                return part.text
    return ""


def ask_text(system_prompt: str, user_message: str, *, max_tokens: int = 4096, temperature: float = 0.4) -> str:
    """Send a text-only prompt to Gemini and return the response."""
    client = _get_client()
    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=user_message,
        config=genai.types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=max_tokens,
            temperature=temperature,
        ),
    )
    return _extract_text(response)


def ask_with_image(
    system_prompt: str,
    user_message: str,
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    *,
    max_tokens: int = 2048,
    temperature: float = 0.3,
) -> str:
    """Send an image + text prompt to Gemini and return the response."""
    client = _get_client()
    image_part = genai.types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
    text_part = genai.types.Part.from_text(text=user_message)

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=[image_part, text_part],
        config=genai.types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=max_tokens,
            temperature=temperature,
        ),
    )
    return _extract_text(response)


def ask_with_audio(
    system_prompt: str,
    audio_bytes: bytes,
    audio_mime: str = "audio/webm",
    image_bytes: bytes | None = None,
    image_mime: str = "image/jpeg",
    *,
    max_tokens: int = 2048,
    temperature: float = 0.4,
) -> str:
    """Send audio (+ optional image) to Gemini and return a text response."""
    client = _get_client()
    parts = [genai.types.Part.from_bytes(data=audio_bytes, mime_type=audio_mime)]
    if image_bytes:
        parts.append(genai.types.Part.from_bytes(data=image_bytes, mime_type=image_mime))

    response = client.models.generate_content(
        model=settings.GEMINI_MODEL,
        contents=parts,
        config=genai.types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=max_tokens,
            temperature=temperature,
        ),
    )
    return _extract_text(response)


def text_to_speech(text: str, voice_name: str = "Kore") -> bytes:
    """Convert text to speech using Gemini TTS. Returns raw PCM audio (24 kHz, 16-bit LE)."""
    client = _get_client()
    response = client.models.generate_content(
        model=GEMINI_TTS_MODEL,
        contents=text,
        config=genai.types.GenerateContentConfig(
            response_modalities=["AUDIO"],
            speech_config=genai.types.SpeechConfig(
                voice_config=genai.types.VoiceConfig(
                    prebuilt_voice_config=genai.types.PrebuiltVoiceConfig(
                        voice_name=voice_name,
                    )
                )
            ),
        ),
    )
    data = response.candidates[0].content.parts[0].inline_data.data
    return data


def create_ephemeral_token() -> dict:
    """Create a short-lived token for direct browser→Gemini Live API WebSocket."""
    client = _get_client()
    token_response = client.auth_tokens.create(
        config=genai.types.CreateAuthTokenConfig(uses=1),
    )
    return {"token": token_response.token}
