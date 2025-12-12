// simulator/sendLocations.js
const axios = require('axios');

const BACKEND = process.env.BACKEND || 'http://localhost:5000';
const PHONE = process.env.PHONE || '9999999999';

let lat = 28.6139; // start (New Delhi), change if you want
let lng = 77.2090;

function randDelta() {
  return (Math.random() - 0.5) * 0.0012; // small movement
}

async function send() {
  lat += randDelta();
  lng += randDelta();

  try {
    await axios.post(`${BACKEND}/api/location`, {
      phone: PHONE,
      lat,
      lng,
      speed: Math.random() * 10
    });
    console.log('sent', { lat, lng });
  } catch (err) {
    console.error('err', err.message);
  }
}

setInterval(send, 2000); // every 2s
send();
