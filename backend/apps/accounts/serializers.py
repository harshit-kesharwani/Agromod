import re
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_verified']


class RegisterSerializer(serializers.Serializer):
    phone = serializers.CharField(required=True)
    email = serializers.EmailField(required=False, allow_blank=True, default='')
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(choices=['farmer', 'vendor'], default='farmer')
    farmer_profile = serializers.DictField(required=False, allow_null=True)
    vendor_profile = serializers.DictField(required=False, allow_null=True)

    def validate_phone(self, value):
        cleaned = re.sub(r'[\s\-]', '', value)
        if not re.match(r'^\+?\d{10,15}$', cleaned):
            raise serializers.ValidationError('Enter a valid mobile number (10-15 digits).')
        if cleaned.startswith('+'):
            pass
        elif len(cleaned) == 10:
            cleaned = cleaned
        if User.objects.filter(phone=cleaned).exists():
            raise serializers.ValidationError('An account with this mobile number already exists.')
        return cleaned

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data
