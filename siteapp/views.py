from django.http import JsonResponse
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash, login
from django.shortcuts import render, redirect
from django.contrib import messages
import json
from rest_framework import generics
from .models import Flight, Favorite, SearchHistory
from .serializers import FlightSerializer
from .forms import CustomUserCreationForm, EmailAndPasswordChangeForm

#Index page
@login_required
def index(request):
    return render(request, 'index.html')

#Auth Page
def auth(request):
    return render(request, 'registration/login.html')

# Register Page
def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('index')
        else:
            messages.error(request, 'Por favor corrige los errores a continuación.')
    else:
        form = CustomUserCreationForm()

    return render(request, 'registration/register.html', {'form': form})

# User panel
@login_required
def user_panel(request):
    if request.method == 'POST':
        form = EmailAndPasswordChangeForm(user=request.user, data=request.POST)

        if form.is_valid():
            form.save()
            if form.cleaned_data.get('new_password1'):
                user = request.user
                user.set_password(form.cleaned_data.get('new_password1'))
                user.save()
                update_session_auth_hash(request, user)
                messages.success(request, 'Tu contraseña ha sido actualizada con éxito.')
            messages.success(request, 'Tu correo ha sido actualizado con éxito.')
            return redirect('user_panel')
        else:
            messages.error(request, 'Error al actualizar la información. Por favor, corrige los errores a continuación.')
    else:
        form = EmailAndPasswordChangeForm(user=request.user)

    return render(request, 'panels/user_panel.html', {
        'form': form,
    })

# Add Favorite
@login_required
def add_favorite(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            flight_id = data.get('flight_id')

            if not flight_id:
                return JsonResponse({'error': 'No flight_id provided'}, status=400)

            flight = Flight.objects.get(id=flight_id)

            if Favorite.objects.filter(user=request.user, flight=flight).exists():
                return JsonResponse({'message': 'Flight already in favorites'}, status=200)

            Favorite.objects.create(user=request.user, flight=flight)

            return JsonResponse({'message': 'Flight added to favorites'}, status=201)

        except Flight.DoesNotExist:
            return JsonResponse({'error': 'Flight not found'}, status=404)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

# Delete Favorite
@login_required
def remove_favorite(request, flight_id):
    if request.method == 'POST':
        try:
            favorites = Favorite.objects.filter(flight__id=flight_id, user=request.user)

            if favorites.exists():
                favorites.delete()
                return JsonResponse({'message': 'Flight removed from favorites!'})
            else:
                return JsonResponse({'error': 'Favorite not found!'}, status=404)

        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'error': 'An error occurred'}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)


# Get favorite by id
@login_required
def get_favorites_id(request):
    if request.method == 'GET':
        try:
            favorites = Favorite.objects.filter(user=request.user).values('flight_id')

            favorite_flights = list(favorites)

            return JsonResponse({'favorites': favorite_flights}, status=200)

        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'error': 'An error occurred'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

# Get flights details just longitude and latitude
@login_required
def get_flight_details(request, flightnumber):
    try:
        flight = Flight.objects.get(flight_number=flightnumber)
        flight_data = {
            'latitude': flight.latitude,
            'longitude': flight.longitude,
        }
        return JsonResponse(flight_data, status=200)
    except Flight.DoesNotExist:
        return JsonResponse({'error': 'Flight not found'}, status=404)
    except Exception as e:
        print(f"Error: {str(e)}")
        return JsonResponse({'error': 'An error occurred'}, status=500)


# Get favorites of a user
@login_required
def get_user_favorites(request):
    flights_data = []
    if request.method == 'GET':
        try:
            favorites = Favorite.objects.filter(user=request.user).values_list('flight_id', flat=True)
            flights = Flight.objects.filter(id__in=favorites)
            flights_data = [
                {
                    'flight_number': flight.flight_number,
                    'airline': flight.airline,
                    'origin': flight.origin,
                    'destination': flight.destination,
                    'departure_time': flight.departure_time.strftime("%Y-%m-%d %H:%M:%S"),
                    'arrival_time': flight.arrival_time.strftime("%Y-%m-%d %H:%M:%S"),
                    'altitude': flight.altitude,
                    'speed': flight.speed,
                    'status': flight.status,
                    'latitude': flight.latitude,
                    'longitude': flight.longitude,
                }
                for flight in flights
            ]

            return JsonResponse({'favorites': flights_data}, status=200)
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'error': 'An error occurred'}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=400)

# Get flight into history
@login_required
def save_history_flights(request, flightnumber):
    if request.method == 'POST':
        try:
            flight = Flight.objects.get(flight_number=flightnumber)

            search_history, created = SearchHistory.objects.get_or_create(
                user=request.user,
                flight=flight
            )

            if not created:
                search_history.search_date = timezone.now()
                search_history.save()

            return JsonResponse({'message': 'Flight history saved successfully'}, status=201)

        except Flight.DoesNotExist:
            return JsonResponse({'error': 'Flight not found'}, status=404)

        except Exception as e:
            print(f"Error: {str(e)}")  # Agrega más información para depuración
            return JsonResponse({'error': 'An error occurred'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

# Get search history of flights
@login_required
def get_search_history(request):
    if request.method == 'GET':
        try:
            search_history = SearchHistory.objects.filter(user=request.user).select_related('flight')

            history_list = []
            for entry in search_history:
                flight = entry.flight
                if flight:
                    history_list.append({
                        'flight_number': flight.flight_number,
                        'airline': flight.airline,
                        'origin': flight.origin,
                        'destination': flight.destination,
                        'departure_time': flight.departure_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'arrival_time': flight.arrival_time.strftime('%Y-%m-%d %H:%M:%S'),
                        'status': flight.status,
                        'altitude': flight.altitude,
                        'speed': flight.speed,
                        'latitude': flight.latitude,
                        'longitude': flight.longitude,
                    })

            return JsonResponse({'history': history_list}, status=200)

        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({'error': 'An error occurred'}, status=500)

    return JsonResponse({'error': 'Invalid request method'}, status=400)

class FlightListCreate(generics.ListCreateAPIView):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer