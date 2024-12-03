const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL, // Use the Redis URL from your environment variables
    socket: {
        tls: true, // Enable TLS if required by your Redis setup
        rejectUnauthorized: false,
    },
});

client.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

client.connect();

module.exports = client;
