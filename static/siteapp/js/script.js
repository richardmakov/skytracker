//variables globales
let markersLayer;
let favoriteFlightIds = [];

//Icono de aviones
var airplaneIcon = L.divIcon({
    className: 'airplane-icon',
    html: '<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor" class="bi bi-airplane" viewBox="0 0 16 16"><path d="M6.428 1.151C6.708.591 7.213 0 8 0s1.292.592 1.572 1.151C9.861 1.73 10 2.431 10 3v3.691l5.17 2.585a1.5 1.5 0 0 1 .83 1.342V12a.5.5 0 0 1-.582.493l-5.507-.918-.375 2.253 1.318 1.318A.5.5 0 0 1 10.5 16h-5a.5.5 0 0 1-.354-.854l1.319-1.318-.376-2.253-5.507.918A.5.5 0 0 1 0 12v-1.382a1.5 1.5 0 0 1 .83-1.342L6 6.691V3c0-.568.14-1.271.428-1.849m.894.448C7.111 2.02 7 2.569 7 3v4a.5.5 0 0 1-.276.447l-5.448 2.724a.5.5 0 0 0-.276.447v.792l5.418-.903a.5.5 0 0 1 .575.41l.5 3a.5.5 0 0 1-.14.437L6.708 15h2.586l-.647-.646a.5.5 0 0 1-.14-.436l.5-3a.5.5 0 0 1 .576-.411L15 11.41v-.792a.5.5 0 0 0-.276-.447L9.276 7.447A.5.5 0 0 1 9 7V3c0-.432-.11-.979-.322-1.401C8.458 1.159 8.213 1 8 1s-.458.158-.678.599"/></svg>',
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});
// Inicializar el mapa
var map = L.map('map', {
    zoomControl: false,
    minZoom: 4,
    maxZoom: 10,
}).setView([20, 0], 2);

document.addEventListener("DOMContentLoaded", function () {
    // Establecer límites máximos
    map.setMaxBounds([[90, -180], [-90, 180]]);

    // Agregar capas de teselas al mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 10,
        attribution: '© Richard Makovs'
    }).addTo(map);

    // Inicializar la capa de marcadores aquí
    markersLayer = L.layerGroup().addTo(map);

    // Obtener los vuelos favoritos del usuario
    fetch('/api/favorites/')
        .then(response => response.json())
        .then(data => {
            const favoriteFlightIds = data.favorites.map(fav => fav.flight_id);
            if (favoriteFlightIds.length === 0) {
                fetchFlights();
            } else {
                fetchFlightsFavorites();
            }
        })
        .catch(error => {
            console.error('Error fetching favorites:', error);
            // En caso de error, también se pueden cargar todos los vuelos
            fetchFlights();
        });

    // Buscador
    const searchForm = document.getElementById("search-form");

    searchForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const flightName = document.getElementById("flight-search").value.trim();
        if (flightName) {
            fetchFlightData(flightName);
            saveHistory(flightName);
        }
    });
});

//Guardar al historial
function saveHistory(flightNumber) {
    fetch(`/api/flights/history/save/${flightNumber}/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error de conexión');
        }
        return response.json();
    })
    .catch(error => {
        console.error("Error occurred:", error);
    });
}

// Info longitud y latitud de un vuelo por su número de vuelo
function fetchFlightData(flightName) {
    fetch(`/api/flights/${flightName}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error de conexión');
            }
            return response.json();
        })
        .then(data => {
            const {latitude, longitude} = data;
            if (latitude && longitude) {
                zoomToFlight(latitude, longitude);
            } else {
                console.error('No se encontraron datos de vuelo.');
            }
        })
        .catch(error => {
            alert('No se ha encontrado ningun vuelo.');
            console.error('Error al buscar el vuelo:', error);
        });
}

// Zoom a un vuelo después de buscarlo
function zoomToFlight(latitude, longitude) {
    map.setView([latitude, longitude], 10);
}

// Traer todos lo vuelos
function fetchFlights() {
    fetch('/api/flights/')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error de conexión');
            }
            return response.json();
        })
        .then(flightData => {
            // Limpiar marcadores antes de agregar nuevos
            markersLayer.clearLayers();
            flightData.forEach(createFlightMarker);
        });
}

// Traer todos los favoritos de un usuario
function fetchFlightsFavorites() {
    fetch('/api/favorites/user')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error de conexión');
            }
            return response.json();
        })
        .then(data => {
            // Limpiar marcadores antes de agregar nuevos
            markersLayer.clearLayers();

            // Crear los marcadores para los vuelos favoritos
            const flightData = data.favorites;
            flightData.forEach(createFlightMarkerFavorites);
        })
        .catch(error => {
            console.error('Error al obtener los vuelos favoritos:', error);
        });
}

// Función para manejar el boton de añadir y quitar de favoritos
function toggleFavoritos(button, flightId) {
    const isButtonPressed = button.classList.contains("btn-danger");

    if (isButtonPressed) {
        updateButtonState(button, false);
        fetch(`/api/favorites/remove/${flightId}/`, {method: 'POST', headers: getFetchHeaders()})
            .then(() => {
                // Eliminar el vuelo de los favoritos localmente
                favoriteFlightIds = favoriteFlightIds.filter(id => id !== flightId);
                updateMapMarkers(); // Actualiza el mapa después de quitar el favorito
            })
            .catch(error => console.error('Error al eliminar de favoritos:', error));
    } else {
        updateButtonState(button, true);
        fetch('/api/favorites/add/', {
            method: 'POST',
            headers: getFetchHeaders(),
            body: JSON.stringify({flight_id: flightId})
        })
            .then(() => {
                // Agregar el vuelo a los favoritos localmente
                favoriteFlightIds.push(flightId);
                updateMapMarkers();
            })
            .catch(error => console.error('Error al añadir a favoritos:', error));
    }
}

