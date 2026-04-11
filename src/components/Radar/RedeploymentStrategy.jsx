import React from 'react';
import { motion } from 'framer-motion';
import { MoveRight, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';
import { getSectorHealthStatus } from '../../services/logic';

export default function RedeploymentStrategy({ incidents }) {
  const sectors = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6', 'Sector 7', 'Sector 8'];
  
  const sectorStatus = sectors.map(s => ({
    name: s,
    ...getSectorHealthStatus(incidents, s)
  }));

  const targets = sectorStatus.filter(s => s.label === 'CRITICAL' || s.label === 'UNSTABLE');
  const sources = sectorStatus.filter(s => s.label === 'STABLE');

  // Simple heuristic: match top source to top target
  const shifts = targets.map((t, idx) => {
    const s = sources[idx % sources.length];
    return { target: t, source: s };
  });

  return (
    <div className="pane" style={{ padding: '2rem', flex: 1, minHeight: '350px', background: 'var(--bg-pane)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingDown size={16} color="var(--success)" /> Lateral Redeployment Strategy
        </h3>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Intelligence-led shifts</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {shifts.length > 0 ? (
          shifts.map((shift, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Source (Surplus)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={12} color="var(--success)" />
                  <span style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 500 }}>{shift.source.name}</span>
                </div>
              </div>

              <MoveRight size={16} color="var(--text-dim)" />

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Target (Deficit)</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={12} color="var(--error)" />
                  <span style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 500 }}>{shift.target.name}</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>PRIORITIZE</div>
                 <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)' }}>Reallocation</div>
              </div>
            </motion.div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
            System state balanced. No critical misallocations detected.
          </div>
        )}
      </div>

      {shifts.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '6px' }}>
           <p style={{ fontSize: '0.75rem', color: 'rgba(56, 189, 248, 0.8)', lineHeight: '1.5', margin: 0 }}>
             <span style={{ fontWeight: 700 }}>ORCHESTRATION NOTE:</span> AI suggests shifting idle volunteers from stable zones to critical hotspots to maximize resource density without increasing total costs.
           </p>
        </div>
      )}
    </div>
  );
}
