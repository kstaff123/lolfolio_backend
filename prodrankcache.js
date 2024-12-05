const axios = require('axios');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fs = require('fs');
const client = require("./redisclient");

const streamPipeline = promisify(pipeline);

const fetchAndCacheData = async () => {
  const fileUrl = 'https://storage.googleapis.com/playerladder/players-ladder.json';

  try {
    console.log('Downloading and processing JSON file...');
    const response = await axios({
      method: 'get',
      url: fileUrl,
      responseType: 'stream',
    });

    const tempFilePath = './temp-players-ladder.json';
    await streamPipeline(response.data, fs.createWriteStream(tempFilePath));

    console.log('Reading and caching data...');
    const fileStream = fs.createReadStream(tempFilePath);
    let buffer = '';

    fileStream.on('data', (chunk) => {
      buffer += chunk.toString();
    });

    fileStream.on('end', async () => {
      const players = JSON.parse(buffer);
      await cachePlayersInRedis(client, players);

      console.log('Cleaning up...');
      fs.unlinkSync(tempFilePath);
    });

    fileStream.on('error', (err) => {
      console.error('Error reading file:', err.message);
    });
  } catch (error) {
    console.error('Error during fetch or processing:', error.message);
  }
};

const cachePlayersInRedis = async (client, players) => {
    try {
      const redisMulti = client.multi(); // Use multi() for batch operations
      players.forEach((player) => {
        const key = `rank:${player.ladderRank}:${player.summonerId}`;
        redisMulti.set(key, JSON.stringify(player), 'EX', 86400); // Set the key with expiration
      });
      await redisMulti.exec(); // Execute all commands in the batch
      console.log('Cached players in Redis.');
    } catch (error) {
      console.error('Error caching players:', error.message);
    }
  
    console.log('Download, processing, and caching completed successfully.');
  };
  

module.exports = { fetchAndCacheData};