import pandas as pd
import time
import json
import requests

# Load the data
df = pd.read_csv("ip_addresses.csv")  # Replace with your actual file path
df = df.sort_values("Timestamp")
df["Date"] = pd.to_datetime(df["Timestamp"], unit='s')

# Prepare the sending function
def send_package(row):
    url = "http://localhost:8000/endpoint"  # Replace with actual endpoint
    payload = {
        "ip_address": row["ip address"],
        "latitude": row["Latitude"],
        "longitude": row["Longitude"],
        "timestamp": row["Timestamp"],
        "date": row["Date"].isoformat(),
        "suspicious": int(row["suspicious"])
    }
    headers = {'Content-Type': 'application/json'}
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    print(f"Sent: {payload} | Response: {response.status_code}")

# Send packages with timing
last_time = None
for _, row in df.iterrows():
    if last_time is not None:
        delay = (row["Timestamp"] - last_time)
        if delay > 0:
            time.sleep(delay)
    send_package(row)
    last_time = row["Timestamp"]
