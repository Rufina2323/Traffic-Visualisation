const map = L.map('map', {
    center: [40, 0],        // or whatever your default center is
    zoom: 2,                // starting zoom
    minZoom: 2,             // can't zoom out further
    maxZoom: 10             // can't zoom in further
  });
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
const socket = io();

const markers = [];
const locationCounts = {};

function updateTopLocations() {
    const sorted = Object.entries(locationCounts).sort((a, b) => b[1] - a[1]);
    const list = document.getElementById('location-list');
    list.innerHTML = '';
    sorted.slice(0, 5).forEach(([loc, count]) => {
        const li = document.createElement('li');
        li.textContent = `${loc} (${count})`;
        list.appendChild(li);
    });
}

function addMarker(lat, lon, ip, date, isSuspicious) {
    const color = isSuspicious ? 'red' : 'green';
    const marker = L.circleMarker([lat, lon], {
        color: color,
        weight: 2,
        radius: 4,
        fillOpacity: 0.7
    }).addTo(map);

    const infoText = `
    <strong>IP:</strong> ${ip}<br>
    <strong>Date:</strong> ${new Date(date).toISOString().split('T')[0]}<br>
    <strong>Time:</strong> ${new Date(date).toTimeString().split(' ')[0]}<br>
    <strong>Suspicious:</strong> ${isSuspicious ? 'Yes' : 'No'}`;

    marker.bindTooltip(infoText, {
    permanent: false,      // only show on hover
    direction: 'top',      // place above marker
    offset: [0, -10],      // adjust position
    opacity: 0.9
    });

    markers.push(marker);
    // Start fade after 8 seconds
    setTimeout(() => {
        const icon = marker.getElement();
        console.log(icon);
        if (icon) icon.classList.add('fade-out');
    }, 8000);  // Start fading after 8s
    setTimeout(() => map.removeLayer(marker), 10000);
}

socket.on("new_package", (data) => {
    console.log("New package received:", data);

    const key = `${data.latitude.toFixed(2)},${data.longitude.toFixed(2)}`;
    locationCounts[key] = (locationCounts[key] || 0) + 1;

    addMarker(data.latitude, data.longitude, data.ip_address, data.date, data.suspicious);
    updateTopLocations();
});