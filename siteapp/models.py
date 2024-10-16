from django.db import models
from django.contrib.auth.models import User

# Modelo de vuelos
class Flight(models.Model):
    flight_number = models.CharField(max_length=10, unique=True)
    airline = models.CharField(max_length=50)
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=[
        ('on time', 'On Time'),
        ('delayed', 'Delayed'),
        ('cancelled', 'Cancelled'),
    ])
    altitude = models.IntegerField(null=True, blank=True)
    speed = models.IntegerField(null=True, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.flight_number} - {self.airline}"

# Modelo de favoritos
class Favorite(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    flight = models.ForeignKey(Flight, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.flight.flight_number}"

# Modelo de historial de búsqueda
class SearchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    flight = models.ForeignKey(Flight, on_delete=models.CASCADE, null=True)
    search_time = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.flight.flight_number}"