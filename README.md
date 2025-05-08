# Delivery Tracking System using Cosmos DB vCore Change Streams and Kafka-Debezium 🚚📍

A real-time delivery tracking web application powered by **MongoDB vCore Change Streams** (Cosmos DB), integrated with **Kafka** using the **Debezium MongoDB Connector**.

This app simulates **delivery agents 🛵** moving toward **Delivery Locations 🏠** using real map data. Location updates are written directly to **MongoDB vCore**, and **Debezium** captures these changes via change streams and forwards them to **Kafka**. The frontend consumes these updates from Kafka to display live movement on the map.


## ⚙️ Pre-requisites

- A **Cosmos DB for MongoDB vCore** instance (🔗 [Create one](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/quickstart-portal))
    - ✅ **Change Streams** enabled on the cluster (🔗 [Enable it](https://learn.microsoft.com/en-us/azure/cosmos-db/mongodb/vcore/change-streams?tabs=javascript%2CInsert))
    - 💡 **Store the MongoDB connection string** for use in subsequent configuration steps
- **Docker** and **Docker Compose** installed and running (🔗 [Install guide](https://docs.docker.com/get-docker/))

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone https://github.com/sai-sambhu/delivery-tracking-vCore-debezium.git
cd delivery-tracking-vCore-debezium
npm install
```

### 2. Set Environment Variables

Ensure that both the `.env` file and `mongo-connector.json` file are updated with the appropriate values. Any configuration values that appear in both files must match exactly to ensure proper integration and avoid connection issues.

> **Note:** if any port overlapping error, both values of new ports must be configired in `.env` file and `mongo-connector.json` file


---

### 3. Run with Docker

```bash
# Check if any containers are running
docker ps

# Start the containers
docker-compose up -d # wait till the all the containers are up and running

# Tail logs from a container (e.g., node backend)
docker logs -f node-server # wait till the message ✅ MongoDB and Kafka consumer initialized successfully. 

# Stop the containers
docker compose down -v
```

---

### 4. View in Browser

Visit: index.html by clicking on the file in the browser which is not safari

(or) 

✅ macOS (Terminal)
```bash
cd navigate to repo directory
open index.html
```

✅ Windows (Command Prompt)
```bash
cd navigate to repo directory
start index.html
```

✅ Linux (Terminal)
```bash
cd navigate to repo directory
xdg-open index.html
```

- Use the "See Live Deliveries" button to start streaming agent position
- You’ll see agents updating in real-time as data flows from MongoDB → Debezium → Kafka → Frontend
- additionally you have see summary button for viewing overall info dashboard on deliveries status
---
