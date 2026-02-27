from django.db import models


class Scheme(models.Model):
    name = models.CharField(max_length=300)
    slug = models.SlugField(max_length=50, unique=True)
    short_description = models.CharField(max_length=500, blank=True, default='')
    description = models.TextField(blank=True, default='')
    eligibility_criteria = models.TextField(blank=True, default='')
    documents_required = models.TextField(blank=True, default='')
    application_process = models.TextField(blank=True, default='')
    official_link = models.URLField(max_length=200, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    category = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
