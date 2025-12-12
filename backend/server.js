// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Center of incidents (you can change this to your city)
const CENTER = { lat: 17.385, lng: 78.486 }; // example: Hyderabad

const DISASTER_TYPES = ["Earthquake", "Flood", "Fire", "Cyclone", "Landslide"];
const SEVERITIES = ["LOW", "MEDIUM", "HIGH"];

function randomInRange(base, range) {
  return base + (Math.random() - 0.5) * range;
}

function generateRandomIncident(id) {
  const type = DISASTER_TYPES[Math.floor(Math.random() * DISASTER_TYPES.length)];
  const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];

  const lat = randomInRange(CENTER.lat, 0.2);
  const lng = randomInRange(CENTER.lng, 0.2);

  const distanceKm = (Math.random() * 15 + 1).toFixed(1);
  const minutesAgo = Math.floor(Math.random() * 120); // within last 2 hours

  return {
    _id: id.toString(),
    type,
    severity,
    lat,
    lng,
    distanceKm,
    timeAgoMinutes: minutesAgo,
    description: `${severity} ${type} reported ~${distanceKm} km away`,
  };
}

function generateIncidentBatch(count = 20) {
  const arr = [];
  for (let i = 1; i <= count; i++) {
    arr.push(generateRandomIncident(i));
  }
  return arr;
}

// API: returns new random incidents every time
app.get("/api/incidents", (req, res) => {
  const count = Number(req.query.count) || 20;
  const incidents = generateIncidentBatch(count);
  res.json(incidents);
});

app.get("/", (req, res) => {
  res.send("DisasterSense backend running");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
