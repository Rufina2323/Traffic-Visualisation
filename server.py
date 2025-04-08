from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import json
from flask import Flask, request, jsonify


app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")  # Enable real-time sockets

received_packages = []

@app.route('/')
def index():
    return render_template('index.html')

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
        socketio.emit("new_package", package)  # Push to all connected clients
        return jsonify({"message": "Package received"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/data')
def get_data():
    return jsonify(received_packages), 200

if __name__ == '__main__':
    socketio.run(app, debug=True, port=8000)
