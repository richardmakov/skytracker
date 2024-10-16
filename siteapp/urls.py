from django.urls import path
from . import views
from django.contrib.auth import views as auth_views
from .views import FlightListCreate, add_favorite, remove_favorite, get_user_favorites, \
    get_flight_details, save_history_flights, get_search_history, get_favorites_id

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(next_page='index'), name='logout'),
    path('register/', views.register, name='register'),
    path('panels/user', views.user_panel, name='user_panel'),
    path('api/flights/', FlightListCreate.as_view(), name='flight-list-create'),
    path('api/favorites/add/', add_favorite, name='add_favorite'),
    path('api/favorites/remove/<int:flight_id>/', remove_favorite, name='remove_favorite'),
    path('api/favorites/', get_favorites_id, name='get_favorites'),
    path('api/favorites/user', get_user_favorites, name='get_favorites_user'),
    path('api/flights/<str:flightnumber>/', get_flight_details, name='get_flight_details'),
    path('api/flights/history/save/<str:flightnumber>/', save_history_flights, name='save_history_flights'),
    path('api/flights/history/get', get_search_history, name='get_search_history'),

]