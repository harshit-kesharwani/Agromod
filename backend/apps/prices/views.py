from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Avg

from .models import HistoricalPrice


class CropListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        crops = (
            HistoricalPrice.objects
            .values_list('commodity', flat=True)
            .distinct()
            .order_by('commodity')
        )
        return Response(list(crops))


class StateListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        states = (
            HistoricalPrice.objects
            .values_list('state', flat=True)
            .distinct()
            .order_by('state')
        )
        return Response(list(states))


class CentreListView(APIView):
    """Return centres (cities) for a given state, fetched dynamically."""
    permission_classes = [AllowAny]

    def get(self, request):
        state = request.query_params.get('state', '')
        qs = HistoricalPrice.objects.exclude(centre='')
        if state:
            qs = qs.filter(state=state)
        centres = qs.values_list('centre', flat=True).distinct().order_by('centre')
        return Response(list(centres))


class YearListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        years = (
            HistoricalPrice.objects
            .values_list('year', flat=True)
            .distinct()
            .order_by('year')
        )
        return Response(list(years))


class PriceDataView(APIView):
    """
    Flexible price query. All filters are optional:
      ?commodity=Wheat
      ?state=All India
      ?centre=Delhi
      ?year=2023
      ?year=2024  (multiple years)

    Returns list of {commodity, state, centre, year, month, price, unit}.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = HistoricalPrice.objects.all()

        commodity = request.query_params.get('commodity')
        state = request.query_params.get('state')
        centre = request.query_params.get('centre')
        years = request.query_params.getlist('year')
        monthly_only = request.query_params.get('monthly')

        if commodity:
            qs = qs.filter(commodity=commodity)
        if state:
            qs = qs.filter(state=state)
        if centre:
            qs = qs.filter(centre=centre)
        if years:
            qs = qs.filter(year__in=[int(y) for y in years])
        if monthly_only == '1':
            qs = qs.filter(month__gt=0)

        qs = qs.order_by('commodity', 'year', 'month')

        data = list(
            qs.values('commodity', 'state', 'centre', 'year', 'month', 'price', 'unit')[:2000]
        )
        return Response(data)


class PriceSummaryView(APIView):
    """
    Aggregated view: average price per commodity per year.
    Optional: ?state=&centre=
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = HistoricalPrice.objects.filter(month__gt=0)

        commodity = request.query_params.get('commodity')
        state = request.query_params.get('state')
        centre = request.query_params.get('centre')

        if commodity:
            qs = qs.filter(commodity=commodity)
        if state:
            qs = qs.filter(state=state)
        if centre:
            qs = qs.filter(centre=centre)

        data = (
            qs.values('commodity', 'year')
            .annotate(avg_price=Avg('price'))
            .order_by('commodity', 'year')
        )
        return Response(list(data))
