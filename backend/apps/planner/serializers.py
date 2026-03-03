from rest_framework import serializers
from .models import CropPlan, Activity, PlannerNotification


class ActivitySerializer(serializers.ModelSerializer):
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'plan', 'name', 'due_date',
            'reminder_days_before', 'notes', 'completed',
            'is_overdue', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'is_overdue']


class CropPlanSerializer(serializers.ModelSerializer):
    activities = ActivitySerializer(many=True, read_only=True)

    class Meta:
        model = CropPlan
        fields = [
            'id', 'name', 'crop', 'start_date', 'end_date',
            'notes', 'activities', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CropPlanListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for plan lists (without nested activities)."""
    class Meta:
        model = CropPlan
        fields = [
            'id', 'name', 'crop', 'start_date', 'end_date',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlannerNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlannerNotification
        fields = ['id', 'title', 'body', 'read', 'activity', 'created_at']
        read_only_fields = ['id', 'created_at']
