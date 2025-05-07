require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const { Kafka } = require('kafkajs');

const { allDeliveryDriversMap, driversOptimalPathInfo } = require('./utility/randomPaths');
const { deliverDriversCoordinates } = require('./datasets/deliveryDriversCoordinates');
const { getDistanceFromLatLonInKm } = require('./utility/distanceCalculator');
const { registerMongoConnector } = require('./utility/registerMongoConnector');

const app = express();
const PORT = process.env.PORTDRIVER || 3000;

// === Middleware ===
app.use(cors());
app.use(bodyParser.json());

// === Environment Variables ===
const MONGODB_URI = process.env.MONGODBURI;
const DB_NAME = process.env.DBNAME;
const COLLECTION_NAME = process.env.COLLECTIONNAME;
const KAFKA_TOPIC = `${process.env.TOPICPREFIX}.${DB_NAME}.${COLLECTION_NAME}`;
const KAFKA_BROKER = process.env.KAFKABROKER;
const KAFKA_GROUP_ID = 'maps-consumer-group';

// === Global Variables ===
let dbClient, dbCollection;
const producerCoordinates = [];
const consumerCoordinates = [];
let driversTimeAndDist = {};

// === MongoDB Initialization ===
async function initializeMongoDB() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    dbClient = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = dbClient.db(DB_NAME);
    dbCollection = db.collection(COLLECTION_NAME);
    console.log('✅ Connected to MongoDB');

    const existingDocument = await dbCollection.findOne({});
    if (!existingDocument) {
      await dbCollection.insertOne({
        name: 'Driver Bob',
        lat: 51.504148054725356,
        lng: -0.09527206420898439,
      });
    }
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err);
    throw err;
  }
}

// === Kafka Consumer Setup ===
const kafka = new Kafka({ clientId: 'location-tracker', brokers: [KAFKA_BROKER] });
const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

async function initializeKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });

  console.log(`📥 Kafka consumer subscribed to topic: ${KAFKA_TOPIC}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        if (!message.value) {
          console.warn('⚠️ Received null Kafka message value.');
          return;
        }

        const parsedMessage = JSON.parse(message.value.toString());
        if (parsedMessage.after) {
          parsedMessage.after = JSON.parse(parsedMessage.after);
        }

        const { lat, lng, driverName, optimal } = parsedMessage.after;
        const refineMessage = {
          lat,
          lng,
          driverName,
          optimal,
          db: parsedMessage.source.db,
          collection: parsedMessage.source.collection,
          ts_ms: parsedMessage.ts_ms,
        };

        const now = parsedMessage.ts_ms;
        const coordsNow = [ refineMessage.lat, refineMessage.lng ]
        
        if (driversTimeAndDist[driverName]) {
          driversTimeAndDist[driverName].last_update_time = now;

          const elapsedMillis = now - driversTimeAndDist[driverName].start_time;
          const totalSeconds = Math.floor(elapsedMillis / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          driversTimeAndDist[driverName].time_elapsed = `${minutes}m ${seconds}s`;

  
          driversTimeAndDist[driverName].last_coord = coordsNow
          driversTimeAndDist[driverName].distance_covered = getDistanceFromLatLonInKm(driversTimeAndDist[driverName].start_coord, driversTimeAndDist[driverName].last_coord).toFixed(2); 

        } else {
          const coordHome = deliverDriversCoordinates.find(d => d.name === driverName).optimalPath.at(-1);
          const latLngArray = [coordHome.lat, coordHome.lng];
          driversTimeAndDist[driverName] = {
            start_time: now,
            last_update_time: now,
            time_elapsed: 0.00,
            distance_covered: 0,
            start_coord: latLngArray,
            last_coord: coordsNow,
            initial_driver_start: coordsNow,
            total_dist: getDistanceFromLatLonInKm(coordsNow, latLngArray),
            optimal: optimal,
          };
        }

        refineMessage.driversTimeAndDist = Object.entries(driversTimeAndDist).map(([name, data]) => ({
          name,
          time_elapsed: data.time_elapsed,
          distance_covered: data.distance_covered,
        }));

        console.log('📍Kafka message:', refineMessage);
        consumerCoordinates.push(refineMessage);
      } catch (err) {
        console.error('❌ Error processing Kafka message:', err);
      }
    },
  });
}

// === Initialization Wrapper ===
async function initializeServices() {
  try {
    await initializeMongoDB();
    await registerMongoConnector();
    await initializeKafkaConsumer();
    console.log('✅ MongoDB and Kafka consumer initialized successfully.');
  } catch (error) {
    console.error('❌ Service initialization failed:', error);
  }
}
initializeServices();

// === API Routes ===

app.get('/coordinates-list', (req, res) => {
  if (didDeliveryEnd) driversTimeAndDist = {}; // Reset timers
  res.send(deliverDriversCoordinates);
});

let didDeliveryEnd = false;
app.get('/start-delivery', async (req, res) => {
  try {
    const driversCoordinates = allDeliveryDriversMap;
    didDeliveryEnd = false
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const driverCoordinate of driversCoordinates) {
      const result = await dbCollection.updateOne(
        {},
        {
          $set: {
            driverName: driverCoordinate.name,
            lat: driverCoordinate.lat,
            lng: driverCoordinate.lng,
            optimal: driverCoordinate.optimal,
          },
        }
      );

      if (result.modifiedCount > 0) {
        producerCoordinates.push(driverCoordinate);
        console.log("✅ Driver's Coordinate updated in MongoDB:", driverCoordinate);
      } else {
        console.log('ℹ️ No update needed for:', driverCoordinate);
      }

      // Wait for 1 second before next iteration
      await delay(0);
    }

    didDeliveryEnd = true;
    res.json(driversOptimalPathInfo);
  } catch (err) {
    console.error('❌ Error updating coordinates:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/producer-info', (req, res) => {
  if (producerCoordinates.length === 0) return res.sendStatus(204);
  res.json(producerCoordinates.shift());
});

app.get('/consumer-info', (req, res) => {
  if (consumerCoordinates.length === 0) return res.sendStatus(204);
  res.json(consumerCoordinates.shift());
});

app.get('/check-delivery-status', (req, res) => {
  res.send(driversTimeAndDist);
});

// === Graceful Shutdown ===
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down Kafka consumer...');
  await consumer.disconnect();
  if (dbClient) await dbClient.close();
  process.exit(0);
});

// === Start Server ===
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
