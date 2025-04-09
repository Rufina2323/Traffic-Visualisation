# 🌍 Real-Time Traffic Visualisation

A Flask + Socket.IO web application that displays real-time network packet activity on an interactive world map and bar chart using Leaflet and Chart.js.

---

## Features

- Real-time visualization of incoming data packets
- Live map markers with IP geolocation
- Rolling chart for normal vs suspicious traffic
- WebSocket-based live updates
- Start/stop packet simulation via frontend

---

## How to Use?

### 1. Clone the repository

```bash
git clone https://github.com/Rufina2323/Traffic-Visualisation.git
cd Traffic-Visualisation
```
### 2. Run with Docker

```bash
docker-compose up --build
```

The app will be accessible at: [http://localhost:8000](http://localhost:8000)

### 3. Stop the App

```bash
docker-compose down
```
---
## API Endpoints

- `POST /endpoint` → Receive a packet (used by `sender.py`)
- `GET /data` → Returns all received packets (JSON)
- `POST /start-script` → Starts traffic generator
- `POST /stop-script` → Stops traffic generator
---
## Project Structure

```bash
.
├── static/                 # JS, CSS, chart/map logic
├── templates/
│   └── index.html          # Frontend UI
├── sender.py               # Packet generator (simulated traffic)
├── server.py               # Flask + Socket.IO backend
├── Dockerfile              # Container config
├── docker-compose.yml      # App + service orchestrator
└── README.md               # You're here!
```




