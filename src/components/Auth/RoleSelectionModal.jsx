import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Users, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export default function RoleSelectionModal() {
  const { firebaseUser, refreshUser, getAuthHeader } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [volunteerCode, setVolunteerCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/users/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          role: selectedRole,
          volunteerCode: selectedRole === 'Volunteer' ? volunteerCode : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Identity configuration failed');

      await refreshUser();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
    }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%', maxWidth: '800px',
          background: '#111', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px', padding: '3rem', position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 0 1rem 0', letterSpacing: '-0.02em' }}>
            Choose Your <span style={{ color: 'var(--primary)' }}>Impact Pathway</span>
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>
            Select your role in the mission environment. This cannot be changed later.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          {/* Volunteer Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedRole('Volunteer')}
            style={{
              padding: '2.5rem', borderRadius: '20px', cursor: 'pointer',
              border: '2px solid',
              borderColor: selectedRole === 'Volunteer' ? 'var(--v-amber, #F59E0B)' : 'rgba(255,255,255,0.05)',
              background: selectedRole === 'Volunteer' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
            }}>
              <Users color={selectedRole === 'Volunteer' ? '#F59E0B' : 'var(--text-dim)'} size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Volunteer Portal</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Execute field missions, track your impact, and manage your operational availability.
            </p>
          </motion.div>

          {/* Admin Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedRole('Administrator')}
            style={{
              padding: '2.5rem', borderRadius: '20px', cursor: 'pointer',
              border: '2px solid',
              borderColor: selectedRole === 'Administrator' ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
              background: selectedRole === 'Administrator' ? 'rgba(99, 102, 241, 0.05)' : 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px',
              background: 'rgba(99, 102, 241, 0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
            }}>
              <Shield color={selectedRole === 'Administrator' ? 'var(--primary)' : 'var(--text-dim)'} size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>Command Center</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
              Manage missions, orchestrate resources, and oversee strategic tactical operations.
            </p>
          </motion.div>
        </div>

        <AnimatePresence>
          {selectedRole === 'Volunteer' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden', marginBottom: '2rem' }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  Volunteer Enrollment Code (Optional)
                </label>
                <input 
                  type="text"
                  placeholder="HX72KP"
                  value={volunteerCode}
                  onChange={(e) => setVolunteerCode(e.target.value.toUpperCase())}
                  style={{
                    width: '100%', background: '#000', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '1rem', borderRadius: '8px', color: '#fff', fontSize: '1rem',
                    letterSpacing: '0.1em'
                  }}
                />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>
                  If an administrator issued you a code, enter it here to link your existing tactical profile.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div style={{ 
            padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px',
            color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.75rem',
            marginBottom: '2rem', fontSize: '0.9rem'
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedRole || isSubmitting}
          style={{
            width: '100%', padding: '1.25rem', borderRadius: '100px',
            background: selectedRole === 'Volunteer' ? '#F59E0B' : (selectedRole === 'Administrator' ? 'var(--primary)' : 'rgba(255,255,255,0.05)'),
            color: selectedRole ? '#fff' : 'rgba(255,255,255,0.2)',
            fontSize: '1.1rem', fontWeight: 700, border: 'none', cursor: selectedRole ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isSubmitting ? 0.7 : 1
          }}
        >
          {isSubmitting ? 'Configuring Strategy...' : (
            <>
              Confirm Identity <ArrowRight size={20} />
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
