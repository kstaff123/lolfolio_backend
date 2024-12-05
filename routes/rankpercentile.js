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
      const region = "na1"; // Replace with the appropriate region
      const riotResponse = await axios.get(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/${summonerId}`,
        {
          headers: {
            "X-Riot-Token": process.env.RIOT_API_KEY,
          },
        }
      );
  
      const playerData = riotResponse.data;
  
      // Fetch rank from Redis
      const rankKeys = await client.keys("rank:*");
      const totalPlayers = rankKeys.length;
  
      const rankKey = rankKeys.find((key) => key.endsWith(summonerId));
      console.log("Summoner ID:", summonerId);
      console.log("Rank Keys:", rankKeys);
      console.log("Number of rank keys:", rankKeys.length);


      console.log("Rank key:", rankKey);
      console.log("Rank Percentile playerData", playerData);
      let rank = "unknown";
      let percentile = "unknown";
  
      if (rankKey) {
        const rankIndex = parseInt(rankKey.split(":")[1], 10);
        rank = rankIndex;
        // Calculate percentile (players better than this rank)
        let calculatedPercentile = (rankIndex / totalPlayers) * 100;
  
        // Adjust formatting for very high ranks
        if (calculatedPercentile < 0.01) {
          percentile = calculatedPercentile.toFixed(4); // Show up to 4 decimal places for top 0.01%
        } else if (calculatedPercentile < 1) {
          percentile = calculatedPercentile.toFixed(2); // Show 2 decimal places for top 1%
        } else {
          percentile = calculatedPercentile.toFixed(2); // Default to 2 decimal places
        }
      }
  
      const responseData = {
        ...playerData,
        rank,
        percentile: percentile !== "unknown" ? `${percentile}` : percentile,
      };
  
      // Update Redis cache with a long expiration time
      await client.set(cacheKey, JSON.stringify(responseData), "EX", 604800); // Cache for 7 days
  
      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error fetching Riot API or processing data:", error.message);
      res.status(500).json({ error: "Failed to fetch player data" });
    }
  });
  
  module.exports = router;
  