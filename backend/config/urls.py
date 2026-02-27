"""Root URL configuration."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('apps.accounts.urls')),
    path('api/', include('apps.chatbot.urls')),
    path('api/', include('apps.disease.urls')),
    path('api/', include('apps.marketplace.urls')),
    path('api/', include('apps.planner.urls')),
    path('api/', include('apps.prices.urls')),
    path('api/', include('apps.schemes.urls')),
    path('api/', include('apps.weather.urls')),
    path('api/', include('apps.yield_prediction.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
