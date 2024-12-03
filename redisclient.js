const { createClient } = require("redis");

const client = redis.createClient({
  url: process.env.REDIS_URL, // This variable is automatically injected by Railway
  socket: {
    tls: true, // Enable TLS (required for most Railway Redis setups)
    rejectUnauthorized: false,
  },
});

client.on('connect', () => console.log('Connected to Redis'));
client.on('error', (err) => console.error('Redis Client Error', err));

client.connect();
