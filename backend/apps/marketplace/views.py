from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer, ProductCreateUpdateSerializer


class CategoryListView(APIView):
    permission_classes = []

    def get(self, request):
        cats = Category.objects.all().order_by('name')
        return Response(CategorySerializer(cats, many=True).data)


class ProductListView(APIView):
    """List all active products for marketplace (farmers)."""
    permission_classes = []

    def get(self, request):
        products = Product.objects.filter(is_active=True).select_related('category', 'vendor').order_by('-updated_at')
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)


class VendorProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, 'role', None) != 'vendor':
            return Response({'detail': 'Vendor only'}, status=status.HTTP_403_FORBIDDEN)
        products = Product.objects.filter(vendor=request.user).select_related('category').order_by('-updated_at')
        return Response(ProductSerializer(products, many=True, context={'request': request}).data)

    def post(self, request):
        if getattr(request.user, 'role', None) != 'vendor':
            return Response({'detail': 'Vendor only'}, status=status.HTTP_403_FORBIDDEN)
        ser = ProductCreateUpdateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        ser.save(vendor=request.user)
        return Response(ProductSerializer(ser.instance, context={'request': request}).data, status=status.HTTP_201_CREATED)


class VendorProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, request, pk):
        return get_object_or_404(Product, pk=pk, vendor=request.user)

    def patch(self, request, pk):
        if getattr(request.user, 'role', None) != 'vendor':
            return Response({'detail': 'Vendor only'}, status=status.HTTP_403_FORBIDDEN)
        product = self.get_object(request, pk)
        ser = ProductCreateUpdateSerializer(product, data=request.data, partial=True)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        ser.save()
        return Response(ProductSerializer(ser.instance, context={'request': request}).data)

    def delete(self, request, pk):
        if getattr(request.user, 'role', None) != 'vendor':
            return Response({'detail': 'Vendor only'}, status=status.HTTP_403_FORBIDDEN)
        product = self.get_object(request, pk)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
