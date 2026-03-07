from django.db import migrations


def update_video(apps, schema_editor):
    GovUpdate = apps.get_model('schemes', 'GovUpdate')
    GovUpdate.objects.filter(
        update_type='video',
        video_url='https://www.youtube.com/embed/dOVYm3rMSJw',
    ).update(
        title='PM Shri Narendra Modi Addresses Post-Budget Webinar on Agriculture & Rural Transformation',
        summary=(
            'Watch PM Narendra Modi address the Post-Budget Webinar on Agriculture & Rural '
            'Transformation — key policy announcements and vision for Indian farmers.'
        ),
        source_url='https://youtu.be/EHpwmrh_9pU',
        video_url='https://www.youtube.com/embed/EHpwmrh_9pU',
    )


class Migration(migrations.Migration):
    dependencies = [
        ('schemes', '0004_seed_gov_updates'),
    ]

    operations = [
        migrations.RunPython(update_video, migrations.RunPython.noop),
    ]
