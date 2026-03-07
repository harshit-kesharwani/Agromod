from django.urls import path

from . import views

urlpatterns = [
    path("disease/analyze/", views.analyze_disease, name="disease-analyze"),
]
