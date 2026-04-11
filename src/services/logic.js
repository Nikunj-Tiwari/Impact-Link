/**
 * ImpactLink Priority Scoring Engine (Deterministic Layer)
 * 
 * Formula:
 * Priority Score = (Severity × 0.4) + (Frequency × 0.2) + (Gap × 0.3) + (Time × 0.1)
 * 
 * Inputs are 1-10 scales. Output is 1-10.
 */

export const calculatePriorityScore = (data) => {
  const { 
    severity = 5, 
    frequency = 5, 
    resourceGap = 5, 
    timeSensitivity = 5 
  } = data;

  const score = (
    (severity * 0.4) + 
    (frequency * 0.2) + 
    (resourceGap * 0.3) + 
    (timeSensitivity * 0.1)
  );

  return parseFloat(score.toFixed(2));
};

export const calculateMisallocationScore = (incident) => {
  const { severity = 5, resourceGap = 5 } = incident;
  // High divergence between severity (need) and gap (misallocation depth)
  // Higher score = More critical misallocation hotspot
  const score = (severity * 0.6) + (resourceGap * 0.4);
  return parseFloat(score.toFixed(2));
};

export const getSectorHealthStatus = (incidents, sectorId) => {
  const sectorIncidents = incidents.filter(inc => inc.location === sectorId);
  if (sectorIncidents.length === 0) return { label: 'STABLE', color: 'var(--success)', pulse: 0 };
  
  const avgSeverity = sectorIncidents.reduce((s, i) => s + i.severity, 0) / sectorIncidents.length;
  const avgGap = sectorIncidents.reduce((s, i) => s + i.resourceGap, 0) / sectorIncidents.length;
  const health = 10 - ((avgSeverity * 0.5) + (avgGap * 0.5));
  
  if (health < 3) return { label: 'CRITICAL', color: 'var(--error)', pulse: 1.2 };
  if (health < 6) return { label: 'UNSTABLE', color: 'var(--warning)', pulse: 0.8 };
  return { label: 'NOMINAL', color: 'var(--success)', pulse: 0.4 };
};

export const getPriorityLevel = (score) => {
  if (score >= 8.5) return { label: 'CRITICAL', color: '#ef4444' };
  if (score >= 7.0) return { label: 'HIGH', color: '#f59e0b' };
  if (score >= 5.0) return { label: 'MEDIUM', color: '#38bdf8' };
  return { label: 'LOW', color: '#10b981' };
};
