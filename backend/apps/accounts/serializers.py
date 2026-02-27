from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    farmer_profile = serializers.DictField(required=False, allow_null=True)
    vendor_profile = serializers.DictField(required=False, allow_null=True)
    phone = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = User
        fields = ['email', 'password', 'first_name', 'last_name', 'phone', 'role', 'farmer_profile', 'vendor_profile']

    def create(self, validated_data):
        fp = validated_data.pop('farmer_profile', None)
        vp = validated_data.pop('vendor_profile', None)
        role = validated_data.get('role', 'farmer')
        password = validated_data.pop('password')
        validated_data['username'] = validated_data.get('email')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.role = role
        user.save()
        if role == 'farmer':
            from .models import FarmerProfile
            FarmerProfile.objects.get_or_create(user=user, defaults={'region': '', 'preferred_crops': ''})
        elif role == 'vendor':
            from .models import VendorProfile
            vp_data = vp or {}
            business_name = vp_data.get('business_name', '')
            contact_phone = vp_data.get('contact_phone', '') or validated_data.get('phone', '')
            VendorProfile.objects.get_or_create(
                user=user,
                defaults={'business_name': business_name, 'contact_phone': contact_phone}
            )
        return user
