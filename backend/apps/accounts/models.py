import random
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone


class User(AbstractUser):
    ROLE_CHOICES = [('farmer', 'Farmer'), ('vendor', 'Vendor')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='farmer')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=15, unique=True)

    is_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, default='')
    otp_created_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = ['username']

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                condition=~models.Q(email=''),
                name='unique_email_when_provided',
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.phone
        super().save(*args, **kwargs)

    def generate_otp(self):
        self.otp = f'{random.randint(0, 999999):06d}'
        self.otp_created_at = timezone.now()
        self.save(update_fields=['otp', 'otp_created_at'])
        return self.otp

    def verify_otp(self, code):
        if not self.otp or not self.otp_created_at:
            return False
        if (timezone.now() - self.otp_created_at).total_seconds() > 600:
            return False
        if self.otp != code:
            return False
        self.is_verified = True
        self.otp = ''
        self.otp_created_at = None
        self.save(update_fields=['is_verified', 'otp', 'otp_created_at'])
        return True


class FarmerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    region = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True, default='')
    district = models.CharField(max_length=100, blank=True, default='')
    preferred_language = models.CharField(max_length=10, blank=True, default='')
    crops_of_interest = models.JSONField(default=list, blank=True)
    weather_alerts_email = models.BooleanField(default=False)
    planner_reminders_email = models.BooleanField(default=False)
    order_updates_email = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)


class VendorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    business_name = models.CharField(max_length=200, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True, default='')
