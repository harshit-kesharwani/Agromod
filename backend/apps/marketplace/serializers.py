from rest_framework import serializers
from django.conf import settings
from .models import Category, Product, Order, OrderItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    def get_category_name(self, obj):
        return obj.category.name if obj.category else ''

    def get_image_url(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        if request:
            media = settings.MEDIA_URL if settings.MEDIA_URL.startswith('/') else '/' + settings.MEDIA_URL
            return request.build_absolute_uri(media + str(obj.image))
        return obj.image.url

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'unit', 'stock', 'image', 'image_url', 'category', 'category_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['vendor']


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'unit', 'stock', 'image', 'category', 'is_active']


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', default='Deleted product', read_only=True)
    line_total = serializers.SerializerMethodField()

    def get_line_total(self, obj):
        return float(obj.price * obj.quantity)

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'price', 'quantity', 'line_total']
        read_only_fields = ['id', 'product_name', 'price', 'line_total']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['id', 'shipping_address', 'status', 'total', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'total', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField()
    items = serializers.ListField(child=serializers.DictField(), min_length=1)

    def validate_items(self, value):
        for item in value:
            if 'product_id' not in item or 'quantity' not in item:
                raise serializers.ValidationError('Each item must have product_id and quantity.')
            if int(item['quantity']) < 1:
                raise serializers.ValidationError('Quantity must be at least 1.')
        return value
