import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, AlertTriangle } from 'lucide-react';
import { calculateMisallocationScore } from '../../services/logic';

export default function MisallocationRadar({ incidents }) {
  const misallocationData = incidents.map(inc => ({
    ...inc,
    score: calculateMisallocationScore(inc)
  })).sort((a,b) => b.score - a.score).slice(0, 5);

  return (
    <div className="pane" style={{ padding: '2.5rem', flex: 1, minHeight: '350px', background: 'var(--bg-pane)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.02em' }}>
          <Crosshair size={18} color="var(--error)" /> Misallocation Divergence Map
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Need vs Supply Gap</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {misallocationData.length > 0 ? (
          misallocationData.map(inc => (
            <div key={inc.id || inc._id} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', alignItems: 'flex-end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                   <span style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 600 }}>{inc.title}</span>
                   <span style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{inc.location}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ fontSize: '0.875rem', color: 'var(--error)', fontWeight: 800, fontFamily: 'monospace' }}>{inc.score.toFixed(1)}</span>
                </div>
              </div>
              
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', position: 'relative' }}>
                {/* Need Severity (Bottom Layer) */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${inc.severity * 10}%` }}
                  style={{ height: '100%', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', position: 'absolute', top: 0, left: 0 }}
                />
                {/* Resource Gap (Top Layer Overlap) */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${inc.resourceGap * 10}%` }}
                  style={{ height: '100%', background: 'var(--error)', borderRadius: '3px', position: 'absolute', top: 0, left: 0, boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)' }}
                />
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
            <AlertTriangle size={24} style={{ marginBottom: '1rem', opacity: 0.2 }} />
            No divergence data available for current sector state.
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '2.5rem', display: 'flex', gap: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            <div style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }} /> Need Severity
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--error)', borderRadius: '2px' }} /> Resource Gap
          </div>
      </div>
    </div>
  );
}
