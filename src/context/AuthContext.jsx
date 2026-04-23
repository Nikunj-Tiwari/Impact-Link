import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, auth } from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppUser = async (user) => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAppUser(data);
      } else if (res.status === 404) {
        // User exists in Firebase but not in our DB
        setAppUser(null);
      } else {
        throw new Error('Failed to fetch user context');
      }
    } catch (err) {
      console.error('Auth Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        fetchAppUser(user);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshUser = () => {
    if (firebaseUser) return fetchAppUser(firebaseUser);
  };

  const getAuthHeader = async () => {
    if (!firebaseUser) return {};
    const token = await firebaseUser.getIdToken();
    return { 'Authorization': `Bearer ${token}` };
  };

  return (
    <AuthContext.Provider value={{ 
      firebaseUser, 
      appUser, 
      loading, 
      error, 
      refreshUser,
      getAuthHeader
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
