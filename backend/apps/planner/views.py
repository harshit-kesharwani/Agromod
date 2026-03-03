import datetime
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CropPlan, Activity, PlannerNotification
from .serializers import (
    CropPlanSerializer,
    CropPlanListSerializer,
    ActivitySerializer,
    PlannerNotificationSerializer,
)


def _generate_activity_reminders(user):
    """Create notifications for activities whose reminder date has arrived."""
    today = timezone.now().date()
    activities = Activity.objects.filter(
        plan__user=user,
        completed=False,
        due_date__gte=today,
    )
    created = 0
    for act in activities:
        if act.reminder_date <= today:
            already_sent = PlannerNotification.objects.filter(
                user=user,
                activity=act,
            ).exists()
            if not already_sent:
                days_left = (act.due_date - today).days
                PlannerNotification.objects.create(
                    user=user,
                    activity=act,
                    title=f'Reminder: {act.name}',
                    body=(
                        f'Activity "{act.name}" for plan "{act.plan.name}" '
                        f'is due in {days_left} day(s) ({act.due_date}).'
                    ),
                )
                created += 1

    overdue = Activity.objects.filter(
        plan__user=user,
        completed=False,
        due_date__lt=today,
    )
    for act in overdue:
        already_sent = PlannerNotification.objects.filter(
            user=user,
            activity=act,
            title__startswith='Overdue:',
        ).exists()
        if not already_sent:
            PlannerNotification.objects.create(
                user=user,
                activity=act,
                title=f'Overdue: {act.name}',
                body=(
                    f'Activity "{act.name}" for plan "{act.plan.name}" '
                    f'was due on {act.due_date} and is now overdue.'
                ),
            )
            created += 1
    return created


class PlansView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = CropPlan.objects.filter(user=request.user)
        return Response(CropPlanListSerializer(plans, many=True).data)

    def post(self, request):
        ser = CropPlanListSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        ser.save(user=request.user)
        return Response(ser.data, status=status.HTTP_201_CREATED)


class PlanDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            plan = CropPlan.objects.get(pk=pk, user=request.user)
        except CropPlan.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CropPlanSerializer(plan).data)

    def put(self, request, pk):
        try:
            plan = CropPlan.objects.get(pk=pk, user=request.user)
        except CropPlan.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        ser = CropPlanListSerializer(plan, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        try:
            plan = CropPlan.objects.get(pk=pk, user=request.user)
        except CropPlan.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        plan.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ActivitiesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Activity.objects.filter(plan__user=request.user)
        plan_id = request.query_params.get('plan')
        if plan_id:
            qs = qs.filter(plan_id=plan_id)
        return Response(ActivitySerializer(qs, many=True).data)

    def post(self, request):
        plan_id = request.data.get('plan')
        if not plan_id:
            return Response(
                {'plan': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            CropPlan.objects.get(pk=plan_id, user=request.user)
        except CropPlan.DoesNotExist:
            return Response(
                {'plan': ['Plan not found.']},
                status=status.HTTP_404_NOT_FOUND,
            )
        ser = ActivitySerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        ser.save()
        return Response(ser.data, status=status.HTTP_201_CREATED)


class ActivityDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        try:
            activity = Activity.objects.get(pk=pk, plan__user=request.user)
        except Activity.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        ser = ActivitySerializer(activity, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        ser.save()
        return Response(ser.data)

    def delete(self, request, pk):
        try:
            activity = Activity.objects.get(pk=pk, plan__user=request.user)
        except Activity.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        activity.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlannerNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        _generate_activity_reminders(request.user)
        notifications = PlannerNotification.objects.filter(user=request.user)
        return Response({
            'notifications': PlannerNotificationSerializer(notifications, many=True).data,
        })

    def patch(self, request):
        ids = request.data.get('mark_read', [])
        if ids:
            PlannerNotification.objects.filter(
                user=request.user, id__in=ids,
            ).update(read=True)
        return Response({'status': 'ok'})
