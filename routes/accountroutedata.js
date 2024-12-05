const express = require("express");
const axios = require("axios");

const router = express.Router();

const client = require("../redisclient");

router.get("/summoner/:PUUID", async (req, res) => {
  const { PUUID } = req.params;
  const cacheKey = `${PUUID}`;

  try {
    // Fetch from Riot API
    const response = await axios.get(
      `https://NA1.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${PUUID}`,
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