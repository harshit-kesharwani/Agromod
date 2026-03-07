from django.conf import settings
from django.db import models
from django.utils import timezone
import datetime


class CropPlan(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='crop_plans',
    )
    name = models.CharField(max_length=200)
    crop = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.crop})'


class Activity(models.Model):
    plan = models.ForeignKey(
        CropPlan,
        on_delete=models.CASCADE,
        related_name='activities',
    )
    name = models.CharField(max_length=200)
    due_date = models.DateField()
    reminder_days_before = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True, default='')
    completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date']
        verbose_name_plural = 'activities'

    def __str__(self):
        return self.name

    @property
    def reminder_date(self):
        return self.due_date - datetime.timedelta(days=self.reminder_days_before)

    @property
    def is_overdue(self):
        return not self.completed and self.due_date < timezone.now().date()


class PlannerNotification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='planner_notifications',
    )
    activity = models.ForeignKey(
        Activity,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=200)
    body = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
