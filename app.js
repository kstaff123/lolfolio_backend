require("dotenv").config(); // Load environment variables
const express = require("express");
const cors = require("cors"); // Ensure CORS is imported early

const accountRoutes = require("./routes/accountroutes.js");
const accountRoutesData = require("./routes/accountroutedata.js");
const rankedData = require("./routes/rankeddata.js");
const rankpercentile = require("./routes/rankpercentile.js");
const matchData = require("./routes/match.js");
const fetchMatchById = require("./routes/matchbyid.js");
const { fetchAndCacheData } = require("./prodrankcache.js");
const client = require("./redisclient.js");
const fetchChampMastery = require("./routes/championmastery.js");
const champList = require("./routes/champlistJson.js");

const app = express();

// Serve static files from the Vite build folder
app.use(express.static(path.join(__dirname, "frontend", "dist"))); // Adjust 'frontend/dist' to your Vite build folder

// Catch-all route to handle client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html")); // Adjust the path to your `index.html`
});

// Register CORS middleware
app.use(cors({
  origin: 'https://lolfolio-production.up.railway.app', // Replace with your frontend domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Add the HTTP methods your API supports
  allowedHeaders: ['Content-Type', 'Authorization'], // Include any custom headers your app uses
}));

// Handle preflight requests
app.options('*', cors());

// Register JSON parser middleware
app.use(express.json());

// Register routes
app.use("/api", accountRoutes, accountRoutesData, rankedData, rankpercentile, matchData, fetchMatchById, fetchChampMastery, champList );

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  try {
    console.log("Building ladder...");
    await fetchAndCacheData(); // Call the function with `await`
    console.log("Ladder built successfully");
    console.log(await client.keys("rank:*"));
} catch (error) {
    console.error("Error building ladder:", error);
}
});


