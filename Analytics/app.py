import json
from flask import Flask, request, jsonify #type: ignore
import paho.mqtt.client as mqtt #type: ignore

app = Flask(__name__)

client = mqtt.Client()
filteredDataTopic = "filteredDataTopic"

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with result code " + str(rc))
    client.subscribe("dbData")
    if rc == 0:
        message = json.dumps({"message": "Hello, MQTT from Flask!"})
        client.publish("dbData", message)

received_data = []

def on_message(client, userdata, msg):
    payload = json.loads(msg.payload.decode())
    data = payload.get("data")
    if data and "message" not in data:
        received_data.append(data)
        print("Data", data)
        print("Length", len(received_data))

def clear_topic(topic):
    client.publish(topic, "")
    
def consumption_difference_filter(data):
    filtered_data = []
    for i in range(1, len(data)):
        current_consumption = data[i].get("Consumption", 0)
        previous_consumption = data[i - 1].get("Consumption", 0)
        if abs(current_consumption - previous_consumption) >= 20000:
            filtered_data.append(data[i])
    return filtered_data

def filter_data(data):
    filtered_data = {}
    filtered_data["abnormalProduction"] = [{"type": "abnormalProduction", "data": document} for document in data if document.get("Production", 0) > 2 * document.get("Consumption", 0)]
    filtered_data["productionConsumption"] = [{"type": "productionConsumption", "data": document} for document in data if document.get("Production", 0) < document.get("Consumption", 0)]
    filtered_data["anyZeroValue"] = [{"type": "anyZeroValue", "data": document} for document in data if any(value == 0 for value in document.values())]
    filtered_data["consumptionDifference"] = [{"type": "consumptionDifference", "data": document} for document in consumption_difference_filter(data)]
    return filtered_data

@app.route('/')
def index():
    return "MQTT Subscriber is running!"

@app.route('/filterData', methods=['POST'])
def filter_data_endpoint():
    clear_topic(filteredDataTopic)
    
    filtered_data = filter_data(received_data)
    
    for filter_type, data in filtered_data.items():
        for item in data:
            client.publish(filteredDataTopic, json.dumps(item))
    
    return jsonify({"message": "Data published"}), 200

if __name__ == '__main__':
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect("localhost", 1883, 60)
    client.loop_start()
    app.run(debug=True, port=5001)
