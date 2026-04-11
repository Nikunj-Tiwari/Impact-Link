import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, auth } from '../../services/firebase';
import { motion } from 'framer-motion';

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: If Firebase is not initialized (auth is undefined),
    // allow access for local testing rather than crashing
    if (!auth) {
      console.warn('Firebase auth not initialized — allowing access for local testing.');
      setUser({ uid: 'LOCAL_GUEST', email: 'guest@local' });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
           <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 20px #fff' }} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
