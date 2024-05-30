const grpc = require('@grpc/grpc-js');
const express = require('express');
const protoLoader = require('@grpc/proto-loader');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const util = require('util');
const YAML = require('yamljs');
const { loadSync, loadPackageDefinition } = require('@grpc/proto-loader');

const app = express();
const PORT = 3000;

const packageDefinition = loadSync(__dirname + '/Protos/microservice.proto');

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);

const myService = protoDescriptor.microservice.ElectricityConsumption;

const client = new myService('localhost:5240', grpc.credentials.createInsecure());

const swaggerDocument = YAML.load('./openAPI.yaml');

app.use(express.json());

app.get('/getElectricityConsumption/:id', (req, res) => {
    const request = { _id: req.params.id };
    console.log(request);
    client.GetElectricityConsumptionValueById(request, (error, response) => {
        if (error) {
            if (error.code === grpc.status.INVALID_ARGUMENT) {
                res.status(400).json({ error: 'Invalid ID format' });
            } else if (error.code === grpc.status.NOT_FOUND) {
                res.status(404).json({ error: 'Electricity consumption not found' });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
            return;
        }
        res.json(response);
    });
});

app.post('/addElectricityConsumption', (req, res) => {

    const request = {
        Consumption: req.body.Consumption,
        Production: req.body.Production,
        Nuclear: req.body.Nuclear,
        Wind: req.body.Wind,
        Hydroelectric: req.body.Hydroelectric,
        OilAndGas: req.body.OilAndGas,
        Coal: req.body.Coal,
        Solar: req.body.Solar,
        Biomass: req.body.Biomass
    };

    client.AddElectricityConsumptionValue(request, (error, response) => {
        if (error) {
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }
        res.json(response);
    });
});

app.delete('/deleteElectricityConsumption/:id', (req, res) => {
    const id = req.params.id;
    const request = { _id: id };
    client.DeleteElectricityConsumptionById(request, (error, response) => {
        if (error) {
            if (error.code === grpc.status.INVALID_ARGUMENT) {
                res.status(400).json({ error: 'Invalid ID format' });
            } else if (error.code === grpc.status.NOT_FOUND) {
                res.status(404).json({ error: 'Electricity consumption not found' });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
            return;
        }

        res.json(response);
    });
});

app.put('/updateElectricityConsumption', (req, res) => {
    const request = {
        _id: req.body.id,
        Consumption: req.body.Consumption,
        Production: req.body.Production,
        Nuclear: req.body.Nuclear,
        Wind: req.body.Wind,
        Hydroelectric: req.body.Hydroelectric,
        OilAndGas: req.body.OilAndGas,
        Coal: req.body.Coal,
        Solar: req.body.Solar,
        Biomass: req.body.Biomass
    };

    client.UpdateElectricityConsumptionById(request, (error, response) => {
        if (error) {
            if (error.code === grpc.status.INVALID_ARGUMENT) {
                res.status(400).json({ error: 'Invalid ID format' });
            } else if (error.code === grpc.status.NOT_FOUND) {
                res.status(404).json({ error: 'Electricity consumption not found' });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
            return;
        }

        res.json(response);
    });
});

app.get('/aggregateElectricityConsumption', (req, res) => {
    const startTimestamp = req.query.StartTimestamp;
    const endTimestamp = req.query.EndTimestamp;
    const operation = req.query.Operation;
    const fieldName = req.query.FieldName;

    if (!startTimestamp || !endTimestamp || !fieldName || !operation) {
        res.status(400).json({ error: 'Missing required parameters' });
        return;
    }
    const request = {
        StartTimestamp: startTimestamp,
        EndTimestamp: endTimestamp,
        Operation: operation,
        FieldName: fieldName
    };

    console.log(request);

    client.ElectricityConsumptionAggregation(request, (error, response) => {
        if (error) {
            if (error.code === grpc.status.INVALID_ARGUMENT) {
                res.status(400).json({ error: 'Invalid argument for aggregation' });
            } else {
                res.status(500).json({ error: 'Internal Server Error' });
            }
            return;
        }
        res.json(response);
    });
});



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

