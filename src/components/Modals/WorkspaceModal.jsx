import React from 'react';
import Modal from '../Common/Modal';
import { Database, AlertTriangle, ShieldCheck, Trash2, Download } from 'lucide-react';

export default function WorkspaceModal({ isOpen, onClose, onReset, onScenario }) {
  const scenarios = [
    { id: 'flood', label: 'Flash Flood Shift', color: '#60a5fa' },
    { id: 'earthquake', label: 'Tectonic Fracture', color: '#f87171' },
    { id: 'conflict', label: 'Civilian Movement', color: '#fbbf24' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Strategic Workspace Control">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        
        {/* Scenarios Section */}
        <div>
           <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={14} color="var(--warning)" /> ACTIVE DRILL SCENARIOS
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {scenarios.map(sc => (
                <button 
                  key={sc.id} 
                  className="btn" 
                  onClick={() => { onScenario(sc.id); onClose(); }}
                  style={{ flexDirection: 'column', padding: '1.5rem 1rem', background: 'rgba(255,255,255,0.02)', border: `1px solid ${sc.color}20` }}
                >
                   <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.color, marginBottom: '0.5rem' }} />
                   <span style={{ fontSize: '0.8125rem' }}>{sc.label}</span>
                </button>
              ))}
           </div>
        </div>

        {/* Intelligence Hygiene */}
        <div>
           <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={14} color="var(--success)" /> ORCHESTRATION HYGIENE
           </div>
           <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={onReset}
                className="btn" 
                style={{ flex: 1, color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', padding: '1rem' }}
              >
                 <Trash2 size={16} /> Purge Ingested Records
              </button>
              <button 
                className="btn" 
                style={{ flex: 1, padding: '1rem' }}
              >
                 <Download size={16} /> Export Tactical Logs
              </button>
           </div>
        </div>

        {/* Global Protection Status */}
        <div style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '8px', textAlign: 'center' }}>
           <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <ShieldCheck size={24} color="#38bdf8" />
           </div>
           <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>System Integrity Enforced</h3>
           <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
             ImpactLink Command Center v1.4.2 operating at peak situational awareness. AI Resource Allocation Engine is currently active.
           </p>
        </div>

      </div>
    </Modal>
  );
}
