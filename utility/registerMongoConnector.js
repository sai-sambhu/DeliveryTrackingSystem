const axios = require('axios');
const fs = require('fs');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function registerMongoConnector() {
  try {
    // Read the JSON config file from the current directory
    const data = fs.readFileSync('./mongo-connector.json', 'utf8');

    // Make the POST request to Kafka Connect
    const response = await axios.post('http://debezium-connect:8083/connectors', JSON.parse(data), {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Connector registered:', response.data);
  } catch (error) {
    const errData = error.response?.data;

    if (
      error.response?.status === 409 &&
      errData?.message?.includes('already exists')
    ) {
      console.warn('⚠️ Connector already exists. Skipping registration.');
      return;
    }

    console.error('❌ Error registering connector:', errData || error.message);

    await delay(4000);
    await registerMongoConnector();
  }
}

//registerMongoConnector();

module.exports = { registerMongoConnector };
