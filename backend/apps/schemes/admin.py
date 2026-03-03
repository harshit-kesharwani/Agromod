from django.contrib import admin
from .models import Scheme, GovUpdate

admin.site.register(Scheme)


@admin.register(GovUpdate)
class GovUpdateAdmin(admin.ModelAdmin):
    list_display = ['title', 'update_type', 'source', 'published_date', 'pinned']
    list_filter = ['update_type', 'pinned', 'published_date']
    search_fields = ['title', 'summary']
    list_editable = ['pinned']
