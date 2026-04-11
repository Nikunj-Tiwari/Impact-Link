/**
 * ImpactLink API Service Layer
 * 
 * Centralizes all backend API calls. Every component should import from
 * this module instead of calling fetch() directly.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

import { auth } from './firebase';

/**
 * Get authorization headers using Firebase token
 */
const getAuthHeaders = async () => {
  try {
    const token = await auth?.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  } catch {
    return { 'Content-Type': 'application/json' };
  }
};

// ─── Incidents ────────────────────────────────────────────
export const fetchIncidents = async () => {
  const res = await fetch(`${API_BASE_URL}/api/incidents`);
  if (!res.ok) throw new Error(`Failed to fetch incidents: ${res.status}`);
  return res.json();
};

export const createIncident = async (data) => {
  const res = await fetch(`${API_BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to create incident: ${res.status}`);
  }
  return res.json();
};

export const patchIncident = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/api/incidents/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to patch incident: ${res.status}`);
  return res.json();
};

// ─── Beneficiaries ────────────────────────────────────────
export const fetchBeneficiaries = async () => {
  const res = await fetch(`${API_BASE_URL}/api/beneficiaries`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch beneficiaries: ${res.status}`);
  return res.json();
};

export const createBeneficiary = async (data) => {
  const res = await fetch(`${API_BASE_URL}/api/beneficiaries`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to create beneficiary: ${res.status}`);
  return res.json();
};

// ─── Volunteers ───────────────────────────────────────────
export const fetchVolunteers = async () => {
  const res = await fetch(`${API_BASE_URL}/api/volunteers`);
  if (!res.ok) throw new Error(`Failed to fetch volunteers: ${res.status}`);
  return res.json();
};

// ─── Clusters / Analytics ─────────────────────────────────
export const fetchClusters = async () => {
  const res = await fetch(`${API_BASE_URL}/api/analytics/clusters`);
  if (!res.ok) throw new Error(`Failed to fetch clusters: ${res.status}`);
  return res.json();
};

// ─── Locations ────────────────────────────────────────────
export const fetchLocations = async () => {
  const res = await fetch(`${API_BASE_URL}/api/locations`);
  if (!res.ok) throw new Error(`Failed to fetch locations: ${res.status}`);
  return res.json();
};

// ─── Bulk Ingestion ───────────────────────────────────────
export const bulkIngest = async (data) => {
  const res = await fetch(`${API_BASE_URL}/api/ingestion/bulk`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Bulk ingestion failed: ${res.status}`);
  return res.json();
};
