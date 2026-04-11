/**
 * ImpactLink DBSCAN Implementation
 * 
 * Logic to identify clusters of incidents without predefining the number of clusters.
 * Marks low-density incidents as noise/outliers.
 */

const getDistance = (p1, p2) => {
  return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2));
};

const getNeighbors = (points, pointIdx, eps) => {
  const neighbors = [];
  for (let i = 0; i < points.length; i++) {
    if (getDistance(points[pointIdx], points[i]) <= eps) {
      neighbors.push(i);
    }
  }
  return neighbors;
};

/**
 * @param {Array} points - Array of {lat, lng, ...} objects
 * @param {Number} eps - Maximum distance between two points for them to be considered as in the same neighborhood.
 * @param {Number} minSamples - The number of samples in a neighborhood for a point to be considered as a core point.
 */
const dbscan = (points, eps, minSamples) => {
  const n = points.length;
  const labels = new Array(n).fill(null); // null = unvisited, -1 = noise, 0+ = cluster ID
  let clusterId = 0;

  for (let i = 0; i < n; i++) {
    if (labels[i] !== null) continue;

    const neighbors = getNeighbors(points, i, eps);

    if (neighbors.length < minSamples) {
      labels[i] = -1; // Mark as noise initially
      continue;
    }

    labels[i] = clusterId;
    let seeds = neighbors.filter(idx => idx !== i);

    for (let j = 0; j < seeds.length; j++) {
      const currentIdx = seeds[j];
      if (labels[currentIdx] === -1) {
        labels[currentIdx] = clusterId;
      }
      if (labels[currentIdx] !== null) continue;

      labels[currentIdx] = clusterId;
      const currentNeighbors = getNeighbors(points, currentIdx, eps);
      if (currentNeighbors.length >= minSamples) {
        seeds = seeds.concat(currentNeighbors.filter(idx => !seeds.includes(idx)));
      }
    }
    clusterId++;
  }
  return labels;
};

module.exports = { dbscan };
