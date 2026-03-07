"""
Two-phase migration:
  1. Add new fields (is_verified, otp, otp_created_at) and relax email.
  2. Backfill empty phone values so unique constraint can be applied.
  3. Apply unique constraint on phone and conditional unique on email.
"""
from django.db import migrations, models


def backfill_empty_phones(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    for idx, user in enumerate(User.objects.filter(phone=''), start=1):
        user.phone = f'PLACEHOLDER_{user.pk}'
        user.save(update_fields=['phone'])


def reverse_backfill(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    User.objects.filter(phone__startswith='PLACEHOLDER_').update(phone='')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_alter_farmerprofile_crops_of_interest'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='user',
            options={},
        ),
        migrations.AddField(
            model_name='user',
            name='is_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='otp',
            field=models.CharField(blank=True, default='', max_length=6),
        ),
        migrations.AddField(
            model_name='user',
            name='otp_created_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(blank=True, default='', max_length=254),
        ),
        # Mark existing users as verified since they registered before OTP was required
        migrations.RunSQL(
            "UPDATE accounts_user SET is_verified = TRUE WHERE is_verified = FALSE;",
            migrations.RunSQL.noop,
        ),
        # Backfill empty phone fields with unique placeholders before adding unique constraint
        migrations.RunPython(backfill_empty_phones, reverse_backfill),
        # Now safe to make phone unique
        migrations.AlterField(
            model_name='user',
            name='phone',
            field=models.CharField(max_length=15, unique=True),
        ),
        migrations.AddConstraint(
            model_name='user',
            constraint=models.UniqueConstraint(
                condition=models.Q(('email', ''), _negated=True),
                fields=('email',),
                name='unique_email_when_provided',
            ),
        ),
    ]
