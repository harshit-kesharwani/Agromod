from rest_framework import serializers
from .models import Scheme, GovUpdate


class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = [
            'id', 'name', 'slug', 'short_description', 'description',
            'eligibility_criteria', 'documents_required', 'application_process',
            'official_link', 'state', 'category', 'created_at',
        ]


class GovUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = GovUpdate
        fields = [
            'id', 'title', 'summary', 'update_type', 'source',
            'source_url', 'video_url', 'image_url',
            'published_date', 'pinned', 'created_at',
        ]
