from django.urls import path
from . import views

urlpatterns = [
    path('schemes/', views.SchemeListView.as_view()),
    path('schemes/<slug:slug>/check_eligibility/', views.SchemeCheckEligibilityView.as_view()),
]
