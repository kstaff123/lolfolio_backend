const express = require("express");
const axios = require("axios");
const checkCache = require("../middleware/cacheMiddleware");

const router = express.Router();

const client = require("../redisclient");

router.get("/champion-masteries/:encryptedPUUID", checkCache, async (req, res) => {
  const {encryptedPUUID} = req.params;
  const cacheKey = `champion-masteries:${encryptedPUUID}`;

  try {
    // Fetch from Riot API
    const response = await axios.get(
      `https://na1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${encryptedPUUID}`,
      {
        headers: {
          "X-Riot-Token": process.env.RIOT_API_KEY,
        },
      }
    );

    const accountData = response.data;

    // Log before setting cache
    console.log("Setting cache for key:", cacheKey);

    // Set the cache
    await client.setEx(cacheKey, 60000, JSON.stringify(accountData));

    // Send the response
    res.status(200).json(accountData);
  } catch (error) {
    console.error("Error fetching Riot API:", error);
    res.status(500).send("Failed to fetch account data");
  }
});

module.exports = router;