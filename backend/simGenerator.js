// backend/simGenerator.js
// Improved simulator: multiple city centers, realistic Celsius temps, varied event distributions

const disasterWords = {
  earthquake: ['earthquake','quake','tremor'],
  flood: ['flood','water','river','submerge'],
  fire: ['fire','smoke','burning'],
  collapse: ['collapsed','trapped','help']
};

// A few city centers across India (lat,lng)
const CITY_BASES = [
  { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { name: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 }
];

function startSimulation(emitEvent) {
  // pick a base city every run (random)
  let baseCity = CITY_BASES[Math.floor(Math.random()*CITY_BASES.length)];

  // Occasionally switch base city to simulate distributed incidents
  setInterval(() => {
    if (Math.random() < 0.08) {
      baseCity = CITY_BASES[Math.floor(Math.random()*CITY_BASES.length)];
    }
  }, 15000);

  // temp sensor every 3s (realistic Celsius 20-45)
  setInterval(() => {
    const temp = +(20 + Math.random() * 25).toFixed(1); // 20.0 - 45.0 °C
    const event = {
      source: 'sensor',
      type: 'sensor',
      payload: { temperature: temp, coords: randomCoordsAround(baseCity) },
      ts: Date.now()
    };
    emitEvent(event);
  }, 3000);

  // water-level sensor every 4s (units arbitrary 0-12)
  setInterval(() => {
    const level = +(Math.random() * 12).toFixed(1);
    const event = {
      source: 'waterSensor',
      type: 'water',
      payload: { level, coords: randomCoordsAround(baseCity) },
      ts: Date.now()
    };
    emitEvent(event);
  }, 4000);

  // earthquake rare events every 5s
  setInterval(() => {
    if (Math.random() < 0.06) {
      // choose a magnitude more realistically (2.0 - 7.0)
      const mag = +(2 + Math.random() * 5).toFixed(1); // 2.0 - 7.0
      const event = {
        source: 'usgs-sim',
        type: 'earthquake',
        payload: { magnitude: mag, coords: randomCoordsAround(baseCity, 0.8) },
        ts: Date.now()
      };
      emitEvent(event);
    }
  }, 5000);

  // tweet-like events every 800ms, with occasional disaster keywords clustered near baseCity
  setInterval(() => {
    const roll = Math.random();
    let text, coords;
    if (roll < 0.07) {
      // high chance cluster disaster word near baseCity
      const types = Object.keys(disasterWords);
      const t = types[Math.floor(Math.random() * types.length)];
      text = `we need ${randomFrom(disasterWords[t])} at ${Math.random().toString(36).substring(7)} help`;
      coords = randomCoordsAround(baseCity, 0.5);
    } else {
      text = 'normal traffic update ' + Math.random().toString(36).substring(7);
      coords = randomCoordsAround(baseCity, 1.2);
    }

    const event = {
      source: 'social',
      type: 'tweet',
      payload: { text, coords },
      ts: Date.now()
    };
    emitEvent(event);
  }, 800);

  // occasional user report (webhook-like)
  setInterval(() => {
    if (Math.random() < 0.035) {
      const kinds = ['fire','flood','report','collapse'];
      const kind = randomFrom(kinds);
      const severity = Math.random() < 0.45 ? 'critical' : 'high';
      const event = {
        source: 'user',
        type: 'report',
        payload: { severity, kind, message: `${kind} reported`, coords: randomCoordsAround(baseCity, 0.3) },
        ts: Date.now()
      };
      emitEvent(event);
    }
  }, 2500);
}

// random coords around a city center
function randomCoordsAround(base, radiusKm = 10) {
  // radiusKm: how far from center (approx)
  const kmToDeg = 1 / 111; // ~1 degree lat ~ 111 km
  const radiusDeg = radiusKm * kmToDeg;
  const lat = base.lat + (Math.random() - 0.5) * radiusDeg * 2;
  const lng = base.lng + (Math.random() - 0.5) * radiusDeg * 2;
  return { lat: +lat.toFixed(6), lng: +lng.toFixed(6) };
}

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { startSimulation };
