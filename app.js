require("dotenv").config(); // Load environment variables
const express = require("express");
const accountRoutes = require("./routes/accountroutes.js");
const accountRoutesData = require("./routes/accountroutedata.js");
const rankedData = require("./routes/rankeddata.js");
const rankpercentile = require("./routes/rankpercentile.js");
const autocomplete = require("./routes/autocomplete.js");

const app = express();

app.use(express.json()); // Parse JSON requests
app.use("/api", accountRoutes, accountRoutesData, rankedData, rankpercentile, autocomplete); // Use account routes

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
