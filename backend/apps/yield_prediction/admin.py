from django.contrib import admin

from .models import CropSuggestionQuery, YieldQuery


@admin.register(YieldQuery)
class YieldQueryAdmin(admin.ModelAdmin):
    list_display = ("crop", "region", "season", "user", "created_at")
    list_filter = ("season", "region")
    search_fields = ("crop", "region")
    readonly_fields = ("prediction", "created_at")


@admin.register(CropSuggestionQuery)
class CropSuggestionQueryAdmin(admin.ModelAdmin):
    list_display = ("region", "season", "current_crop", "user", "created_at")
    list_filter = ("season", "region")
    search_fields = ("region",)
    readonly_fields = ("suggestions", "created_at")
