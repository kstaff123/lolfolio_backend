const client = require("../redisclient");

const checkCache = async (req, res, next) => {
  const { gameName, tagLine } = req.params;
  const cacheKey = `${gameName}:${tagLine}`;

  try {
    const cachedData = await client.get(cacheKey); // Check for cached data
    if (cachedData) {
      console.log("Cache HIT for key:", cacheKey); // Log cache hit
      return res.status(200).json(JSON.parse(cachedData)); // Serve cached data
    }

    console.log("Cache MISS for key:", cacheKey); // Log cache miss
    next(); // Continue to the route handler
  } catch (err) {
    console.error("Redis error:", err);
    res.status(500).send("Redis error");
  }
};

module.exports = checkCache;
