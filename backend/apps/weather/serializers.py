from rest_framework import serializers
from .models import WeatherPreference, WeatherAlert


class WeatherPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherPreference
        fields = [
            'latitude', 'longitude', 'location_name',
            'email_alerts', 'alert_frost', 'alert_heavy_rain', 'alert_heat',
        ]


class WeatherAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeatherAlert
        fields = ['id', 'title', 'body', 'read', 'created_at']
