from django.urls import path

from . import views

urlpatterns = [
    path("yield/predict/", views.yield_predict, name="yield-predict"),
    path("yield/suggestions/", views.crop_suggestions, name="crop-suggestions"),
]
