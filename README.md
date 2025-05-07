# Delivery Tracking App 🚚📍

A real-time delivery tracking web application powered by **MongoDB vCore Change Streams** (Cosmos DB), integrated with **Kafka** using the **Debezium MongoDB Connector**.

---

## 📌 Project Overview

This app simulates **delivery agents 🛵** moving toward **Delivery Locations 🏠** using real map data. Location updates are written directly to **MongoDB vCore**, and **Debezium** captures these changes via change streams and forwards them to **Kafka**. The frontend consumes these updates from Kafka to display live movement on the map.

---

## 🛠️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript, Leaflet.js
- **Backend:** Node.js, Express.js
- **Database:** Azure Cosmos DB for MongoDB vCore (with Change Streams enabled)
- **Streaming:** Apache Kafka + Debezium MongoDB Connector
- **Visualization:** Leaflet.js with Routing Machine

---

## ⚙️ Features

- 🗺️ Interactive live map showing delivery agents and their delivery destinations
- ✅ Smart randomization between optimal and deviated paths
- 🔁 Real-time updates written to MongoDB vCore
- 📥 Kafka consumer processes Debezium-sourced change stream events
- ⏱️ Duration timers per delivery agent
- 🚴 Distance travelled and Distance left by the delivery agents to reach destination
- 🔄 Dynamic route redraws based on updates

---

## 🔄 Architecture Flow

```text
[Frontend UI] ←── [Kafka Consumer] ←── [Kafka Topic] ←── [Debezium Connector] ←── [MongoDB vCore] ←── [Backend writes location]
```

- No Kafka producer logic is implemented by the backend.
- Location updates are written to MongoDB.
- Debezium listens to change streams and pushes changes to Kafka.
- Frontend/backend consume from Kafka for real-time visualization.


---

## ⚙️ Requirements Before Running the App

### 1. Cosmos DB for MongoDB vCore – Enable Change Streams

To create a mongo db vCore instance using Cosmos DB:

- Follow this official guide:

  🔗 [Create a new vCore Instance in Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/quickstart-portal)

To use change streams in Azure Cosmos DB for MongoDB vCore:

- Follow this official guide:  

  🔗 [Enable Change Streams in Cosmos DB](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/change-streams?tabs=javascript%2CInsert)

> Make sure:
> - You have created a database and collection, configure database and collection in mongo-connector.json
> - Your connection string is ready and included in the `.env` file



### 2. Install Docker

This project uses Docker and Docker Compose.

- 🔗 [Install Docker](https://docs.docker.com/get-docker/)
- Ensure Docker is running on your system.

---

## 📂 Project Structure

```bash
.
├── index.html                      # Main frontend
├── styles.css                      # Global styling
├── server.js                       # Express server: routes, Kafka, Mongo, simulation
├── utility/                        # Additional utilities and HTML views
│   ├── checkDeliveryStatus.html
│   ├── coordinatesPath.html
│   └── ...
├── mongo-connector.json            # MongoDB source connector config for Debezium
├── docker-compose.yml             # Compose file for multi-container setup
├── Dockerfile                      # Node.js Docker config
├── .env                            # Environment config (Mongo, Kafka, etc.)
└── README.md                       # This file
```

---

## 🔑 Key Routes

| Endpoint                             | Description                                           |
|--------------------------------------|-------------------------------------------------------|
| `/coordinates-list`                  | Gets optimal and deviated routes, coordinates         |
| `/start-delivery`                    | Starts the simulation (writes location to MongoDB)    |
| `/consumer-info`                     | Returns latest Kafka event data for frontend          |
| `/producer-info`                     | Returns latest MongoDB event data for frontend        |
| `/check-delivery-status`             | get details of drivers delivery status.               |
---

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/sai-sambhu/DeliveryTrackingSystem.git
cd DeliveryTrackingSystem
npm install
```

### 2. Set Environment Variables

update the `.env` file with:

```env
MONGODB_URI=your_cosmosdb_connection_string
KAFKA_BROKER=your_kafka_broker_host:port
KAFKA_TOPIC=your_kafka_topic_name
TOPICPREFIX =your_topic_prefix (should be configured same in  mongoconnector.json)
DBNAME=your_db_name (should be configured same in  mongoconnector.json)
COLLECTIONNAME=your_collection_name (should be configured same in  mongoconnector.json)
```

Make sure these are configured properly before moving forward.

---

### 3. Run with Docker

```bash
# Check if any containers are running
docker ps

# Start the containers
docker-compose up -d

# Tail logs from a container (e.g., node backend)
docker logs -f node-server
```

---

### 4. View in Browser

Visit: index.html

- Use the "See Live Deliveries" button to start streaming agent positions
- You’ll see agents updating in real-time as data flows from MongoDB → Debezium → Kafka → Frontend

---

## 🧪 Optional: View Raw Data

Visit `utility/checkDeliveryStatus.html` to get a tabular view of all drivers, their coordinates, time, and distance.

---
