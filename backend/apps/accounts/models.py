from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = [('farmer', 'Farmer'), ('vendor', 'Vendor')]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='farmer')
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, default='')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def save(self, *args, **kwargs):
        if not self.username and self.email:
            self.username = self.email
        super().save(*args, **kwargs)


class FarmerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='farmer_profile')
    region = models.CharField(max_length=100, blank=True)
    preferred_crops = models.CharField(max_length=255, blank=True)


class VendorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    business_name = models.CharField(max_length=200, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True, default='')
