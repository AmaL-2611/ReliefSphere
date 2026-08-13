const axios = require("axios");

// Converts a text address into { latitude, longitude } using OpenStreetMap Nominatim
async function geocodeAddress(address) {
  try {
    const response = await axios.get(
      "https://nominatim.openstreetmap.org/search",
      {
        params: { q: address, format: "json", limit: 1 },
        headers: { "User-Agent": "ReliefSphereAI/1.0" },
      },
    );

    if (response.data && response.data.length > 0) {
      return {
        latitude: parseFloat(response.data[0].lat),
        longitude: parseFloat(response.data[0].lon),
      };
    }
    return { latitude: null, longitude: null };
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return { latitude: null, longitude: null };
  }
}

module.exports = geocodeAddress;
