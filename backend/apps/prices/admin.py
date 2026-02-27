from django.contrib import admin
from .models import MandiPrice, HistoricalPrice

admin.site.register(MandiPrice)
admin.site.register(HistoricalPrice)
