const fs = require('fs');
const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const MQTT_BROKER = 'mqtt://my-custom-mosquitto';
const MQTT_TOPIC = 'dbData';

const logging = {
  debug: (msg) => console.log(`DEBUG: ${msg}`),
  error: (msg) => console.error(`ERROR: ${msg}`)
};

function onConnect(client) {
  logging.debug('Connected to MQTT broker');
}

function onPublish(client, message) {
  logging.debug(`Message published: ${message}`);
}

const client = mqtt.connect(MQTT_BROKER);

client.on('connect', function () {
  onConnect(client);
});

client.on('error', function (err) {
  logging.error(`Connection error: ${err}`);
});

function publishData() {
  try {
    const filePath = path.join(__dirname, 'Electricity.electricity_consumption.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    data.forEach(document => {
      if (document.Production > document.Consumption) {
        const transformedDocument = {
          _id: uuidv4(),
          DateTime: document.DateTime,
          Consumption: document.Consumption,
          Production: document.Production,
          Nuclear: document.Nuclear,
          Wind: document.Wind,
          Hydroelectric: document.Hydroelectric,
          Oil_and_Gas: document['Oil and Gas'],
          Coal: document.Coal,
          Solar: document.Solar,
          Biomass: document.Biomass
        };

        const message = JSON.stringify(transformedDocument);
        client.publish(MQTT_TOPIC, message, function (err) {
          if (err) {
            logging.error(`Failed to publish message: ${err}`);
          } else {
            onPublish(client, message);
          }
        });
      }
    });

    console.log('Data published to MQTT topic.');

  } catch (err) {
    logging.error(`Failed to publish data to MQTT topic: ${err}`);
  }
}

if (require.main === module) {
  publishData();
}
