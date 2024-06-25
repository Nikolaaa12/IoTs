import json
import logging
import paho.mqtt.client as mqtt

logging.basicConfig(level=logging.DEBUG)

MQTT_BROKER = "172.29.0.3"
MQTT_PORT = 1883
MQTT_TOPIC = "dbData"

def on_connect(client, userdata, flags, rc):
    print("Connected to MQTT broker with result code " + str(rc))

def on_publish(client, userdata, mid):
    print("Message published with mid:", mid)

client = mqtt.Client()
client.on_connect = on_connect
client.on_publish = on_publish
try:
    client.connect(MQTT_BROKER, MQTT_PORT)
    logging.debug("Connected to MQTT broker successfully")
except Exception as e:
    logging.error(f"Failed to connect to MQTT broker: {e}")
client.loop_start()

def publish_data():
    try:
        with open('Electricity.electricity_consumption.json', 'r') as file:
            data = json.load(file)

            for document in data:
                if document["Production"] > document["Consumption"]:
                    transformed_document = {
                        "_id": str(document["_id"]),
                        "DateTime": document["DateTime"],
                        "Consumption": document["Consumption"],
                        "Production": document["Production"],
                        "Nuclear": document.get("Nuclear"),
                        "Wind": document.get("Wind"),
                        "Hydroelectric": document.get("Hydroelectric"),
                        "Oil_and_Gas": document.get("Oil and Gas"),
                        "Coal": document.get("Coal"),
                        "Solar": document.get("Solar"),
                        "Biomass": document.get("Biomass")
                    }
                    message = json.dumps(transformed_document)
                    client.publish(MQTT_TOPIC, message)
        
        print("Data published to MQTT topic.")

    except Exception as e:
        print(f"Failed to publish data to MQTT topic: {str(e)}")

if __name__ == '__main__':
    publish_data()
