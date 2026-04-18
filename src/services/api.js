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

// ─── Projects ───────────────────────────────────────────────
export const fetchProjects = async () => {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
  return res.json();
};

export const createProject = async (data) => {
  const res = await fetch(`${API_BASE_URL}/api/projects`, {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to create project: ${res.status}`);
  return res.json();
};

export const updateProject = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to update project: ${res.status}`);
  return res.json();
};

export const deleteProject = async (id) => {
  const res = await fetch(`${API_BASE_URL}/api/projects/${id}`, {
    method: 'DELETE',
    headers: await getAuthHeaders()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Failed to delete project: ${res.status}`);
  }
  return res.json();
};

// ─── Incidents ────────────────────────────────────────────
export const fetchIncidents = async (projectId = null) => {
  const url = projectId ? `${API_BASE_URL}/api/incidents?projectId=${projectId}` : `${API_BASE_URL}/api/incidents`;
  const res = await fetch(url);
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
export const fetchVolunteers = async (projectId = null) => {
  const url = projectId ? `${API_BASE_URL}/api/volunteers?projectId=${projectId}` : `${API_BASE_URL}/api/volunteers`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch volunteers: ${res.status}`);
  return res.json();
};

// ─── Clusters / Analytics ─────────────────────────────────
export const fetchClusters = async (projectId = null) => {
  const url = projectId ? `${API_BASE_URL}/api/analytics/clusters?projectId=${projectId}` : `${API_BASE_URL}/api/analytics/clusters`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch clusters: ${res.status}`);
  return res.json();
};

// ─── Resource Hub (Logistics) ─────────────────────────────
export const fetchResourceHub = async (projectId = null) => {
  const url = projectId ? `${API_BASE_URL}/api/resource-hub?projectId=${projectId}` : `${API_BASE_URL}/api/resource-hub`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch resources: ${res.status}`);
  return res.json();
};

export const updateResource = async (id, data) => {
  const res = await fetch(`${API_BASE_URL}/api/resource-hub/${id}`, {
    method: 'PATCH',
    headers: await getAuthHeaders(),
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`Failed to update resource: ${res.status}`);
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
