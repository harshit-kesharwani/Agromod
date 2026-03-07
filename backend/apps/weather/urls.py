from django.urls import path
from . import views

urlpatterns = [
    path('weather/preferences/', views.WeatherPreferencesView.as_view()),
    path('weather/geocode/', views.GeocodeView.as_view()),
    path('weather/current/', views.CurrentWeatherView.as_view()),
    path('weather/alerts/', views.WeatherAlertsView.as_view()),
]
