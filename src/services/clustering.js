/**
 * ImpactLink DBSCAN Implementation (Frontend Reactive Version)
 * 
 * Logic to identify clusters of incidents without predefining the number of clusters.
 */

const getDistance = (p1, p2) => {
  const lat1 = parseFloat(p1.lat || p1.latitude);
  const lng1 = parseFloat(p1.lng || p1.longitude);
  const lat2 = parseFloat(p2.lat || p2.latitude);
  const lng2 = parseFloat(p2.lng || p2.longitude);
  
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) return Infinity;
  
  // Simple Euclidean distance for clustering purposes
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
};

const getNeighbors = (points, pointIdx, eps) => {
  const neighbors = [];
  for (let i = 0; i < points.length; i++) {
    const dist = getDistance(points[pointIdx], points[i]);
    if (dist <= eps) {
      neighbors.push(i);
    }
  }
  return neighbors;
};

/**
 * DBSCAN Algorithm
 * @param {Array} points - Array of {lat, lng, ...} objects
 * @param {Number} eps - Maximum distance between two points (in degrees). 1.0 is ~111km.
 * @param {Number} minSamples - Minimum points to form a cluster
 */
export const dbscan = (points, eps = 1.0, minSamples = 3) => {
  const n = points.length;
  if (n === 0) return [];
  
  const labels = new Array(n).fill(null); // null = unvisited, -1 = noise, 0+ = cluster ID
  let clusterId = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== null) continue;

    const neighbors = getNeighbors(points, i, eps);

    // If fewer than minSamples neighbors, mark as noise
    if (neighbors.length < minSamples) {
      labels[i] = -1;
      continue;
    }

    labels[i] = clusterId;
    // Current neighbors (excluding self, though self is already in labels and won't be revisited)
    let seeds = neighbors.filter(idx => idx !== i);

    for (let j = 0; j < seeds.length; j++) {
      const currentIdx = seeds[j];
      
      // If previously marked noise, it's now a border point of this cluster
      if (labels[currentIdx] === -1) {
        labels[currentIdx] = clusterId;
      }
      
      // If already visited as a core/border point of another cluster (or this one), skip
      if (labels[currentIdx] !== null) continue;

      labels[currentIdx] = clusterId;
      
      // Expand cluster if this point is also a core point
      const currentNeighbors = getNeighbors(points, currentIdx, eps);
      if (currentNeighbors.length >= minSamples) {
        for (const neighborIdx of currentNeighbors) {
          if (!seeds.includes(neighborIdx)) {
            seeds.push(neighborIdx);
          }
        }
      }
    }
    clusterId++;
  }
  return labels;
};

/**
 * Aggregates points into strategic hotspots based on cluster labels
 */
export const aggregateClusters = (points, labels) => {
  if (points.length === 0) return { points: [], hotspots: [] };
  
  const result = points.map((p, i) => ({
    ...p,
    cluster: labels[i]
  }));

  const clustersMap = {};
  result.forEach(p => {
    // Only aggregate actual clusters, ignore noise (-1)
    if (p.cluster === null || p.cluster === -1) return;
    
    if (!clustersMap[p.cluster]) {
      clustersMap[p.cluster] = { cluster: p.cluster, lat: 0, lng: 0, severity: 0, count: 0, points: [], locations: {} };
    }
    
    const c = clustersMap[p.cluster];
    const lat = parseFloat(p.lat || p.latitude);
    const lng = parseFloat(p.lng || p.longitude);
    
    if (isNaN(lat) || isNaN(lng)) return;

    const locName = p.location || p.city || 'Unknown Zone';
    c.locations[locName] = (c.locations[locName] || 0) + 1;

    c.lat += lat;
    c.lng += lng;
    c.severity += (parseFloat(p.severity) || 5);
    c.count += 1;
    c.points.push(p.id || p._id);
  });

  const hotspots = Object.values(clustersMap).map(c => {
    const dominantLoc = Object.keys(c.locations).sort((a,b) => c.locations[b] - c.locations[a])[0];
    return {
      ...c,
      name: dominantLoc,
      lat: c.lat / c.count,
      lng: c.lng / c.count,
      avgSeverity: c.severity / c.count
    };
  });

  // Sort hotspots by impact (severity * count) and take top ones for cleaner UI
  const filteredHotspots = hotspots
    .sort((a, b) => (b.avgSeverity * b.count) - (a.avgSeverity * a.count))
    .slice(0, 8); // Display top 8 clusters max to prevent clutter

  return { points: result, hotspots: filteredHotspots };
};
