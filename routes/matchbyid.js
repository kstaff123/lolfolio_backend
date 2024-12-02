const express = require("express");
const axios = require("axios");
const router = express.Router();
const client = require("../redisclient"); // Redis client

router.get("/match/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const region = "americas"; // Match-V5 region
  const cacheKey = `match:${matchId}`;

  try {
    // Check Redis cache first
    const cachedMatch = await client.get(cacheKey);
    if (cachedMatch) {
      console.log(`Cache HIT for match ID: ${matchId}`);
      return res.status(200).json({ id: matchId, data: JSON.parse(cachedMatch) });
    }

    console.log(`Cache MISS for match ID: ${matchId}`);

    // Fetch match details from Riot API
    const matchResponse = await axios.get(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
      {
        headers: {
          "X-Riot-Token": process.env.RIOT_API_KEY,
        },
      }
    );

    const matchData = matchResponse.data;

    // Cache match data with a very long expiration time (e.g., 6 months)
    await client.set(cacheKey, JSON.stringify(matchData), "EX", 15552000); // Cache for 6 months

    // Return match data with ID attached
    res.status(200).json({ id: matchId, data: matchData });
  } catch (error) {
    console.error(`Error fetching match ID ${matchId}:`, error.message);
    res.status(500).json({ error: "Failed to fetch match data" });
  }
});

module.exports = router;
