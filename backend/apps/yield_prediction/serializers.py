from rest_framework import serializers


class YieldPredictionSerializer(serializers.Serializer):
    crop = serializers.CharField(max_length=100)
    region = serializers.CharField(max_length=100)
    season = serializers.CharField(max_length=50)
    area = serializers.CharField(max_length=50, required=False, allow_blank=True, default="")
    latitude = serializers.FloatField(required=False, default=None)
    longitude = serializers.FloatField(required=False, default=None)
    location_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")


class CropSuggestionSerializer(serializers.Serializer):
    region = serializers.CharField(max_length=100)
    season = serializers.CharField(max_length=50)
    current_crop = serializers.CharField(
        max_length=100, required=False, allow_blank=True, default=""
    )
    latitude = serializers.FloatField(required=False, default=None)
    longitude = serializers.FloatField(required=False, default=None)
    location_name = serializers.CharField(max_length=200, required=False, allow_blank=True, default="")
