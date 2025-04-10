// Create map instance
const map = L.map('map', {
    center: [25, 0],        // default center
    zoom: 2,                // starting zoom
    minZoom: 2,             // can't zoom out further
    maxZoom: 10             // can't zoom in further
  });

// Add OpenStreetMap tile layer to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Connect to backend via Socket.IO
const socket = io();

// Store all active markers for reference
const markers = [];

// Used to calculate difference in seconds for activity chart
let startTime = 0;

// Add a marker to the map
function addMarker(lat, lon, ip, date, isSuspicious) {
    const color = isSuspicious ? 'red' : 'rgba(74, 144, 226, 1)';
    
    // Create a circle marker
    const marker = L.circleMarker([lat, lon], {
        color: color,
        weight: 2,
        radius: 4,
        fillOpacity: 0.7
    }).addTo(map);

    // Build tooltip content
    const infoText = `
    <strong>IP:</strong> ${ip}<br>
    <strong>Date:</strong> ${new Date(date).toISOString().split('T')[0]}<br>
    <strong>Time:</strong> ${new Date(date).toTimeString().split(' ')[0]}<br>
    <strong>Suspicious:</strong> ${isSuspicious ? 'Yes' : 'No'}`;

    // Attach tooltip to marker (only shows on hover)
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
        if (icon) icon.classList.add('fade-out');
    }, 8000);

    // Remove marker from map after 10 seconds
    setTimeout(() => map.removeLayer(marker), 10000);
}


// Prepare Chart.js data structure
const ctx = document.getElementById('activityChart').getContext('2d');

const chartData = {
    labels: [],
    datasets: [
        {
            label: 'Normal Packets',
            data: [],
            backgroundColor: 'rgba(74, 144, 226, 0.8)', // blue
            stack: 'packets'
        },
        {
            label: 'Suspicious Packets',
            data: [],
            backgroundColor: 'rgba(231, 76, 60, 0.8)', // red
            stack: 'packets'
        }
    ]
};

const config = {
    type: 'bar',
    data: chartData,
    options: {
        maintainAspectRatio: false,
        // responsive: true,
        plugins: {
            tooltip: {
                mode: 'index',
                // intersect: false
            },
        },
        scales: {
            x: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Seconds from Start'
                }
            },
            y: {
                stacked: true,
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Packet Count'
                }
            }
        }
    }
};

// Create the Chart instance
const activityChart = new Chart(ctx, config);

// Start the backend packet capturing script
function startScript() {
    fetch('/start-script', { method: 'POST' })
        .then(res => res.json());
    
    // Reset chart and timer
    activityChart.data.labels = [];
    activityChart.data.datasets[0].data = [];
    activityChart.data.datasets[1].data = [];
    activityChart.update();
    startTime = 0;
}

// Stop the backend script
function stopScript() {
    fetch('/stop-script', { method: 'POST' })
        .then(res => res.json());
}

// Update chart with new data
function update_Chart(timestamp, isSuspicious) {
    if (!startTime) {
        // First timestamp received
        startTime = timestamp;
    }

    const currentTime = timestamp - startTime;

    // Rolling window size in seconds
    const windowSize = 10;
    const oldestAllowed = currentTime - windowSize;

    // If the label already exists, increment corresponding count
    const index = activityChart.data.labels.indexOf(currentTime);
    if (index !== -1) {
        // Increment existing value
        if (isSuspicious) {
            activityChart.data.datasets[1].data[index]++;
        } else {
            activityChart.data.datasets[0].data[index]++;
        }
    } else {
        // First, remove outdated data before adding new one
        while (activityChart.data.labels.length > 0 &&
               activityChart.data.labels[0] < oldestAllowed) {
            activityChart.data.labels.shift();
            activityChart.data.datasets[0].data.shift();
            activityChart.data.datasets[1].data.shift();
        }

        // Add the new time and counts
        activityChart.data.labels.push(currentTime);
        activityChart.data.datasets[0].data.push(isSuspicious ? 0 : 1);
        activityChart.data.datasets[1].data.push(isSuspicious ? 1 : 0);
    }

    // Redraw chart
    activityChart.update();
}

// Handle incoming socket data
socket.on("new_package", (data) => {
    // Update chart with new data point
    update_Chart (data.timestamp, data.suspicious);

    // Add packet location to map
    addMarker(data.latitude, data.longitude, data.ip_address, data.date, data.suspicious);
});