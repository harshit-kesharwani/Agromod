from django.db import models


class MandiPrice(models.Model):
    commodity = models.CharField(max_length=100)
    market = models.CharField(max_length=200)
    state = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    unit = models.CharField(max_length=20)
    date = models.DateField()
    source = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prices_mandiprice'
        managed = False


class HistoricalPrice(models.Model):
    commodity = models.CharField(max_length=100, db_index=True)
    state = models.CharField(max_length=100, default='All India', db_index=True)
    centre = models.CharField(max_length=100, default='', db_index=True)
    year = models.IntegerField(db_index=True)
    month = models.IntegerField(default=0)
    price = models.FloatField()
    unit = models.CharField(max_length=30, default='Rs/Quintal')
    source = models.CharField(max_length=50, default='GOI-2024')

    class Meta:
        db_table = 'prices_historicalprice'
        managed = False
