const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/match-history/:puuid", async (req, res) => {
  const { puuid } = req.params;
  const region = "americas"; // Adjust for Match-V5 region
  const { start = 0, count = 10 } = req.query; // Default to first 10 matches

  try {
    // Fetch match IDs with pagination from Riot API
    const matchIdsResponse = await axios.get(
      `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        params: { start: parseInt(start), count: parseInt(count) },
        headers: {
          "X-Riot-Token": process.env.RIOT_API_KEY,
        },
      }
    );

    const matchIds = matchIdsResponse.data;

    console.log("Match IDs fetched:", matchIds);

    // Return the list of match IDs
    res.status(200).json(matchIds);
  } catch (error) {
    console.error("Error fetching match history:", error.message);
    res.status(500).json({ error: "Failed to fetch match history" });
  }
});

module.exports = router;
