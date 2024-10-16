// Asegúrate de que el script se cargue después del DOM
document.addEventListener('DOMContentLoaded', function () {
    fetch('/api/flights/history/get')  // Aquí debe coincidir con la URL del backend
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener el historial de búsqueda');
            }
            return response.json();
        })
        .then(data => {
            // Procesar la respuesta y mostrar los datos
            console.log(data);
            displayHistory(data.history);  // Llama a una función para mostrar el historial
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

// Función para mostrar el historial en el elemento con id "show-history"
function displayHistory(history) {
    const historyDiv = document.getElementById('show-history');
    historyDiv.innerHTML = '<h2 class="mt-4 ml-4">Historial de búsqueda</h2>';  // Limpiar el contenido previo

    // Crear una tabla
    const table = document.createElement('table');
    table.className = 'flight-history-table';  // Clase para aplicar estilos

    // Crear el encabezado de la tabla
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>Flight Number</th>
        <th>Airline</th>
        <th>From</th>
        <th>To</th>
        <th>Departure</th>
        <th>Arrival</th>
        <th>Status</th>
        <th>Altitude (ft)</th>
        <th>Speed (mph)</th>
        <th>Latitude</th>
        <th>Longitude</th>
    `;
    table.appendChild(headerRow);

    // Agregar las filas de historial
    history.forEach(entry => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${entry.flight_number}</td>
            <td>${entry.airline}</td>
            <td>${entry.origin}</td>
            <td>${entry.destination}</td>
            <td>${entry.departure_time}</td>
            <td>${entry.arrival_time}</td>
            <td>${entry.status}</td>
            <td>${entry.altitude}</td>
            <td>${entry.speed}</td>
            <td>${entry.latitude}</td>
            <td>${entry.longitude}</td>
        `;
        table.appendChild(row);
    });

    // Agregar la tabla al div
    historyDiv.appendChild(table);
}

