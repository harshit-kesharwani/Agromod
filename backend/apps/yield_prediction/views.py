import logging

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .bedrock_client import predict_yield, suggest_crops
from .models import CropSuggestionQuery, YieldQuery
from .serializers import CropSuggestionSerializer, YieldPredictionSerializer

logger = logging.getLogger(__name__)


@api_view(["POST"])
def yield_predict(request):
    serializer = YieldPredictionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    try:
        prediction = predict_yield(
            crop=d["crop"],
            region=d["region"],
            season=d["season"],
            area=d.get("area", ""),
        )
    except Exception as exc:
        logger.exception("Yield prediction error")
        return Response(
            {"error": "Could not generate prediction. Please try again later."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    user = request.user if request.user.is_authenticated else None
    YieldQuery.objects.create(
        user=user,
        crop=d["crop"],
        region=d["region"],
        season=d["season"],
        area=d.get("area", ""),
        prediction=prediction,
    )

    return Response({"prediction": prediction})


@api_view(["GET"])
def crop_suggestions(request):
    serializer = CropSuggestionSerializer(data=request.query_params)
    serializer.is_valid(raise_exception=True)
    d = serializer.validated_data

    try:
        suggestions = suggest_crops(
            region=d["region"],
            season=d["season"],
            current_crop=d.get("current_crop", ""),
        )
    except Exception as exc:
        logger.exception("Crop suggestion error")
        return Response(
            {"error": "Could not generate suggestions. Please try again later."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    user = request.user if request.user.is_authenticated else None
    CropSuggestionQuery.objects.create(
        user=user,
        region=d["region"],
        season=d["season"],
        current_crop=d.get("current_crop", ""),
        suggestions=suggestions,
    )

    return Response({"suggestions": suggestions})
