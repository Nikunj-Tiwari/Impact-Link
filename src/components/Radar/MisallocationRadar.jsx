import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';

export default function MisallocationRadar({ incidents }) {
  const misallocationData = incidents.map(inc => ({
    ...inc,
    score: (inc.severity * 0.6) + (inc.resourceGap * 0.4)
  })).sort((a,b) => b.score - a.score).slice(0, 5);

  return (
    <div className="pane" style={{ padding: '2rem', flex: 1, minHeight: '350px', background: 'var(--bg-pane)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Crosshair size={16} /> Misallocation Divergence Map
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Need vs supply gap</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {misallocationData.map(inc => (
          <div key={inc.id} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8125rem', color: '#fff' }}>{inc.title}</span>
              <span style={{ fontSize: '0.8125rem', color: 'var(--error)', fontWeight: 600 }}>Score: {inc.score.toFixed(1)}</span>
            </div>
            
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', position: 'relative' }}>
              {/* Need Severity (Bottom Layer) */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${inc.severity * 10}%` }}
                style={{ height: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'absolute', top: 0, left: 0 }}
              />
              {/* Resource Gap (Top Layer Overlap) */}
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${inc.resourceGap * 10}%` }}
                style={{ height: '100%', background: 'var(--error)', borderRadius: '2px', position: 'absolute', top: 0, left: 0, boxShadow: '0 0 10px var(--error)' }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <div style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} /> Sector Need Severity
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            <div style={{ width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%' }} /> Resource Allocation Gap
          </div>
      </div>
    </div>
  );
}
