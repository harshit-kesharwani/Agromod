"""
Seed two dummy login accounts:
  - Farmer  -> phone: 9999900001, password: farmer123
  - Vendor  -> phone: 9999900002, password: vendor123
Both are pre-verified so they can log in immediately.
"""

from django.db import migrations
from django.contrib.auth.hashers import make_password


DUMMY_USERS = [
    {
        'phone': '9999900001',
        'username': '9999900001',
        'first_name': 'Demo',
        'last_name': 'Farmer',
        'role': 'farmer',
        'password': 'farmer123',
        'is_verified': True,
    },
    {
        'phone': '9999900002',
        'username': '9999900002',
        'first_name': 'Demo',
        'last_name': 'Vendor',
        'role': 'vendor',
        'password': 'vendor123',
        'is_verified': True,
    },
]


def seed_users(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    FarmerProfile = apps.get_model('accounts', 'FarmerProfile')
    VendorProfile = apps.get_model('accounts', 'VendorProfile')

    for entry in DUMMY_USERS:
        if User.objects.filter(phone=entry['phone']).exists():
            continue

        user = User.objects.create(
            phone=entry['phone'],
            username=entry['username'],
            first_name=entry['first_name'],
            last_name=entry['last_name'],
            role=entry['role'],
            password=make_password(entry['password']),
            is_verified=entry['is_verified'],
            is_active=True,
        )

        if entry['role'] == 'farmer':
            FarmerProfile.objects.get_or_create(user=user, defaults={'region': 'Demo Region'})
        elif entry['role'] == 'vendor':
            VendorProfile.objects.get_or_create(
                user=user,
                defaults={'business_name': 'Demo Vendor Store', 'contact_phone': entry['phone']},
            )


def remove_users(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(phone__in=['9999900001', '9999900002']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_backfill_phone_add_otp_fields'),
    ]

    operations = [
        migrations.RunPython(seed_users, remove_users),
    ]
