const redis = require('redis');

// Use the Redis URL from environment variables
const client = redis.createClient({
  url: process.env.REDIS_URL, // Provided by Railway
  socket: {
    tls: true, // Enable this if Railway's Redis uses SSL
    rejectUnauthorized: false,
  },
});

// Handle connection events
client.on('connect', () => {
  console.log('Connected to Redis');
});

client.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

module.exports = client;
