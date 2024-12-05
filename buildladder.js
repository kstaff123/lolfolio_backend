require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const redis = require("redis");
const client = require("./redisclient");
const { json } = require("express");


// Constants for sorting
const rankOrder = {
  CHALLENGER: 1,
  GRANDMASTER: 2,
  MASTER: 3,
  DIAMOND: 4,
  EMERALD: 5,
  PLATINUM: 6,
  GOLD: 7,
  SILVER: 8,
  BRONZE: 9,
  IRON: 10,
};
const divisionOrder = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
};

// Sleep with countdown
const sleepWithCountdown = async (ms, reason = "Waiting") => {
  let remainingTime = Math.ceil(ms / 1000);
  while (remainingTime > 0) {
    console.log(`${reason}. ${remainingTime} seconds remaining...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    remainingTime--;
  }
};

// Calculate ladder rank
const calculateLadderRank = (players) => {
  players.sort((a, b) => {
    if (rankOrder[a.tier] !== rankOrder[b.tier]) {
      return rankOrder[a.tier] - rankOrder[b.tier];
    }
    if (divisionOrder[a.rank] !== divisionOrder[b.rank]) {
      return divisionOrder[a.rank] - divisionOrder[b.rank];
    }
    return b.leaguePoints - a.leaguePoints;
  });

  players.forEach((player, index) => {
    player.ladderRank = index + 1;
  });

  return players;
};

// Cache players in Redis
const cachePlayersInRedis = async (client, players) => {
  for (const player of players) {
    const key = `rank:${player.ladderRank}:${player.summonerId}`;
    const value = JSON.stringify(player);

    await client.set(key, value, "EX", 86400, (err) => {
      if (err) console.error(`Failed to cache ${key}: ${err.message}`);
    });
  }
  console.log("Cached players in Redis.");
};

// Incremental save to JSON
const saveToJSON = (filename, data) => {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filename}`);
  } catch (error) {
    console.error("Error saving to JSON:", error.message);
  }
};

const start = async () => {

  try {
    console.log("Loading players from JSON file...");
    const players = JSON.parse(fs.readFileSync("players-ladder.json"));

    console.log(`Fetched ${players.length} players.`);

    console.log("Calculating ranks...");
    const rankedPlayers = calculateLadderRank(players);

    console.log("Saving data to JSON...");
    saveToJSON("players-ladder.json", rankedPlayers);

    console.log("Caching data in Redis...");
    await cachePlayersInRedis(client, rankedPlayers);

    console.log("All tasks completed successfully.");
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
};
const cacheData = async () => {
  const externalFileUrl = "https://storage.googleapis.com/playerladder/players-ladder.json";

  try {
    console.log('Fetching JSON from external storage...');
    const response = await axios.get(externalFileUrl);
    const players = response.data; // Assumes the file is valid JSON

    console.log('Caching data in Redis...');
    await cachePlayersInRedis(client, players);
    console.log('Data cached successfully.');
  } catch (error) {
    console.error('Error fetching or caching players:', error.message);
  }
};


module.exports = {cacheData, cachePlayersInRedis};