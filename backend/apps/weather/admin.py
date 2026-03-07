from django.contrib import admin
from .models import WeatherPreference, WeatherAlert

admin.site.register(WeatherPreference)
admin.site.register(WeatherAlert)
