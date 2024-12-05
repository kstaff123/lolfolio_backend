const express = require("express");
const axios = require("axios");

const router = express.Router();

const client = require("../redisclient");

router.get("/league/:encryptedSummonerId",  async (req, res) => {
  const { encryptedSummonerId } = req.params;
  const cacheKey = `${encryptedSummonerId}`;

  try {
    // Fetch from Riot API
    const response = await axios.get(
      `https://NA1.api.riotgames.com/lol/league/v4/entries/by-summoner/${encryptedSummonerId}`,
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