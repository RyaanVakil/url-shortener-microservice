// In url-shortener/index.js

const express = require('express');
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const amqp = require('amqplib');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(express.json());
const PORT = 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// RabbitMQ Connection Logic
let amqpChannel = null;
const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = 'url_clicks';

async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    amqpChannel = await connection.createChannel();
    await amqpChannel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('Successfully connected to RabbitMQ.');
  } catch (error) {
    console.error('Failed to connect to RabbitMQ', error);
  }
}

const createTable = async () => {
  const client = await pool.connect();
  try {
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
  } catch (err) {
    console.error('Error creating table:', err);
  } finally {
    client.release();
  }
};

// --- API Endpoints ---
app.get('/', (req, res) => {
  res.send('URL Shortener API is alive!');
});

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
    const newShortUrl = `http://localhost:3000/${result.rows[0].short_code}`;
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
    
    if (amqpChannel) {
      const message = { shortCode };
      amqpChannel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(message)));
      console.log(`Sent click event for ${shortCode} to queue.`);
    }

    const { original_url } = result.rows[0];
    res.redirect(302, original_url);
  } catch (err) {
    console.error('Error retrieving from database:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// A new route to check the analytics for a given short code
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

// Start the server and connect to services
app.listen(PORT, () => {
  console.log(`Shortener service listening on port ${PORT}`);
  createTable();
  connectToRabbitMQ();
});