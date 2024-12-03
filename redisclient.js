const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDISHOST}:${process.env.REDISPORT}`,
    password: process.env.REDISPASSWORD, // Include password if required
});

client.on('error', (err) => console.error('Redis Client Error:', err));
client.connect();

module.exports = client;