// Actualizar marcadores
function updateMapMarkers() {
    markersLayer.clearLayers();
    fetchFlights();
}

// Actualizar el estado del boton
function updateButtonState(button, isFavorite) {
    if (isFavorite) {
        button.classList.remove("btn-warning");
        button.classList.add("btn-danger");
        button.innerText = "Quitar Favoritos";
    } else {
        button.classList.remove("btn-danger");
        button.classList.add("btn-warning");
        button.innerText = "Añadir Favoritos";
    }
}

// Header de las solicitudes a las APIs
function getFetchHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
    };
}

// Para Django necesitamos tener el token de CSRF cuando hagamos las solicitudes a una API
// Es por cuestión de seguridad
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Función para actualizar la hora UTC
function updateUTCTime() {
    let now = new Date();
    let hours = now.getUTCHours().toString().padStart(2, '0');
    let minutes = now.getUTCMinutes().toString().padStart(2, '0');
    let seconds = now.getUTCSeconds().toString().padStart(2, '0');
    document.getElementById('utc-time').textContent = `${hours}:${minutes}:${seconds}`;
}

setInterval(updateUTCTime, 1000);
updateUTCTime();

// Formateados de Fecha y Hora
function formatDatetimeToHoursMinutes(datetime) {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    return `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
}

// Crear un marcador de vuelol en el mapa
function createFlightMarker(flight) {
    if (flight.latitude && flight.longitude) {
        const marker = L.marker([flight.latitude, flight.longitude], {icon: airplaneIcon});
        markersLayer.addLayer(marker);

        const popupContent = createPopupContent(flight);
        marker.bindPopup(popupContent);

        marker.on('popupopen', () => setupPopupButton(marker, flight));
    } else {
        console.warn(`Las coordenadas no son válidas para este vuelo: ${flight.flight_number}: [${flight.latitude}, ${flight.longitude}]`);
    }
}

// Cuando filtramos los favoritos, crea los marcadores favoritos
function createFlightMarkerFavorites(flight) {
    if (flight.latitude && flight.longitude) {
        const marker = L.marker([flight.latitude, flight.longitude], {icon: airplaneIcon});
        markersLayer.addLayer(marker); // Agrega el marcador a la capa

        const popupContent = createPopupContentFavorites(flight);
        marker.bindPopup(popupContent);

    } else {
        console.warn(`Las coordenadas no son válidas para este vuelo: ${flight.flight_number}: [${flight.latitude}, ${flight.longitude}]`);
    }
}

// Crea la información del vuelo en HTML para favoritos
function createPopupContentFavorites(flight) {
    return `
            <div class="popup-content">
            <b>Número de Vuelo:</b> ${flight.flight_number} (${flight.airline})<br>
            <b>Desde:</b> ${flight.origin}<br>
            <b>A:</b> ${flight.destination}<br>
            <b>Hora de salida: </b>${formatDatetimeToHoursMinutes(flight.departure_time)}h<br>
            <b>Hora de llegada: </b>${formatDatetimeToHoursMinutes(flight.arrival_time)}h<br>
            <b>Altitud: </b>${flight.altitude}ft<br>
            <b>Velocidad: </b>${flight.speed}kt<br>
            <b>Estado:</b> ${flight.status}<br>
        </div>
        `;
}

// Crea la información del vuelo en HTML
function createPopupContent(flight) {
    return `
            <div class="popup-content">
            <b>Número de Vuelo:</b> ${flight.flight_number} (${flight.airline})<br>
            <b>Salida:</b> ${flight.origin}<br>
            <b>Destino:</b> ${flight.destination}<br>
            <b>Hora de salida: </b>${formatDatetimeToHoursMinutes(flight.departure_time)}h<br>
            <b>Hora de llegada: </b>${formatDatetimeToHoursMinutes(flight.arrival_time)}h<br>
            <b>Altitud: </b>${flight.altitude}ft<br>
            <b>Velocidad: </b>${flight.speed}kt<br>
            <b>Estado:</b> ${flight.status}<br>
            <button class="btn btn-warning btn-sm mt-2 favorite-btn" data-flight-id="${flight.id}">Añadir Favoritos</button>
        </div>
        `;
}

// Maneja el boton de favoritos
function setupPopupButton(marker, flight) {
    const button = document.querySelector(`button[data-flight-id="${flight.id}"]`);
    if (button) {
        // Si el vuelo ya está en favoritos, cambiar el estado del botón
        if (favoriteFlightIds.includes(flight.id)) {
            button.classList.remove("btn-warning");
            button.classList.add("btn-danger");
            button.innerText = "Quitar Favoritos";
        }

        button.addEventListener('click', function () {
            toggleFavoritos(button, flight.id);
        });
    }
}

// Se ejecuta antes de todo
document.addEventListener("DOMContentLoaded", function () {
    const star = document.getElementById("star");
    star.addEventListener("click", toggleFavorites);
});
let isFavorite = false;

// Botón de la estrella que filtra los vuelos
function toggleFavorites() {
    const starIcon = document.getElementById("star-icon");

    isFavorite = !isFavorite;

    if (isFavorite) {
        starIcon.innerHTML = `<path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>`;

        markersLayer.clearLayers();

        fetch('/api/favorites/')
            .then(response => response.json())
            .then(data => {
                favoriteFlightIds = data.favorites.map(fav => fav.flight_id);
                fetchFlightsFavorites();
            });
    } else {
        starIcon.innerHTML = `<path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z"/>`;

        markersLayer.clearLayers();

        fetch('/api/favorites/')
            .then(response => response.json())
            .then(data => {
                favoriteFlightIds = data.favorites.map(fav => fav.flight_id);
                fetchFlights();
            });
    }
}