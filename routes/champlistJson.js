const express = require("express");
const axios = require("axios");

const router = express.Router();

router.get("/champlist", async (req, res) => {
  try {
    // Fetch from Riot API
    const response = await axios.get(
      "https://ddragon.leagueoflegends.com/cdn/14.23.1/data/en_US/champion.json"
    );

    const champList = response.data;

    // Send the response
    res.status(200).json(champList);
  } catch (error) {
    console.error("Error fetching champ list", error);
    res.status(500).send("Failed to fetch champ list");
  }
});

module.exports = router;
