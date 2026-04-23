import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * Route guard that validates user role and authentication status.
 * @param {string} role - The required role ('Volunteer' or 'Administrator')
 */
const RequireRole = ({ role, children }) => {
  const { firebaseUser, appUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0a', color: '#fff' 
      }}>
        <div className="spinner">Verifying Identity...</div>
      </div>
    );
  }

  // 1. Not logged into Firebase
  if (!firebaseUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 2. Logged in but no DB record yet (needs setup)
  if (!appUser || !appUser.role) {
    if (location.pathname === '/setup') return children;
    return <Navigate to="/setup" replace />;
  }

  // 3. Logged in but has wrong role
  if (role && appUser.role !== role) {
    // Redirect to their respective dashboards
    return <Navigate to={appUser.role === 'Administrator' ? '/dashboard' : '/volunteer'} replace />;
  }

  // 4. On setup page but identity already configured? Forward to dashboard.
  if (location.pathname === '/setup' && appUser.role) {
    return <Navigate to={appUser.role === 'Administrator' ? '/dashboard' : '/volunteer'} replace />;
  }

  return children;
};

export default RequireRole;
