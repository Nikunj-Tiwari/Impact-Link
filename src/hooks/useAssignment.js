import { useState, useEffect, useCallback } from 'react';
import { getMyVolunteerProfile, updateAssignmentStatus } from '../services/volunteerApi';
import useAuth from './useAuth';

/**
 * Hook to manage the volunteer's active assignment lifecycle.
 * Polling interval defaults to 30 seconds as per the implementation plan.
 */
export default function useAssignment(pollingInterval = 30000) {
  const { firebaseUser, appUser, refreshUser } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!firebaseUser) return;
    
    try {
      const profile = await getMyVolunteerProfile();
      setAssignment({
        id: profile.currentAssignmentId,
        status: profile.assignmentStatus,
        details: profile.assignmentDetails,
        fullProfile: profile
      });
      setError(null);
    } catch (err) {
      console.error('Failed to poll assignment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [firebaseUser]);

  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(() => {
      // Only poll if they don't have an active status requiring manual input (like on_site)
      // or to check for new incoming assignments if unassigned.
      fetchStatus();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [fetchStatus, pollingInterval]);

  const updateStatus = async (newStatus) => {
    try {
      const result = await updateAssignmentStatus(newStatus);
      setAssignment(prev => ({
        ...prev,
        status: result.status
      }));
      // Trigger a session refresh to keep global appUser in sync
      await refreshUser();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  return {
    assignment,
    profile: assignment?.profile, // Helper access
    fullProfile: assignment?.fullProfile,
    loading,
    error,
    updateStatus,
    refreshAssignment: fetchStatus
  };
}
