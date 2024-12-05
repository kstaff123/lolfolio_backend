require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const redis = require("redis");

const client = redis.createClient();

client.on("error", (err) => console.error("Redis client error:", err));
client.on("connect", () => console.log("Connected to Redis"));

// Constants for sorting and rate limits
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

// Rate limit constants
const MAX_REQUESTS_PER_SECOND = 20;
const MAX_REQUESTS_PER_2_MINUTES = 100;
const TWO_MINUTES = 120000;

// State tracking API requests
let requestsInLastSecond = 0;
let requestsInLastTwoMinutes = 0;

// Sleep with countdown
const sleepWithCountdown = async (ms, reason = "Waiting") => {
  let remainingTime = Math.ceil(ms / 1000);

  while (remainingTime > 0) {
    console.log(`${reason}. ${remainingTime} seconds remaining...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    remainingTime--;
  }
};

// Throttle requests
// Throttle requests
const throttle = async () => {
    while (
      requestsInLastSecond >= MAX_REQUESTS_PER_SECOND ||
      requestsInLastTwoMinutes >= MAX_REQUESTS_PER_2_MINUTES
    ) {
      const waitReason =
        requestsInLastTwoMinutes >= MAX_REQUESTS_PER_2_MINUTES
          ? "Two-minute rate limit reached"
          : "One-second rate limit reached";
      console.log(
        `Throttling requests. requestsInLastSecond: ${requestsInLastSecond}, requestsInLastTwoMinutes: ${requestsInLastTwoMinutes}`
      );
  
      // Dynamically calculate wait time for two-minute limit
      const waitTime =
        requestsInLastTwoMinutes >= MAX_REQUESTS_PER_2_MINUTES ? TWO_MINUTES : 1000;
      await sleepWithCountdown(waitTime, waitReason);
    }
    requestsInLastSecond++;
    requestsInLastTwoMinutes++;
  };
  
  

// Reset request counters
// Reset request counters
setInterval(() => {
    requestsInLastSecond = 0;
  }, 1000);
  
  setInterval(() => {
    console.log(`Resetting two-minute counter...`);
    requestsInLastTwoMinutes = 0;
  }, TWO_MINUTES);

  console.log(`Resetting requestsInLastTwoMinutes to 0`);
requestsInLastTwoMinutes = 0;

  

// Incremental save to JSON
const saveToJSON = (filename, data) => {
  try {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Data saved to ${filename}`);
  } catch (error) {
    console.error("Error saving to JSON:", error.message);
  }
};

// Fetch with retry and backoff
const fetchWithRetry = async (url, retries = 3) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      await throttle();
      const response = await axios.get(url, {
        headers: { "X-Riot-Token": process.env.RIOT_API_KEY },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers["retry-after"];
        const backoff = retryAfter
          ? parseInt(retryAfter) * 1000
          : Math.min(2 ** attempt * 1000, 120000);
        console.warn(`Rate limit hit. Retrying in ${backoff / 1000} seconds...`);
        await sleepWithCountdown(backoff, "Rate limit cooldown");
      } else {
        console.error(`Error fetching data: ${error.message}`);
        if (attempt === retries) throw error;
      }
    }
  }
};

// Fetch top-tier data
const fetchTopTierData = async () => {
  const TIERS = ["challengerleagues", "grandmasterleagues", "masterleagues"];
  const QUEUE = "RANKED_SOLO_5x5";
  const region = "na1";
  const players = [];

  for (const tier of TIERS) {
    const url = `https://${region}.api.riotgames.com/lol/league/v4/${tier}/by-queue/${QUEUE}`;
    try {
      console.log(`Fetching ${tier}...`);
      const data = await fetchWithRetry(url);
      players.push(...data.entries);
      console.log(`Fetched ${data.entries.length} players from ${tier}.`);

      // Save incrementally
      if (players.length % 1000 === 0) {
        saveToJSON("players-ladder.json", players);
      }
    } catch (error) {
      console.error(`Failed to fetch ${tier}: ${error.message}`);
    }
  }

  return players;
};

// Fetch lower-tier data
const fetchLowerTierData = async () => {
  const TIERS = ["DIAMOND", "EMERALD", "PLATINUM", "GOLD", "SILVER", "BRONZE", "IRON"];
  const DIVISIONS = ["I", "II", "III", "IV"];
  const QUEUE = "RANKED_SOLO_5x5";
  const region = "na1";
  const players = [];

  for (const tier of TIERS) {
    for (const division of DIVISIONS) {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/${QUEUE}/${tier}/${division}?page=${page}`;
        try {
          console.log(`Fetching ${tier} ${division}, Page ${page}...`);
          const data = await fetchWithRetry(url);
          if (data.length === 0) {
            hasMore = false;
          } else {
            players.push(...data);
            page++;

            // Save incrementally
            if (players.length % 1000 === 0) {
              saveToJSON("players-ladder.json", players);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${tier} ${division}, Page ${page}: ${error.message}`);
          hasMore = false;
        }
      }
    }
  }

  return players;
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
const cachePlayersInRedis = async (players) => {
  for (const player of players) {
    const key = `rank:${player.ladderRank}:${player.summonerId}`;
    const value = JSON.stringify(player);

    await client.set(key, value, "EX", 86400, (err) => {
      if (err) console.error(`Failed to cache ${key}: ${err.message}`);
    });
  }
  console.log("Cached players in Redis.");
};

// Main function
(async () => {
  try {
    console.log("Fetching all ranked players...");
    const topPlayers = await fetchTopTierData();
    const lowerPlayers = await fetchLowerTierData();

    const allPlayers = [...topPlayers, ...lowerPlayers];
    console.log(`Fetched ${allPlayers.length} players.`);

    console.log("Calculating ranks...");
    const rankedPlayers = calculateLadderRank(allPlayers);

    console.log("Saving data to JSON...");
    saveToJSON("players-ladder.json", rankedPlayers);

    console.log("Caching data in Redis...");
    await cachePlayersInRedis(rankedPlayers);

    console.log("Done!");
  } catch (error) {
    console.error("An error occurred:", error.message);
  } finally {
    client.quit();
  }
})();
