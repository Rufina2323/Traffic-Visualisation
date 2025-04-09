from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO
from flask_cors import CORS
from flask import Flask, request, jsonify
import subprocess
import os
import signal

# Create Flask app instance
app = Flask(__name__)

# Enable real-time sockets
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Store incoming data
received_packages = []

# Global variable to store the process
process = None

# Serve main HTML page
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint to receive a single packet's data
@app.route('/endpoint', methods=['POST'])
def receive_package():
    data = request.get_json()
    try:
        package = {
            "ip_address": data.get("ip_address"),
            "latitude": float(data.get("latitude")),
            "longitude": float(data.get("longitude")),
            "timestamp": data.get("timestamp"),
            "date": data.get("date"),
            "suspicious": int(data.get("suspicious"))
        }
        received_packages.append(package)
        
        # Push to all connected clients
        socketio.emit("new_package", package)
        return jsonify({"message": "Package received"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

# API to get all stored packets
@app.route('/data')
def get_data():
    return jsonify(received_packages), 200

# Start the external script (packet capture and sender)
@app.route('/start-script', methods=['POST'])
def start_script():
    global process
    if process is None or process.poll() is not None:  # Not running
        process = subprocess.Popen(['python', 'sender.py'])
        return jsonify({'message': 'Script started'})
    else:
        return jsonify({'message': 'Script is already running'})

# Stop the external script    
@app.route('/stop-script', methods=['POST'])
def stop_script():
    global process
    if process and process.poll() is None:  # Still running
        os.kill(process.pid, signal.SIGTERM)
        process = None
        return jsonify({'message': 'Script stopped'})
    else:
        return jsonify({'message': 'No script is running'})

# Run the App
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=8000)
