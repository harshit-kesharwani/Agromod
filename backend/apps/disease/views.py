import json
import logging
import re

from rest_framework import status
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from apps.gemini_client import ask_with_image
from .models import DiseaseQuery
from .serializers import DiseaseAnalyzeSerializer

logger = logging.getLogger(__name__)

DISEASE_SYSTEM_PROMPT = (
    "You are an expert plant pathologist and agricultural advisor specialising in "
    "Indian crops. Analyse the provided image of a plant/leaf/crop and:\n\n"
    "1. Identify the plant/crop if possible.\n"
    "2. Diagnose any disease, pest damage, or nutrient deficiency visible.\n"
    "3. Rate the severity (mild / moderate / severe).\n"
    "4. Provide treatment recommendations (organic and chemical options).\n"
    "5. Suggest preventive measures for the future.\n"
    "6. List the specific product names (pesticides, fungicides, fertilisers) a farmer "
    "   should buy to treat this issue. Give 2-4 product names commonly available in India.\n\n"
    "If the image does not appear to be a plant or crop, say so clearly.\n\n"
    "IMPORTANT: Respond in valid JSON with exactly these keys:\n"
    '{\n'
    '  "plant": "identified plant/crop name or unknown",\n'
    '  "disease": "disease name or healthy",\n'
    '  "severity": "mild | moderate | severe | healthy",\n'
    '  "diagnosis": "detailed diagnosis paragraph",\n'
    '  "treatment": "detailed treatment paragraph",\n'
    '  "prevention": "preventive measures paragraph",\n'
    '  "recommended_products": ["product name 1", "product name 2"]\n'
    '}\n'
    "Do NOT wrap the JSON in markdown code fences."
)


def _parse_gemini_response(raw: str) -> dict:
    """Extract structured data from the Gemini JSON response."""
    cleaned = raw.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {
            "plant": "unknown",
            "disease": "unknown",
            "severity": "unknown",
            "diagnosis": cleaned,
            "treatment": "Could not parse structured response. Raw analysis above.",
            "prevention": "",
        }


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def analyze_disease(request):
    serializer = DiseaseAnalyzeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    image_file = d["image"]
    description = d.get("description", "")

    if image_file.size > 5 * 1024 * 1024:
        return Response(
            {"error": "Image too large. Maximum size is 5 MB."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    content_type = image_file.content_type or "image/jpeg"
    if content_type not in ("image/jpeg", "image/png", "image/webp"):
        return Response(
            {"error": "Unsupported image format. Use JPEG, PNG, or WebP."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    image_bytes = image_file.read()

    user_msg = "Analyse this plant/leaf image for diseases."
    if description:
        user_msg += f" Additional context from the farmer: {description}"

    try:
        raw = ask_with_image(
            DISEASE_SYSTEM_PROMPT,
            user_msg,
            image_bytes,
            mime_type=content_type,
        )
    except Exception:
        logger.exception("Gemini disease analysis failed")
        return Response(
            {"error": "Disease analysis failed. Please try again later."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    parsed = _parse_gemini_response(raw)

    user = request.user if request.user.is_authenticated else None
    try:
        DiseaseQuery.objects.create(
            user=user,
            image=image_file,
            description=description,
            diagnosis=parsed.get("diagnosis", ""),
            treatment=parsed.get("treatment", ""),
        )
    except Exception as e:
        logger.warning("Could not save DiseaseQuery log: %s", e)

    return Response({
        "plant": parsed.get("plant", "unknown"),
        "disease": parsed.get("disease", "unknown"),
        "severity": parsed.get("severity", "unknown"),
        "diagnosis": parsed.get("diagnosis", ""),
        "treatment": parsed.get("treatment", ""),
        "prevention": parsed.get("prevention", ""),
        "recommended_products": parsed.get("recommended_products", []),
    })
