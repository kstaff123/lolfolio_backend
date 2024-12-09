/* const redis = require('redis');

const client = redis.createClient({
    url: process.env.REDIS_URL || `redis://${process.env.REDISHOST}:${process.env.REDISPORT}`,
    password: process.env.REDISPASSWORD, // Include password if required
});

client.on('error', (err) => console.error('Redis Client Error:', err));
client.connect();

module.exports = client; */



const { createClient } = require("redis");
const client = createClient({
  url: `redis://default:${process.env.REDIS_PASSWORD}@localhost:6379`, // Use your Redis URL
});
client.on("error", (err) => console.error("Redis Client Error:", err));
client.on("connect", () => console.log("Connected to Redis!"));
// Ensure the client connects on initialization
(async () => {
  await client.connect();
})();
module.exports = client;