const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

const mqttBrokerUrl = 'mqtt://localhost:1883'; // MQTT broker address
const mqttTopic = 'dbData'; // Topic to subscribe

const mqttClient = mqtt.connect(mqttBrokerUrl);

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    mqttClient.subscribe(mqttTopic, (err) => {
        if (!err) {
            console.log(`Subscribed to MQTT topic: ${mqttTopic}`);
        } else {
            console.error('Failed to subscribe to MQTT topic:', mqttTopic, err);
        }
    });
});

mqttClient.on('message', (topic, message) => {
    const payload = message.toString();

    console.log(`Received message on topic: ${topic}`);
    console.log(`Payload: ${payload}`);

    try {
        const parsedData = JSON.parse(payload);
        if (parsedData.Production > parsedData.Consumption) {
            broadcastEvent(parsedData);
        }
    } catch (error) {
        console.error('Error parsing MQTT message:', error);
    }
});

function broadcastEvent(eventData) {
    const eventMessage = JSON.stringify(eventData);
    console.log('Broadcasting event:', eventMessage);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(eventMessage);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
        console.log(`Received message from WebSocket client: ${message}`);
    });

    ws.send('Welcome to the WebSocket server!');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

const PORT = 8080;
httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
