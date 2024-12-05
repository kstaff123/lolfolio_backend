const axios = require('axios');
const fs = require('fs');
const client = require("./redisclient");

const fetchAndCacheData = async () => {
  const fileUrl = 'https://storage.googleapis.com/playerladder/players-ladder.json';

  try {
    console.log('Downloading JSON file...');
    const response = await axios.get(fileUrl); // Fetch entire JSON file directly
    const players = response.data; // Parse the JSON from response

    console.log('Caching data in Redis...');
    await cachePlayersInRedis(client, players);

    console.log('Data cached successfully.');
  } catch (error) {
    console.error('Error during fetch or caching process:', error.message);
  }
};

const cachePlayersInRedis = async (client, players) => {
  try {
    const redisMulti = client.multi(); // Use multi() for batch operations
    players.forEach((player) => {
      const key = `rank:${player.ladderRank}:${player.summonerId}`;
      redisMulti.set(key, JSON.stringify(player), 'EX', 99999999999); // Set the key with expiration
    });
    await redisMulti.exec(); // Execute all commands in the batch
    console.log('Cached players in Redis.');
  } catch (error) {
    console.error('Error caching players:', error.message);
  }
};

module.exports = { fetchAndCacheData };
