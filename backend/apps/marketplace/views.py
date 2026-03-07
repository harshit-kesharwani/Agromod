from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from django.db import transaction
from .models import Category, Product, Order, OrderItem
from .serializers import (
    CategorySerializer, ProductSerializer, ProductCreateUpdateSerializer,
    OrderSerializer, OrderCreateSerializer,
)


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


class OrderListCreateView(APIView):
    """Farmer: list own orders (GET) and place a new order (POST)."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)

    @transaction.atomic
    def post(self, request):
        ser = OrderCreateSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        order = Order.objects.create(
            user=request.user,
            shipping_address=ser.validated_data['shipping_address'],
        )

        total = 0
        for item_data in ser.validated_data['items']:
            product = Product.objects.select_for_update().filter(
                pk=item_data['product_id'], is_active=True
            ).first()
            if not product:
                raise_order_error(order, f"Product {item_data['product_id']} not found or inactive.")
            qty = int(item_data['quantity'])
            if product.stock < qty:
                raise_order_error(order, f"Not enough stock for {product.name}. Available: {product.stock}.")
            OrderItem.objects.create(
                order=order,
                product=product,
                price=product.price,
                quantity=qty,
            )
            product.stock -= qty
            product.save(update_fields=['stock'])
            total += product.price * qty

        order.total = total
        order.save(update_fields=['total'])

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class VendorOrderListView(APIView):
    """Vendor: list orders that contain their products."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if getattr(request.user, 'role', None) != 'vendor':
            return Response({'detail': 'Vendor only'}, status=status.HTTP_403_FORBIDDEN)
        order_ids = OrderItem.objects.filter(
            product__vendor=request.user
        ).values_list('order_id', flat=True).distinct()
        orders = Order.objects.filter(pk__in=order_ids).prefetch_related('items').order_by('-created_at')
        return Response(OrderSerializer(orders, many=True).data)


class VendorOrderDetailView(APIView):
    """Vendor: update order status."""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        if getattr(request.user, 'role', None) != 'vendor':
            return Response({'detail': 'Vendor only'}, status=status.HTTP_403_FORBIDDEN)
        has_items = OrderItem.objects.filter(order_id=pk, product__vendor=request.user).exists()
        if not has_items:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        order = get_object_or_404(Order, pk=pk)
        new_status = request.data.get('status')
        if new_status and new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save(update_fields=['status'])
        return Response(OrderSerializer(order).data)


def raise_order_error(order, message):
    order.delete()
    from rest_framework.exceptions import ValidationError
    raise ValidationError({'detail': message})
