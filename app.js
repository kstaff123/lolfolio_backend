require("dotenv").config(); // Load environment variables
const express = require("express");
const accountRoutes = require("./routes/accountroutes.js");
const accountRoutesData = require("./routes/accountroutedata.js");
const rankedData = require("./routes/rankeddata.js");
const rankpercentile = require("./routes/rankpercentile.js");
const matchData = require("./routes/match.js");
const fetchMatchById = require("./routes/matchbyid.js");

const cors = require('cors');





const app = express();

app.use(express.json()); // Parse JSON requests
app.use("/api", accountRoutes, accountRoutesData, rankedData, rankpercentile, matchData, fetchMatchById); // Use account routes

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.use(cors({
  origin: 'https://lolfolio-production.up.railway.app', // Replace with your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Add the HTTP methods your API supports
  allowedHeaders: ['Content-Type', 'Authorization'], // Include any custom headers your app uses
}));

// Handle preflight requests (optional, but recommended for complex requests)
app.options('*', cors());
