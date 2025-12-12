// backend/detection.js
const WINDOW_MS = 10000; // sliding window for social spike
const KEYWORD_ALERT_THRESHOLD = 5;

let keywordWindow = []; // {ts, text, coords}

function ingestEvent(event) {
  const ts = event.ts || Date.now();

  // SENSOR: temperature -> temperature or fire (Celsius thresholds)
  if (event.type === 'sensor' && event.payload?.temperature != null) {
    const t = event.payload.temperature;
    if (t >= 45) { // extreme heat -> possible fire
      return makeAlert('fire', 'critical', `Extreme temperature ${t}°C — possible fire`, event.payload.coords, ts);
    }
    if (t >= 38) { // high temp (health risk)
      return makeAlert('temperature', 'high', `High temperature ${t}°C`, event.payload.coords, ts);
    }
  }

  // SENSOR: water-level sensor
  if (event.type === 'water' && event.payload?.level != null) {
    const level = event.payload.level;
    const floodThreshold = 8; // arbitrary units
    if (level >= floodThreshold) {
      const sev = level >= floodThreshold + 3 ? 'critical' : 'high';
      return makeAlert('flood', sev, `Water level ${level} - flood risk`, event.payload.coords, ts);
    }
  }

  // SENSOR: earthquake (magnitude)
  if (event.type === 'earthquake' && event.payload?.magnitude != null) {
    const m = event.payload.magnitude;
    if (m >= 6.0) {
      return makeAlert('earthquake', 'critical', `Strong earthquake magnitude ${m.toFixed(1)}`, event.payload.coords, ts);
    }
    if (m >= 4.5) {
      return makeAlert('earthquake', 'high', `Earthquake magnitude ${m.toFixed(1)}`, event.payload.coords, ts);
    }
  }

  // SOCIAL: tweet text spikes
  if (event.type === 'tweet' && event.payload?.text) {
    const txt = event.payload.text.toLowerCase();
    keywordWindow.push({ ts, text: txt, coords: event.payload.coords });
    const cutoff = Date.now() - WINDOW_MS;
    keywordWindow = keywordWindow.filter(k => k.ts >= cutoff);

    const keywords = {
      earthquake: ['earthquake','quake','tremor'],
      flood: ['flood','water','river overflow','submerge'],
      fire: ['fire','smoke','burning'],
      collapse: ['collapsed','collapse','building down','trapped','help']
    };

    const counts = {};
    for (const k of keywordWindow) {
      for (const [type, kws] of Object.entries(keywords)) {
        for (const kw of kws) {
          if (k.text.includes(kw)) {
            counts[type] = (counts[type] || 0) + 1;
            break;
          }
        }
      }
    }

    let topType = null;
    let topCount = 0;
    for (const [t, c] of Object.entries(counts)) {
      if (c > topCount) { topCount = c; topType = t; }
    }

    if (topCount >= KEYWORD_ALERT_THRESHOLD) {
      const sampleCoord = getMostRecentCoordsForKeyword(topType) || event.payload.coords || randomNearbyCoords();
      keywordWindow = [];
      const labelMap = {
        earthquake: 'earthquake reports spike',
        flood: 'flood reports spike',
        fire: 'fire reports spike',
        collapse: 'building collapse reports spike'
      };
      const mapType = topType === 'collapse' ? 'report' : topType;
      return makeAlert(mapType, 'medium', labelMap[topType] || 'social spike', sampleCoord, ts);
    }
  }

  // direct user report / webhook
  if (event.type === 'report' && event.payload) {
    const sev = event.payload.severity === 'critical' ? 'critical' : 'high';
    const kind = event.payload.kind || 'report';
    return makeAlert(kind, sev, event.payload.message || 'User report', event.payload.coords, ts);
  }

  return null;
}

function makeAlert(type, severity, reason, coords, ts) {
  const labelMap = {
    fire: '🔥 Fire',
    flood: '🌊 Flood',
    earthquake: '🌎 Earthquake',
    temperature: '🌡️ High Temp',
    report: '📢 Report',
    social: '🔔 Social Spike'
  };
  return {
    type,
    level: severity,
    reason,
    label: labelMap[type] || (type.charAt(0).toUpperCase() + type.slice(1)),
    coords: coords || randomNearbyCoords(),
    ts
  };
}

function getMostRecentCoordsForKeyword(type) {
  for (let i = keywordWindow.length - 1; i >= 0; --i) {
    const k = keywordWindow[i];
    if (!k.text) continue;
    if ((type === 'earthquake' && k.text.includes('earthquake')) ||
        (type === 'flood' && k.text.includes('flood')) ||
        (type === 'fire' && (k.text.includes('fire') || k.text.includes('smoke'))) ||
        (type === 'collapse' && k.text.includes('collapsed'))) {
      return k.coords;
    }
  }
  return null;
}

function randomNearbyCoords() {
  const base = { lat: 28.7041, lng: 77.1025 };
  const rand = () => (Math.random() - 0.5) * 0.2;
  return { lat: base.lat + rand(), lng: base.lng + rand() };
}

module.exports = { ingestEvent };
