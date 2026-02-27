from django.core.management.base import BaseCommand
from django.utils.text import slugify
from ...models import Category


DEFAULT_CATEGORIES = [
    'Seeds',
    'Fertilizers',
    'Pesticides',
    'Equipment',
    'Tools',
    'Organic',
]


class Command(BaseCommand):
    help = 'Create default product categories if they do not exist.'

    def handle(self, *args, **options):
        created = 0
        for name in DEFAULT_CATEGORIES:
            slug = slugify(name) or name.lower().replace(' ', '-')
            _, was_created = Category.objects.get_or_create(slug=slug, defaults={'name': name})
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f'Categories: {created} created, {len(DEFAULT_CATEGORIES) - created} already existed.'))
