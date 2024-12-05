const express = require("express");
const axios = require("axios");
const router = express.Router();
const client = require("../redisclient");

router.get("/player/:summonerId", async (req, res) => {
  const { summonerId } = req.params;
  const cacheKey = `player:${summonerId}`;

  try {
    // Check Redis cache first
    const cachedData = await client.get(cacheKey);
    if (cachedData) {
      console.log("Returning cached data for:", summonerId);
      return res.status(200).json(JSON.parse(cachedData));
    }

    // Fetch data from Riot API
    const region = "na1";
    const riotResponse = await axios.get(
      `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`,
      {
        headers: {
          "X-Riot-Token": process.env.RIOT_API_KEY,
        },
      }
    );

    const playerData = riotResponse.data;

    // Fetch rank from Redis using SCAN
    const rankKeys = await scanKeys("rank:*");
    console.log("Number of rank keys:", rankKeys.length);

    const rankKey = rankKeys.find((key) => key.endsWith(summonerId));
    console.log("Rank Key:", rankKey);

    let rank = "unknown";
    let percentile = "unknown";

    if (rankKey) {
      const rankIndex = parseInt(rankKey.split(":")[1], 10);
      rank = rankIndex;
      const calculatedPercentile = ((rankIndex / rankKeys.length) * 100).toFixed(2);
      percentile = calculatedPercentile < 1 ? calculatedPercentile.toFixed(4) : calculatedPercentile;
    }

    const responseData = {
      ...playerData,
      rank,
      percentile: percentile !== "unknown" ? `${percentile}` : percentile,
    };

    // Update Redis cache
    await client.set(cacheKey, JSON.stringify(responseData), "EX", 604800);

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching Riot API or processing data:", error.message);
    res.status(500).json({ error: "Failed to fetch player data" });
  }
});

const scanKeys = async (pattern) => {
  let cursor = '0';
  const keys = [];
  do {
    const [nextCursor, scanResults] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
    cursor = nextCursor;
    keys.push(...scanResults);
  } while (cursor !== '0');
  return keys;
};

module.exports = router;