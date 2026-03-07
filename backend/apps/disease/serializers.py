from rest_framework import serializers


class DiseaseAnalyzeSerializer(serializers.Serializer):
    image = serializers.ImageField()
    description = serializers.CharField(
        max_length=500, required=False, allow_blank=True, default=""
    )
