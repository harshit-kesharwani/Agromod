from django.db import models
from django.conf import settings


class YieldQuery(models.Model):
    """Logs each yield prediction request for analytics and caching."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    crop = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    season = models.CharField(max_length=50)
    area = models.CharField(max_length=50, blank=True, default="")
    prediction = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.crop} - {self.region} - {self.season}"


class CropSuggestionQuery(models.Model):
    """Logs each crop suggestion request."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    region = models.CharField(max_length=100)
    season = models.CharField(max_length=50)
    current_crop = models.CharField(max_length=100, blank=True, default="")
    suggestions = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.region} - {self.season}"
