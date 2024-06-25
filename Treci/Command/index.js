const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');
const path = require('path');

const app = express();
const httpServer = http.createServer(app);
const wss = new WebSocket.Server({ server: httpServer });

const mqttBrokerUrl = 'mqtt://my-custom-mosquitto';
const mqttTopic = 'dbData'; 

const mqttClient = mqtt.connect(mqttBrokerUrl);
let messageQueue = []; 

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
        const standardPayload = payload.replace(/\{"\$date":"([^"]+)"\}/g, (match, dateStr) => {
            return `"${new Date(dateStr).toISOString()}"`;
        });

        const parsedData = JSON.parse(standardPayload);

        messageQueue.push(parsedData);

        if (!sendingInterval) {
            startSendingMessages();
        }
    } catch (error) {
        console.error('Error parsing MQTT message:', error);
    }
});

let sendingInterval; // Interval handler

function startSendingMessages() {
    sendingInterval = setInterval(() => {
        if (messageQueue.length > 0) {
            const eventData = messageQueue.shift(); 
            broadcastEvent(eventData);
        } else {
            clearInterval(sendingInterval); 
            sendingInterval = null;
        }
    }, 500); 
}

function broadcastEvent(eventData) {
    const eventMessage = JSON.stringify(eventData);
    console.log('Broadcasting event:', eventMessage);

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            console.log('Sending message to WebSocket client:', eventMessage); 
            client.send(eventMessage);
        }
    });
}

wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', (message) => {
        console.log(`Received message from WebSocket client: ${message}`);
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
