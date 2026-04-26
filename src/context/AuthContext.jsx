import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, auth } from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppUser = async (user, overrideToken = null) => {
    try {
      const token = overrideToken || (user ? await user.getIdToken() : localStorage.getItem('test-token'));
      if (!token) return;

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAppUser(data);
      } else if (res.status === 404) {
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
    const testToken = localStorage.getItem('test-token');
    
    if (!auth) {
      if (testToken) {
        fetchAppUser(null, testToken);
      } else {
        setLoading(false);
      }
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        fetchAppUser(user);
      } else if (testToken) {
        fetchAppUser(null, testToken);
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginLocal = (token, user) => {
    localStorage.setItem('test-token', token);
    setAppUser(user);
    setFirebaseUser({ email: user.email, displayName: user.displayName, isLocal: true, getIdToken: () => Promise.resolve(token) });
  };

  const refreshUser = () => {
    if (firebaseUser) return fetchAppUser(firebaseUser);
    const testToken = localStorage.getItem('test-token');
    if (testToken) return fetchAppUser(null, testToken);
  };

  const getAuthHeader = async () => {
    if (firebaseUser?.getIdToken) {
      const token = await firebaseUser.getIdToken();
      return { 'Authorization': `Bearer ${token}` };
    }
    const testToken = localStorage.getItem('test-token');
    if (testToken) return { 'Authorization': `Bearer ${testToken}` };
    return {};
  };

  return (
    <AuthContext.Provider value={{ 
      firebaseUser, 
      appUser, 
      loading, 
      error, 
      refreshUser,
      getAuthHeader,
      loginLocal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
