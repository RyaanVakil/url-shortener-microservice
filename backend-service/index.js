// In backend-service/index.js
const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const { Pool } = require('pg');
const { Connector } = require('@google-cloud/cloud-sql-connector');
const { PubSub } = require('@google-cloud/pubsub');

const app = express();
app.use(cors());
app.use(express.json());
const PORT = process.env.PORT || 8080;

const pubsub = new PubSub();
const connector = new Connector();

// --- Database Connection ---
const createDbPool = async () => {
  const clientOpts = await connector.getOptions({
    instanceConnectionName: process.env.DB_CONNECTION_NAME,
    ipType: 'PUBLIC',
  });
  return new Pool({
    ...clientOpts,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 5,
  });
};
let pool;

const createTable = async () => {
  try {
    const client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code VARCHAR(10) UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        click_count INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table "urls" is ready.');
    client.release();
  } catch (err) {
    console.error('Error creating table:', err);
  }
};

// --- Pub/Sub (Messaging) Logic ---
const TOPIC_NAME = 'url-clicks';
const SUBSCRIPTION_NAME = 'url-clicks-sub';

async function publishClickEvent(shortCode) {
  try {
    const dataBuffer = Buffer.from(JSON.stringify({ shortCode }));
    await pubsub.topic(TOPIC_NAME).publishMessage({ data: dataBuffer });
    console.log(`Message published for ${shortCode}.`);
  } catch (error) {
    console.error('Error publishing message:', error);
  }
}

function startClickConsumer() {
  const subscription = pubsub.subscription(SUBSCRIPTION_NAME);
  const messageHandler = async (message) => {
    try {
      const { shortCode } = JSON.parse(message.data.toString());
      console.log(`Received click event for ${shortCode}`);
      const query = 'UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1';
      await pool.query(query, [shortCode]);
      console.log(`Updated click count for ${shortCode}`);
      message.ack();
    } catch (error) {
      console.error('Error processing message:', error);
      message.nack();
    }
  };
  subscription.on('message', messageHandler);
  console.log(`Listening for messages on ${SUBSCRIPTION_NAME}`);
}

// --- API Endpoints ---
app.get('/', (req, res) => res.send('URL Shortener API is alive!'));

app.post('/shorten', async (req, res) => {
  const { url: originalUrl } = req.body;
  if (!originalUrl) {
    return res.status(400).json({ error: 'URL is required' });
  }
  const shortCode = nanoid(7);
  try {
    const query = `
      INSERT INTO urls (original_url, short_code)
      VALUES ($1, $2)
      RETURNING short_code;
    `;
    const result = await pool.query(query, [originalUrl, shortCode]);
    const newShortUrl = `https://${req.get('host')}/${result.rows[0].short_code}`;
    res.status(201).json({ short_url: newShortUrl });
  } catch (err) {
    console.error('Error saving to database:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  try {
    const query = `SELECT original_url FROM urls WHERE short_code = $1;`;
    const result = await pool.query(query, [shortCode]);
    if (result.rows.length === 0) {
      return res.status(404).send('URL not found');
    }
    
    await publishClickEvent(shortCode);

    const { original_url } = result.rows[0];
    res.redirect(302, original_url);
  } catch (err) {
    console.error('Error retrieving from database:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/analytics/:shortCode', async (req, res) => {
  const { shortCode } = req.params;
  try {
    const query = 'SELECT original_url, click_count FROM urls WHERE short_code = $1';
    const result = await pool.query(query, [shortCode]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'URL not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Server Startup ---
const startServer = async () => {
  try {
    pool = await createDbPool();
    await createTable();
    startClickConsumer();
    app.listen(PORT, () => {
      console.log(`Backend service listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();