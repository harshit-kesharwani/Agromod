import logging
import random
import re
from django.core.cache import cache
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from .serializers import UserSerializer, RegisterSerializer
from .sms import send_otp_sms, format_e164

User = get_user_model()
logger = logging.getLogger(__name__)

OTP_EXPIRY = 600  # 10 minutes
CACHE_PREFIX = 'otp_reg_'


def _generate_otp():
    return f'{random.randint(0, 999999):06d}'


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh), 'user': UserSerializer(user).data}


class RegisterView(APIView):
    """
    Step 1: Validate registration data, send OTP.
    Does NOT create a user — stores pending data in cache.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        phone = ser.validated_data['phone']
        otp = _generate_otp()

        pending = {
            'otp': otp,
            'data': ser.validated_data,
        }
        cache.set(CACHE_PREFIX + phone, pending, OTP_EXPIRY)

        sms_sent = send_otp_sms(phone, otp)
        logger.info('Registration OTP for %s: sent=%s', phone, sms_sent)

        response_data = {
            'message': 'OTP sent to your mobile number. Please verify to complete registration.',
            'phone': phone,
        }
        return Response(response_data, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    """
    Step 2: Verify OTP and create the user only on success.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        phone = re.sub(r'[\s\-]', '', (request.data.get('phone') or ''))
        otp = (request.data.get('otp') or '').strip()
        if not phone or not otp:
            return Response({'detail': 'Phone and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)

        pending = cache.get(CACHE_PREFIX + phone)
        if not pending:
            return Response(
                {'detail': 'OTP expired or no registration found. Please register again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if pending['otp'] != otp:
            return Response({'detail': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        validated_data = pending['data']
        validated_data['is_verified'] = True
        fp = validated_data.pop('farmer_profile', None)
        vp = validated_data.pop('vendor_profile', None)
        role = validated_data.get('role', 'farmer')
        password = validated_data.pop('password')
        validated_data.pop('confirm_password', None)
        validated_data['username'] = phone

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.role = role
        user.is_verified = True
        user.save()

        if role == 'farmer':
            from .models import FarmerProfile
            FarmerProfile.objects.get_or_create(user=user, defaults={'region': ''})
        elif role == 'vendor':
            from .models import VendorProfile
            vp_data = vp or {}
            business_name = vp_data.get('business_name', '')
            contact_phone = vp_data.get('contact_phone', '') or phone
            VendorProfile.objects.get_or_create(
                user=user,
                defaults={'business_name': business_name, 'contact_phone': contact_phone},
            )

        cache.delete(CACHE_PREFIX + phone)

        out = tokens_for_user(user)
        out['role'] = user.role
        out['message'] = 'Registration complete. Welcome to Agromod!'
        return Response(out, status=status.HTTP_201_CREATED)


class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        phone = re.sub(r'[\s\-]', '', (request.data.get('phone') or ''))
        if not phone:
            return Response({'detail': 'Phone number is required.'}, status=status.HTTP_400_BAD_REQUEST)

        pending = cache.get(CACHE_PREFIX + phone)
        if not pending:
            return Response(
                {'detail': 'No pending registration found. Please register again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = _generate_otp()
        pending['otp'] = otp
        cache.set(CACHE_PREFIX + phone, pending, OTP_EXPIRY)

        sms_sent = send_otp_sms(phone, otp)
        logger.info('Resent OTP for %s: sent=%s', phone, sms_sent)

        return Response({'message': 'OTP has been resent to your mobile number.'}, status=status.HTTP_200_OK)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            phone = re.sub(r'[\s\-]', '', (request.data.get('phone') or '')) if request.data else ''
            password = request.data.get('password') if request.data else ''
            user_type = (request.data.get('user_type') or '').strip().lower() if request.data else ''
        except Exception as e:
            logger.exception('Login request.data read failed')
            return Response(
                {'detail': 'Invalid request body.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not phone or not password:
            return Response({'detail': 'Mobile number and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if user_type not in ('farmer', 'vendor'):
            return Response({'detail': 'Please select login type: Farmer or Vendor'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_verified:
            return Response(
                {'detail': 'Please verify your mobile number before logging in.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        role = getattr(user, 'role', 'farmer') or 'farmer'
        if role != user_type:
            return Response(
                {'detail': f'This account is registered as {role}. Please login as {role.title()}.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            payload = tokens_for_user(user)
            return Response(payload)
        except Exception as e:
            logger.exception('Login tokens_for_user failed')
            return Response({'detail': 'Login temporarily unavailable.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


RESET_CACHE_PREFIX = 'otp_reset_'


class ForgotPasswordView(APIView):
    """Send OTP to registered phone number for password reset."""
    permission_classes = [AllowAny]

    def post(self, request):
        phone = re.sub(r'[\s\-]', '', (request.data.get('phone') or ''))
        if not phone:
            return Response({'detail': 'Mobile number is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response(
                {'message': 'If an account exists with this number, an OTP has been sent.'},
                status=status.HTTP_200_OK,
            )

        otp = _generate_otp()
        cache.set(RESET_CACHE_PREFIX + phone, {'otp': otp}, OTP_EXPIRY)

        sms_sent = send_otp_sms(phone, otp)
        logger.info('Password reset OTP for %s: sent=%s', phone, sms_sent)

        return Response(
            {'message': 'If an account exists with this number, an OTP has been sent.', 'phone': phone},
            status=status.HTTP_200_OK,
        )


class ResetPasswordView(APIView):
    """Verify OTP and set new password."""
    permission_classes = [AllowAny]

    def post(self, request):
        phone = re.sub(r'[\s\-]', '', (request.data.get('phone') or ''))
        otp = (request.data.get('otp') or '').strip()
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        if not phone or not otp:
            return Response({'detail': 'Mobile number and OTP are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password or len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=status.HTTP_400_BAD_REQUEST)
        if new_password != confirm_password:
            return Response({'detail': 'Passwords do not match.'}, status=status.HTTP_400_BAD_REQUEST)

        pending = cache.get(RESET_CACHE_PREFIX + phone)
        if not pending:
            return Response({'detail': 'OTP expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        if pending['otp'] != otp:
            return Response({'detail': 'Invalid OTP. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(phone=phone)
        except User.DoesNotExist:
            return Response({'detail': 'No account found with this number.'}, status=status.HTTP_404_NOT_FOUND)

        user.set_password(new_password)
        user.save()
        cache.delete(RESET_CACHE_PREFIX + phone)

        return Response({'message': 'Password has been reset. You can now login.'}, status=status.HTTP_200_OK)
