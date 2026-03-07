from django.conf import settings
from django.db import models


class DiseaseQuery(models.Model):
    """Logs each disease analysis request."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    image = models.ImageField(upload_to="disease_images/")
    description = models.TextField(blank=True, default="")
    diagnosis = models.TextField(blank=True, default="")
    treatment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name_plural = "Disease queries"

    def __str__(self):
        return f"Disease query #{self.pk} - {self.created_at:%Y-%m-%d}"
