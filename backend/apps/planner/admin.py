from django.contrib import admin
from .models import CropPlan, Activity, PlannerNotification


class ActivityInline(admin.TabularInline):
    model = Activity
    extra = 0


@admin.register(CropPlan)
class CropPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'crop', 'user', 'start_date', 'end_date', 'created_at']
    list_filter = ['crop', 'start_date']
    search_fields = ['name', 'crop']
    inlines = [ActivityInline]


@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['name', 'plan', 'due_date', 'completed', 'reminder_days_before']
    list_filter = ['completed', 'due_date']
    search_fields = ['name']


@admin.register(PlannerNotification)
class PlannerNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'read', 'created_at']
    list_filter = ['read', 'created_at']
