import React from 'react';
import { motion } from 'framer-motion';
import { getSectorHealthStatus, getTopActiveHubs } from '../../services/logic';
import { Shield } from 'lucide-react';

export default function SectorPulseBoard({ incidents, volunteers }) {
  const activeHubs = getTopActiveHubs(incidents);

  if (activeHubs.length === 0) {
    return (
      <div className="pane" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
        No active incident clusters detected. System is NOMINAL.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
      {activeHubs.map(hub => {
        const status = getSectorHealthStatus(incidents, hub.name, volunteers);
        return (
          <div key={hub.name} className="pane" style={{ padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-pane)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{hub.name}</span>
              <Shield size={14} color={status.color} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <motion.div 
                animate={{ 
                  scale: status.pulse ? [1, 1.25, 1] : 1,
                  opacity: status.pulse ? [0.4, 1, 0.4] : 0.4
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: '10px', height: '10px', borderRadius: '50%', background: status.color, boxShadow: `0 0 10px ${status.color}` }}
              />
              <span style={{ fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{status.label}</span>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                 <span>Stability Index</span>
                 <span>{status.percentage.toFixed(0)}%</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${status.percentage}%` }}
                  style={{ height: '100%', background: status.color, borderRadius: '2px' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
