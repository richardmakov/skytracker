import requests
import random
from faker import Faker
from datetime import datetime, timedelta

# Inicializar Faker para generar datos ficticios
fake = Faker()

# URL de la API para agregar vuelos
url = 'http://localhost:8000/api/flights/'

flights = []

# Generar 100 vuelos ficticios
for _ in range(100):
    flight_number = f"{random.choice(['AA', 'DL', 'UA', 'SW'])}{random.randint(100, 999)}"
    departure_time = datetime.utcnow() + timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
    arrival_time = departure_time + timedelta(hours=random.randint(1, 5))

    flight = {
        "flight_number": flight_number,
        "airline": random.choice(['American Airlines', 'Delta Airlines', 'United Airlines', 'Southwest Airlines']),
        "origin": fake.city() + " International Airport",
        "destination": fake.city() + " International Airport",
        "departure_time": departure_time.isoformat() + "Z",
        "arrival_time": arrival_time.isoformat() + "Z",
        "status": random.choice(['on time', 'delayed', 'cancelled']),
        "altitude": random.randint(20000, 40000),
        "speed": random.randint(400, 600),
        "latitude": round(random.uniform(-90, 90), 6),
        "longitude": round(random.uniform(-180, 180), 6),
    }

    flights.append(flight)

# Iterar sobre la lista de vuelos y enviar una solicitud POST para cada uno
for flight in flights:
    response = requests.post(url, json=flight)
    if response.status_code == 201:  # 201 Created
        print(f"Flight {flight['flight_number']} added successfully.")
    else:
        print(f"Failed to add flight {flight['flight_number']}: {response.text}")
