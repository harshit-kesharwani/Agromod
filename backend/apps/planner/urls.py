from django.urls import path
from . import views

urlpatterns = [
    path('planner/plans/', views.PlansView.as_view()),
    path('planner/plans/<int:pk>/', views.PlanDetailView.as_view()),
    path('planner/activities/', views.ActivitiesView.as_view()),
    path('planner/activities/<int:pk>/', views.ActivityDetailView.as_view()),
    path('planner/notifications/', views.PlannerNotificationsView.as_view()),
]
