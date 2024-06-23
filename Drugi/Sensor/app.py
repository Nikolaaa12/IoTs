import json
from flask import Flask, render_template, request #type: ignore
import paho.mqtt.client as mqtt #type: ignore
from apscheduler.schedulers.background import BackgroundScheduler #type: ignore
from pymongo import MongoClient #type: ignore
import requests #type: ignore

app = Flask(__name__)

MQTT_BROKER = "localhost"  
MQTT_PORT = 1883  
MQTT_TOPIC = "dbData" 

MONGO_CONNECTION_STRING = "mongodb://localhost:27017/"
MONGO_DB = "Electricity"
MONGO_COLLECTION = "electricity_consumption"

mongo_client = MongoClient(MONGO_CONNECTION_STRING)
mongo_db = mongo_client[MONGO_DB]
mongo_collection = mongo_db[MONGO_COLLECTION]

try:
    mongo_client.server_info()
    print("Uspešno ste povezani s MongoDB bazom podataka!")
except Exception as e:
    print("Došlo je do greške prilikom povezivanja s MongoDB bazom podataka:", e)

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with result code "+str(rc))
    message = json.dumps({"message": "Hello, MQTT from Flask!"})
    client.publish(MQTT_TOPIC, message)

def on_publish(client, userdata, mid):
    print("Message published with mid: "+str(mid))


client = mqtt.Client()

client.on_connect = on_connect
client.on_publish = on_publish

client.connect(MQTT_BROKER, MQTT_PORT)

client.loop_start()

@app.route('/publish_data', methods=['POST'])
def publish_data():
    data = mongo_collection.find({})
    for document in data:
        transformed_document = {
            "_id": str(document["_id"]),
            "DateTime": document["DateTime"].isoformat(),
            "Consumption": document["Consumption"],
            "Production": document["Production"],
            "Nuclear": document["Nuclear"],
            "Wind": document["Wind"],
            "Hydroelectric": document["Hydroelectric"],
            "Oil_and_Gas": document["Oil and Gas"],
            "Coal": document["Coal"],
            "Solar": document["Solar"],
            "Biomass": document["Biomass"]
        }
        message = json.dumps(transformed_document)
        client.publish(MQTT_TOPIC, message)
    return "Data published to MQTT topic."

if __name__ == '__main__':
    app.run(debug=True)
