"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const nats_1 = require("nats");
const app = (0, express_1.default)();
const staticPath = path_1.default.join(__dirname, 'public');
const electricityDataFilePath = path_1.default.join(staticPath, 'Electricity.electricity_consumption.json');
let averages = {};
function loadDataFromFile() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const jsonData = yield promises_1.default.readFile(electricityDataFilePath, 'utf-8');
            const documents = JSON.parse(jsonData);
            console.log('Učitani podaci iz JSON fajla:', documents);
            averages = {};
            fields.forEach(field => {
                const sum = documents.reduce((acc, obj) => acc + obj[field], 0);
                averages[field] = sum / documents.length;
            });
            // Subscribe to NATS first
            yield subscribeToNATS('average_data');
            // Now send the averages to NATS
            sendToNATS('average_data', averages).catch(error => {
                console.error('Došlo je do greške prilikom slanja poruke na NATS server:', error);
            });
        }
        catch (error) {
            console.error('Došlo je do greške prilikom učitavanja podataka iz JSON fajla:', error);
        }
    });
}
loadDataFromFile().catch(error => {
    console.error('Došlo je do greške prilikom učitavanja podataka:', error);
});
const fields = ['Consumption', 'Production', 'Nuclear', 'Wind', 'Hydroelectric', 'Oil and Gas', 'Coal', 'Solar', 'Biomass'];
app.use(express_1.default.static(staticPath));
app.get('/api/documents', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.json(averages);
    }
    catch (error) {
        console.error('Došlo je do greške prilikom obrade zahteva:', error);
        res.status(500).json({ error: 'Došlo je do greške prilikom obrade zahteva.' });
    }
}));
function sendToNATS(topic, data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const nc = yield (0, nats_1.connect)({ servers: 'nats://nats:4222' });
            const codec = (0, nats_1.JSONCodec)();
            const encodedData = codec.encode(data);
            nc.publish(topic, encodedData);
            yield nc.flush();
            yield nc.close();
            console.log('Poruka uspešno poslata na NATS server.');
        }
        catch (error) {
            console.error('Došlo je do greške prilikom slanja poruke na NATS server:', error);
        }
    });
}
function subscribeToNATS(topic) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const nc = yield (0, nats_1.connect)({ servers: 'nats://nats:4222' });
            const subscription = nc.subscribe(topic);
            (() => __awaiter(this, void 0, void 0, function* () {
                var _a, e_1, _b, _c;
                try {
                    for (var _d = true, subscription_1 = __asyncValues(subscription), subscription_1_1; subscription_1_1 = yield subscription_1.next(), _a = subscription_1_1.done, !_a; _d = true) {
                        _c = subscription_1_1.value;
                        _d = false;
                        const msg = _c;
                        const data = (0, nats_1.JSONCodec)().decode(msg.data);
                        console.log(`Primljena poruka na subjektu ${msg.subject}:`, data);
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = subscription_1.return)) yield _b.call(subscription_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
            }))().catch(error => {
                console.error('Došlo je do greške prilikom obrade poruka:', error);
            });
        }
        catch (error) {
            console.error('Došlo je do greške prilikom pretplate na NATS subjekat:', error);
        }
    });
}
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server je pokrenut na http://localhost:${PORT}`);
});
