// In analytics-service/index.js

const amqp = require('amqplib');
const { Pool } = require('pg');

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = 'url_clicks';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


async function startConsumer() {
  console.log('Analytics service starting...');
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });

    console.log(`[*] Waiting for messages in ${QUEUE_NAME}. To exit press CTRL+C`);

    channel.consume(QUEUE_NAME, async (msg) => {
      if (msg !== null) {
        const { shortCode } = JSON.parse(msg.content.toString());
        console.log(`[x] Received message for shortCode: ${shortCode}`);

        try {
          const query = 'UPDATE urls SET click_count = click_count + 1 WHERE short_code = $1';
          await pool.query(query, [shortCode]);
          console.log(`[+] Updated click count for ${shortCode}`);
          
          // Acknowledge the message so RabbitMQ removes it from the queue
          channel.ack(msg);
        } catch (dbError) {
          console.error('Failed to update database', dbError);
          // Optionally, you could requeue the message if the DB fails
          channel.nack(msg);
        }
      }
    });
  } catch (error) {
    console.error('Failed to start consumer:', error);
    // Exit or retry logic
    setTimeout(startConsumer, 5000); // Retry after 5 seconds
  }
}

startConsumer();