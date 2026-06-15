import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signUp, logIn, resetPassword } from '../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Loader2, ArrowRight, Globe } from 'lucide-react';
import useAuth from '../hooks/useAuth';

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { loginLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/setup";

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Try Test Login First (for 123456 password testing)
      if (isLogin && password === '123456') {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/volunteer/test-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          if (res.ok) {
            const data = await res.json();
            loginLocal(data.token, data.user);
            navigate(data.user.role === 'Administrator' ? '/dashboard' : '/volunteer', { replace: true });
            return;
          }
        } catch (testErr) {
          console.warn('Test login failed, falling back to Firebase:', testErr);
        }
      }

      // 2. Fallback to Firebase
      if (isLogin) {
        await logIn(email, password);
      } else {
        await signUp(email, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#050505', padding: '1rem', overflow: 'hidden', position: 'relative'
    }}>
      {/* Dynamic Background */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
        background: `radial-gradient(circle, ${isLogin ? 'rgba(99, 102, 241, 0.15)' : 'rgba(16, 185, 129, 0.15)'}, transparent 70%)`,
        filter: 'blur(80px)', pointerEvents: 'none', transition: 'background 0.5s ease'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%',
        background: `radial-gradient(circle, ${isLogin ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)'}, transparent 70%)`,
        filter: 'blur(80px)', pointerEvents: 'none', transition: 'background 0.5s ease'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%', maxWidth: '440px', background: '#111',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px',
          padding: '3rem', position: 'relative', zIndex: 1,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ 
            width: '48px', height: '48px', background: isLogin ? 'var(--primary)' : '#10B981',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 1.5rem',
            boxShadow: `0 0 20px ${isLogin ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            transition: 'all 0.3s ease'
          }}>
            <Lock color="#fff" size={24} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem 0' }}>
            {isLogin ? 'Mission Access' : 'Create Identity'}
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
            {isLogin ? 'Authenticate to enter command console' : 'Join the tactical response network'}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '1.15rem', color: 'var(--text-dim)' }} />
            <input 
              type="email"
              placeholder="Email address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#000',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                color: '#fff', fontSize: '0.95rem'
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '1.15rem', color: 'var(--text-dim)' }} />
            <input 
              type="password"
              placeholder="Security password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%', padding: '1rem 1rem 1rem 3rem', background: '#000',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
                color: '#fff', fontSize: '0.95rem'
              }}
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '1rem', background: isLogin ? 'var(--primary)' : '#10B981',
              color: '#fff', borderRadius: '12px', border: 'none',
              fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.75rem', marginTop: '0.5rem',
              boxShadow: `0 10px 20px ${isLogin ? 'rgba(99, 102, 241, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? 'Grant Access' : 'Create Strategy'} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', textAlign: 'center', display: 'flex', 
          flexDirection: 'column', gap: '1rem' 
        }}>
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '0.85rem', cursor: 'pointer' }}
          >
            {isLogin ? "Don't have an identity yet? Create one" : "Already have an account? Sign in"}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.1)' }}>
            <div style={{ flex: 1, height: '1px', background: 'currentColor' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'currentColor' }} />
          </div>

          <button style={{
            width: '100%', padding: '0.85rem', background: '#fff', color: '#000',
            borderRadius: '12px', border: 'none', fontWeight: 600, fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            cursor: 'pointer'
          }}>
            <Globe size={18} /> Continue with Network Identity
          </button>
        </div>
      </motion.div>
    </div>
  );
}
