from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.CategoryListView.as_view()),
    path('products/', views.ProductListView.as_view()),
    path('vendor/products/', views.VendorProductListCreateView.as_view()),
    path('vendor/products/<int:pk>/', views.VendorProductDetailView.as_view()),
]
