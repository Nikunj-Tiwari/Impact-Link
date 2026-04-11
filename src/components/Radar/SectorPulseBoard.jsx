import React from 'react';
import { motion } from 'framer-motion';
import { getSectorHealthStatus } from '../../services/logic';
import { Activity, Shield } from 'lucide-react';

export default function SectorPulseBoard({ incidents }) {
  const sectors = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6', 'Sector 7', 'Sector 8'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
      {sectors.map(sector => {
        const status = getSectorHealthStatus(incidents, sector);
        return (
          <div key={sector} className="pane" style={{ padding: '1rem', border: '1px solid var(--border-subtle)', background: 'var(--bg-pane)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>{sector}</span>
              <Shield size={12} color={status.color} />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <motion.div 
                animate={{ 
                  scale: status.pulse ? [1, 1.2, 1] : 1,
                  opacity: status.pulse ? [0.4, 1, 0.4] : 0.4
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.color }}
              />
              <span style={{ fontSize: '0.875rem', color: '#fff', fontWeight: 500 }}>{status.label}</span>
            </div>

            <div style={{ marginTop: '1rem', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px' }}>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: status.label === 'NOMINAL' ? '100%' : status.label === 'STABLE' ? '80%' : status.label === 'UNSTABLE' ? '50%' : '20%' }}
                style={{ height: '100%', background: status.color, borderRadius: '1px' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
