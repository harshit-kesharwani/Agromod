from django.urls import path
from . import views

urlpatterns = [
    path('prices/crops/', views.CropListView.as_view()),
    path('prices/states/', views.StateListView.as_view()),
    path('prices/centres/', views.CentreListView.as_view()),
    path('prices/years/', views.YearListView.as_view()),
    path('prices/data/', views.PriceDataView.as_view()),
    path('prices/summary/', views.PriceSummaryView.as_view()),
]
