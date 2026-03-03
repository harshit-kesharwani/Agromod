import logging
import requests as http_requests
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WeatherPreference, WeatherAlert
from .serializers import WeatherPreferenceSerializer, WeatherAlertSerializer

logger = logging.getLogger(__name__)

OPEN_METEO_WEATHER = 'https://api.open-meteo.com/v1/forecast'
OPEN_METEO_GEOCODE = 'https://geocoding-api.open-meteo.com/v1/search'
NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse'

FROST_THRESHOLD_C = 2.0
HEAT_THRESHOLD_C = 40.0
HEAVY_RAIN_THRESHOLD_MM = 20.0


def _reverse_geocode(lat, lon):
    """Resolve lat/lon to a human-readable place name via Nominatim."""
    try:
        resp = http_requests.get(NOMINATIM_REVERSE, params={
            'lat': lat,
            'lon': lon,
            'format': 'json',
            'zoom': 10,
            'addressdetails': 1,
        }, headers={'User-Agent': 'Agromod/1.0'}, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        addr = data.get('address', {})
        city = addr.get('city') or addr.get('town') or addr.get('village') or addr.get('county') or ''
        state = addr.get('state', '')
        country = addr.get('country', '')
        parts = [p for p in (city, state, country) if p]
        return ', '.join(parts) if parts else data.get('display_name', '')
    except Exception:
        logger.exception('Reverse geocode failed')
        return ''


def _fetch_weather(lat, lon):
    """Fetch current weather from Open-Meteo (free, no key needed)."""
    resp = http_requests.get(OPEN_METEO_WEATHER, params={
        'latitude': lat,
        'longitude': lon,
        'current_weather': 'true',
    }, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    cw = data.get('current_weather', {})
    return {
        'temperature': cw.get('temperature'),
        'wind_speed': cw.get('windspeed'),
        'precipitation': None,
        'weather_code': cw.get('weathercode'),
    }


def _fetch_forecast(lat, lon):
    """Fetch 24-hour forecast for alert generation."""
    resp = http_requests.get(OPEN_METEO_WEATHER, params={
        'latitude': lat,
        'longitude': lon,
        'hourly': 'temperature_2m,precipitation',
        'forecast_days': 1,
    }, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    hourly = data.get('hourly', {})
    temps = hourly.get('temperature_2m', [])
    precips = hourly.get('precipitation', [])
    return temps, precips


def _generate_live_alerts(lat, lon, prefs):
    """Generate live weather alerts based on forecast data and user prefs."""
    alerts = []
    try:
        temps, precips = _fetch_forecast(lat, lon)
    except Exception:
        logger.exception('Failed to fetch forecast for alerts')
        return alerts

    if prefs.alert_frost and temps:
        min_temp = min(temps)
        if min_temp <= FROST_THRESHOLD_C:
            alerts.append({
                'message': f'Frost warning: temperature may drop to {min_temp:.1f}°C in the next 24 hours.',
            })

    if prefs.alert_heat and temps:
        max_temp = max(temps)
        if max_temp >= HEAT_THRESHOLD_C:
            alerts.append({
                'message': f'Heat wave alert: temperature may reach {max_temp:.1f}°C in the next 24 hours.',
            })

    if prefs.alert_heavy_rain and precips:
        total_rain = sum(p for p in precips if p)
        if total_rain >= HEAVY_RAIN_THRESHOLD_MM:
            alerts.append({
                'message': f'Heavy rain alert: up to {total_rain:.1f} mm of rain expected in the next 24 hours.',
            })

    return alerts


class WeatherPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref, _ = WeatherPreference.objects.get_or_create(user=request.user)
        return Response(WeatherPreferenceSerializer(pref).data)

    def put(self, request):
        pref, _ = WeatherPreference.objects.get_or_create(user=request.user)
        data = request.data.copy()
        loc_name = data.get('location_name', '')
        lat = data.get('latitude')
        lon = data.get('longitude')
        if lat is not None and lon is not None and loc_name in ('', 'Current location'):
            resolved = _reverse_geocode(lat, lon)
            if resolved:
                data['location_name'] = resolved
        ser = WeatherPreferenceSerializer(pref, data=data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        ser.save()
        return Response(ser.data)


class GeocodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if not query:
            return Response({'results': []})
        try:
            resp = http_requests.get(OPEN_METEO_GEOCODE, params={
                'name': query,
                'count': 5,
                'language': 'en',
                'format': 'json',
            }, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            results = []
            for r in data.get('results', []):
                results.append({
                    'lat': r.get('latitude'),
                    'lon': r.get('longitude'),
                    'name': r.get('name', ''),
                    'country': r.get('country', ''),
                })
            return Response({'results': results})
        except Exception:
            logger.exception('Geocode lookup failed')
            return Response({'results': []})


class CurrentWeatherView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            pref = WeatherPreference.objects.get(user=request.user)
        except WeatherPreference.DoesNotExist:
            return Response({'current': {}, 'location_name': ''})

        if pref.latitude is None or pref.longitude is None:
            return Response({'current': {}, 'location_name': pref.location_name})

        try:
            current = _fetch_weather(pref.latitude, pref.longitude)
        except Exception:
            logger.exception('Failed to fetch weather')
            return Response({'current': {}, 'location_name': pref.location_name})

        return Response({'current': current, 'location_name': pref.location_name})


class WeatherAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stored = WeatherAlert.objects.filter(user=request.user)
        serialized = WeatherAlertSerializer(stored, many=True).data

        live = []
        try:
            pref = WeatherPreference.objects.get(user=request.user)
            if pref.latitude is not None and pref.longitude is not None:
                live = _generate_live_alerts(pref.latitude, pref.longitude, pref)
        except WeatherPreference.DoesNotExist:
            pass
        except Exception:
            logger.exception('Error generating live alerts')

        return Response({'alerts': serialized, 'live': live})

    def patch(self, request):
        ids = request.data.get('mark_read', [])
        if ids:
            WeatherAlert.objects.filter(user=request.user, id__in=ids).update(read=True)
        return Response({'status': 'ok'})
