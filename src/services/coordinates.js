/**
 * ImpactLink Indian Location Coordinate Resolver
 * 
 * Maps known Indian location names/sectors to approximate coordinates.
 * Used when creating incidents from modals or AI parsing to avoid
 * generating random coordinates.
 */

const KNOWN_LOCATIONS = {
  // Major Cities
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'patna': { lat: 25.6093, lng: 85.1376 },
  'indore': { lat: 22.7196, lng: 75.8577 },

  // States / Regions
  'kerala': { lat: 10.8505, lng: 76.2711 },
  'assam': { lat: 26.2006, lng: 92.9376 },
  'gujarat': { lat: 22.2587, lng: 71.1924 },
  'rajasthan': { lat: 27.0238, lng: 74.2179 },
  'tamil nadu': { lat: 11.1271, lng: 78.6569 },
  'uttar pradesh': { lat: 26.8467, lng: 80.9462 },
  'madhya pradesh': { lat: 22.9734, lng: 78.6569 },
  'maharashtra': { lat: 19.7515, lng: 75.7139 },
  'karnataka': { lat: 15.3173, lng: 75.7139 },
  'west bengal': { lat: 22.9868, lng: 87.8550 },
  'odisha': { lat: 20.9517, lng: 85.0985 },
  'bihar': { lat: 25.0961, lng: 85.3131 },
  'andhra pradesh': { lat: 15.9129, lng: 79.7400 },
  'telangana': { lat: 18.1124, lng: 79.0193 },
  'punjab': { lat: 31.1471, lng: 75.3412 },
  'chhattisgarh': { lat: 21.2787, lng: 81.8661 },

  // Disaster-prone areas
  'wayanad': { lat: 11.6050, lng: 76.0828 },
  'bhuj': { lat: 23.2420, lng: 69.6669 },
  'jammu': { lat: 32.7330, lng: 74.8643 },
  'guwahati': { lat: 26.1445, lng: 91.7362 },
  'srinagar': { lat: 34.0837, lng: 74.7973 },
  'leh': { lat: 34.1526, lng: 77.5771 },
  'uttarakhand': { lat: 30.0668, lng: 79.0193 },
  'sikkim': { lat: 27.5330, lng: 88.5122 },

  // Sectors (generic mapping for "Sector X" style inputs)
  'sector 1': { lat: 19.0760, lng: 72.8777 },   // Mumbai area
  'sector 2': { lat: 28.6139, lng: 77.2090 },   // Delhi area
  'sector 3': { lat: 12.9716, lng: 77.5946 },   // Bangalore area
  'sector 4': { lat: 13.0827, lng: 80.2707 },   // Chennai area
  'sector 5': { lat: 22.5726, lng: 88.3639 },   // Kolkata area
  'sector 6': { lat: 17.3850, lng: 78.4867 },   // Hyderabad area
  'sector 7': { lat: 26.9124, lng: 75.7873 },   // Jaipur area
  'sector 8': { lat: 23.0225, lng: 72.5714 },   // Ahmedabad area

  // Delhi NCR subareas
  'delhi ncr': { lat: 28.6139, lng: 77.2090 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },

  // Mumbai subareas
  'mumbai slums': { lat: 19.0544, lng: 72.8406 },
  'dharavi': { lat: 19.0441, lng: 72.8553 },
  'andheri': { lat: 19.1197, lng: 72.8464 },

  // Bangalore subareas
  'bangalore east': { lat: 12.9900, lng: 77.6400 },
  'whitefield': { lat: 12.9698, lng: 77.7500 },
};

// India center as fallback
const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 };

/**
 * Resolves a location string to lat/lng coordinates.
 * Uses fuzzy matching against known locations.
 * 
 * @param {string} locationName - Location name or description
 * @returns {{ lat: number, lng: number }} Coordinates
 */
export function resolveCoordinates(locationName) {
  if (!locationName) return addJitter(INDIA_CENTER);

  const normalized = locationName.toLowerCase().trim();

  // 1. Direct exact match
  if (KNOWN_LOCATIONS[normalized]) {
    return addJitter(KNOWN_LOCATIONS[normalized]);
  }

  // 2. Partial match — check if any known key is contained in the input
  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return addJitter(coords);
    }
  }

  // 3. Word-level match — check if any word corresponds to a known location
  const words = normalized.split(/[\s,\-()]+/);
  for (const word of words) {
    if (word.length < 3) continue;
    for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
      if (key.includes(word) || word.includes(key.split(' ')[0])) {
        return addJitter(coords);
      }
    }
  }

  // 4. Fallback — center of India with jitter
  return addJitter(INDIA_CENTER);
}

/**
 * Adds small random offset to prevent overlapping markers at exact same location.
 * Offset is ~0.5-2km radius.
 */
function addJitter(coords) {
  const jitter = 0.015; // ~1.5km
  return {
    lat: coords.lat + (Math.random() - 0.5) * jitter,
    lng: coords.lng + (Math.random() - 0.5) * jitter
  };
}

export default resolveCoordinates;
