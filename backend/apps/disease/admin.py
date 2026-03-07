from django.contrib import admin

from .models import DiseaseQuery


@admin.register(DiseaseQuery)
class DiseaseQueryAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "diagnosis", "created_at")
    list_filter = ("created_at",)
    readonly_fields = ("created_at",)
