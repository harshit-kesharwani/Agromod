from rest_framework import serializers
from .models import Scheme


class SchemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scheme
        fields = [
            'id', 'name', 'slug', 'short_description', 'description',
            'eligibility_criteria', 'documents_required', 'application_process',
            'official_link', 'state', 'category', 'created_at',
        ]
