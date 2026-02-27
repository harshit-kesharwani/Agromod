from rest_framework import serializers
from django.conf import settings
from .models import Category, Product


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
