from django.conf import settings
from django.db import models


class WeatherPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weather_preference',
    )
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    location_name = models.CharField(max_length=200, blank=True, default='')
    email_alerts = models.BooleanField(default=True)
    alert_frost = models.BooleanField(default=True)
    alert_heavy_rain = models.BooleanField(default=True)
    alert_heat = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user} – {self.location_name or "no location"}'


class WeatherAlert(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weather_alerts',
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
