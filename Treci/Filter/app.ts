import express, { Express, Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises'; 
import { connect, JSONCodec } from 'nats';

const app: Express = express();

const staticPath: string = path.join(__dirname, 'public');
const electricityDataFilePath: string = path.join(staticPath, 'Electricity.electricity_consumption.json');

let averages: { [key: string]: number } = {};

async function loadDataFromFile() {
    try {
        const jsonData = await fs.readFile(electricityDataFilePath, 'utf-8');
        const documents = JSON.parse(jsonData);

        console.log('Učitani podaci iz JSON fajla:', documents);

        averages = {};

        fields.forEach(field => {
            const sum = documents.reduce((acc: any, obj: { [x: string]: any; }) => acc + obj[field], 0);
            averages[field] = sum / documents.length;
        });

        // Subscribe to NATS first
        await subscribeToNATS('average_data');

        // Now send the averages to NATS
        sendToNATS('average_data', averages).catch(error => {
            console.error('Došlo je do greške prilikom slanja poruke na NATS server:', error);
        });

    } catch (error) {
        console.error('Došlo je do greške prilikom učitavanja podataka iz JSON fajla:', error);
    }
}

loadDataFromFile().catch(error => {
    console.error('Došlo je do greške prilikom učitavanja podataka:', error);
});

const fields = ['Consumption', 'Production', 'Nuclear', 'Wind', 'Hydroelectric', 'Oil and Gas', 'Coal', 'Solar', 'Biomass'];

app.use(express.static(staticPath));

app.get('/api/documents', async (req: Request, res: Response) => {
    try {
        res.json(averages);
    } catch (error) {
        console.error('Došlo je do greške prilikom obrade zahteva:', error);
        res.status(500).json({ error: 'Došlo je do greške prilikom obrade zahteva.' });
    }
});

async function sendToNATS(topic: string, data: any) {
    try {
        const nc = await connect({ servers: 'nats://nats:4222' });
        const codec = JSONCodec();
        const encodedData = codec.encode(data);

        nc.publish(topic, encodedData);

        await nc.flush();
        await nc.close();

        console.log('Poruka uspešno poslata na NATS server.');
    } catch (error) {
        console.error('Došlo je do greške prilikom slanja poruke na NATS server:', error);
    }
}

async function subscribeToNATS(topic: string) {
    try {
        const nc = await connect({ servers: 'nats://nats:4222' });
        const subscription = nc.subscribe(topic);
        (async () => {
            for await (const msg of subscription) {
                const data = JSONCodec().decode(msg.data);
                console.log(`Primljena poruka na subjektu ${msg.subject}:`, data);
            }
        })().catch(error => {
            console.error('Došlo je do greške prilikom obrade poruka:', error);
        });
    } catch (error) {
        console.error('Došlo je do greške prilikom pretplate na NATS subjekat:', error);
    }
}

const PORT: number = 3000;
app.listen(PORT, () => {
    console.log(`Server je pokrenut na http://localhost:${PORT}`);
});
