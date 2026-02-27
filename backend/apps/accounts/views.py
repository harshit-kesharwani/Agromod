import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.conf import settings
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()
logger = logging.getLogger(__name__)


def tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh), 'user': UserSerializer(user).data}


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        user = ser.save()
        out = tokens_for_user(user)
        out['role'] = user.role
        return Response(out, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = (request.data.get('email') or '').strip() if request.data else ''
            password = request.data.get('password') if request.data else ''
            user_type = (request.data.get('user_type') or '').strip().lower() if request.data else ''
        except Exception as e:
            logger.exception('Login request.data read failed')
            return Response(
                {'detail': 'Invalid request body.' + (' ' + str(e) if settings.DEBUG else '')},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not email or not password:
            return Response({'detail': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)
        if user_type not in ('farmer', 'vendor'):
            return Response({'detail': 'Please select login type: Farmer or Vendor'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        role = getattr(user, 'role', 'farmer') or 'farmer'
        if role != user_type:
            return Response(
                {'detail': f'This account is registered as {role}. Please login as {role.title()}.'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            payload = tokens_for_user(user)
            return Response(payload)
        except Exception as e:
            logger.exception('Login tokens_for_user failed')
            if settings.DEBUG:
                return Response(
                    {'detail': f'Server error during login: {type(e).__name__}: {e}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            return Response({'detail': 'Login temporarily unavailable.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        if not email:
            return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'message': 'If an account exists with this email, you will receive reset instructions.'},
                status=status.HTTP_200_OK
            )
        token = default_token_generator.make_token(user)
        payload = {'message': 'If an account exists with this email, you will receive reset instructions.'}
        if getattr(settings, 'DEBUG', False):
            payload['reset_token'] = token
            payload['uidb64'] = user.pk
        return Response(payload, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        token = (request.data.get('token') or '').strip()
        new_password = request.data.get('new_password')
        if not email or not token:
            return Response({'detail': 'Email and reset token are required'}, status=status.HTTP_400_BAD_REQUEST)
        if not new_password or len(new_password) < 6:
            return Response({'detail': 'Password must be at least 6 characters'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)
        if not default_token_generator.check_token(user, token):
            return Response({'detail': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password has been reset. You can now login.'}, status=status.HTTP_200_OK)
