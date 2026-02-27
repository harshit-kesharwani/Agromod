from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, FarmerProfile, VendorProfile

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'role', 'first_name', 'last_name']
    ordering = ['email']
    fieldsets = BaseUserAdmin.fieldsets + (('Role', {'fields': ('role',)}),)

@admin.register(FarmerProfile)
class FarmerProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'region']

@admin.register(VendorProfile)
class VendorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'business_name']
