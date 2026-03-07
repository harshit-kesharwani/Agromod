from django.db import migrations
from datetime import date


GOV_UPDATES = [
    {
        'title': 'PM-KISAN 17th Installment Released — Rs 2,000 Sent to Farmer Accounts',
        'summary': (
            'The 17th installment of PM-KISAN Samman Nidhi has been released by the government. '
            'Over 9.5 crore farmers will receive Rs 2,000 directly in their bank accounts. '
            'Check your payment status on pmkisan.gov.in using your Aadhaar or mobile number.'
        ),
        'update_type': 'scheme_update',
        'source': 'Ministry of Agriculture',
        'source_url': 'https://pmkisan.gov.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 6, 9),
        'pinned': True,
    },
    {
        'title': 'PM Shri Narendra Modi Addresses Post-Budget Webinar on Agriculture & Rural Transformation',
        'summary': (
            'Watch PM Narendra Modi address the Post-Budget Webinar on Agriculture & Rural '
            'Transformation — key policy announcements and vision for Indian farmers.'
        ),
        'update_type': 'video',
        'source': 'Government of India',
        'source_url': 'https://youtu.be/EHpwmrh_9pU',
        'video_url': 'https://www.youtube.com/embed/EHpwmrh_9pU',
        'image_url': '',
        'published_date': date(2025, 5, 20),
        'pinned': False,
    },
    {
        'title': 'PMFBY Kharif 2025 Enrollment Open — Last Date 31 July 2025',
        'summary': (
            'Farmers can now enroll for crop insurance under Pradhan Mantri Fasal Bima Yojana '
            'for the Kharif 2025 season. Premium is just 2% for food crops. '
            'Visit your nearest bank, CSC center, or apply online at pmfby.gov.in before the deadline.'
        ),
        'update_type': 'announcement',
        'source': 'PMFBY Portal',
        'source_url': 'https://pmfby.gov.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 6, 1),
        'pinned': True,
    },
    {
        'title': 'Kisan Credit Card Interest Subsidy Extended for 2025-26',
        'summary': (
            'The government has extended the interest subsidy on Kisan Credit Card loans. '
            'Farmers can continue to get crop loans up to Rs 3 lakh at just 4% annual interest. '
            'The subsidy applies to loans repaid within one year. Apply at your nearest bank branch.'
        ),
        'update_type': 'scheme_update',
        'source': 'Reserve Bank of India',
        'source_url': 'https://www.rbi.org.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 4, 15),
        'pinned': False,
    },
    {
        'title': 'Soil Health Card Scheme — Free Soil Testing for All Farmers',
        'summary': (
            'Under the Soil Health Card scheme, farmers can get their soil tested for free at '
            'government labs. The card gives crop-wise fertilizer recommendations to improve yield '
            'and reduce input costs. Visit your local Krishi Vigyan Kendra to collect soil samples.'
        ),
        'update_type': 'announcement',
        'source': 'Department of Agriculture',
        'source_url': 'https://soilhealth.dac.gov.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 5, 10),
        'pinned': False,
    },
    {
        'title': 'e-NAM: Sell Your Produce Online at Best Mandi Prices',
        'summary': (
            'The Electronic National Agriculture Market (e-NAM) platform allows farmers to sell '
            'their crops to buyers across the country. Register for free at enam.gov.in. '
            'Over 1,300 mandis are now connected. Get better prices by reaching more buyers directly.'
        ),
        'update_type': 'announcement',
        'source': 'e-NAM Portal',
        'source_url': 'https://enam.gov.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 3, 25),
        'pinned': False,
    },
    {
        'title': 'Pradhan Mantri Krishi Sinchayee Yojana — Micro Irrigation Subsidy Up to 55%',
        'summary': (
            'Under PMKSY, farmers can get 55% subsidy on drip irrigation and sprinkler systems. '
            'Small and marginal farmers are eligible for even higher assistance. '
            'Apply through your State Agriculture Department or visit pmksy.gov.in.'
        ),
        'update_type': 'scheme_update',
        'source': 'Ministry of Agriculture',
        'source_url': 'https://pmksy.gov.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 4, 5),
        'pinned': False,
    },
    {
        'title': 'Minimum Support Price (MSP) Increased for Kharif 2025 Crops',
        'summary': (
            'The government has approved MSP increase for all major Kharif crops. '
            'Paddy MSP raised to Rs 2,450/quintal, Jowar to Rs 3,650/quintal, and Cotton to '
            'Rs 7,621/quintal. Procurement will begin at harvest time through APMC mandis.'
        ),
        'update_type': 'announcement',
        'source': 'Press Information Bureau',
        'source_url': 'https://pib.gov.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 6, 5),
        'pinned': False,
    },
    {
        'title': 'Namo Drone Didi Scheme — Drones for Women Self-Help Groups',
        'summary': (
            'Under the Namo Drone Didi scheme, 15,000 women-led Self-Help Groups will receive '
            'agricultural drones for pesticide spraying and crop monitoring. Training and subsidies '
            'are provided by the government. Contact your local District Agriculture Office to apply.'
        ),
        'update_type': 'announcement',
        'source': 'Ministry of Agriculture',
        'source_url': 'https://agricoop.nic.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 2, 15),
        'pinned': False,
    },
    {
        'title': 'Digital Agriculture Mission — AI-Powered Crop Advisory Now Available',
        'summary': (
            'The Digital Agriculture Mission has launched AI-based crop advisory services in 100 '
            'districts. Farmers can get personalized crop recommendations, pest alerts, and weather '
            'forecasts via the Kisan e-Mitra app or by calling 1800-180-1551 (toll-free).'
        ),
        'update_type': 'scheme_update',
        'source': 'Ministry of Agriculture',
        'source_url': 'https://agricoop.nic.in/',
        'video_url': '',
        'image_url': '',
        'published_date': date(2025, 5, 28),
        'pinned': False,
    },
]


def seed_gov_updates(apps, schema_editor):
    GovUpdate = apps.get_model('schemes', 'GovUpdate')
    for data in GOV_UPDATES:
        GovUpdate.objects.update_or_create(title=data['title'], defaults=data)


def remove_gov_updates(apps, schema_editor):
    GovUpdate = apps.get_model('schemes', 'GovUpdate')
    GovUpdate.objects.filter(title__in=[u['title'] for u in GOV_UPDATES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('schemes', '0003_seed_schemes'),
    ]

    operations = [
        migrations.RunPython(seed_gov_updates, remove_gov_updates),
    ]
