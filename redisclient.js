const { createClient } = require("redis");

const client = createClient({
  url: "redis://localhost:6379", // Use your Redis URL
});

client.on("error", (err) => console.error("Redis Client Error:", err));
client.on("connect", () => console.log("Connected to Redis!"));

// Ensure the client connects on initialization
(async () => {
  await client.connect();
})();

module.exports = client;
