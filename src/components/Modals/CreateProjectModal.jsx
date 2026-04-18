import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Network, Plus, Trash2, X, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProjects, createProject } from '../../services/api';
import { useProject } from '../../context/ProjectContext';

export default function CreateProjectModal({ onClose }) {
  const { refreshProjects, switchProject } = useProject();
  
  const [name, setName] = useState('');
  const [scope, setScope] = useState('District');
  const [supplySchema, setSupplySchema] = useState([
    { type: 'Food Kits', unit: 'kits' },
    { type: 'Medical Aid', unit: 'boxes' }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const addSupplyItem = () => {
    setSupplySchema([...supplySchema, { type: '', unit: 'units' }]);
  };

  const updateSupplyItem = (index, field, value) => {
    const updated = [...supplySchema];
    updated[index][field] = value;
    setSupplySchema(updated);
  };

  const removeSupplyItem = (index) => {
    if (supplySchema.length === 1) return;
    setSupplySchema(supplySchema.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || supplySchema.some(s => !s.type)) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newProj = await createProject({ name, scope, supplySchema });
      await refreshProjects();
      switchProject(newProj._id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project environment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
      
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
        style={{
          position: 'relative', background: 'var(--bg-pane)', width: '100%', maxWidth: '600px',
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <Network size={20} color="var(--primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 500 }}>New Project Environment</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', margin: 0 }}>Create an isolated operational context.</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '2rem', overflowY: 'auto', flex: 1 }} className="no-scrollbar">
          {error && (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: 'var(--error)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <AlertOctagon size={16} /> {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Campaign Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Operation Mumbai Flood Relief"
                className="input-field" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Geographic Scope Limitation</label>
              <select value={scope} onChange={e => setScope(e.target.value)}
                className="input-field" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
              >
                <option value="Global" style={{ background: '#0a0a0a', color: '#fff' }}>Global (All Regions)</option>
                <option value="State" style={{ background: '#0a0a0a', color: '#fff' }}>State Level</option>
                <option value="District" style={{ background: '#0a0a0a', color: '#fff' }}>District Level</option>
                <option value="City" style={{ background: '#0a0a0a', color: '#fff' }}>City Scope</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Custom Supply Schema</label>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>Define exactly what supply assets are managed within this project.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {supplySchema.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" placeholder="Resource Name (e.g. Oxygen Cylinders)" value={item.type} onChange={e => updateSupplyItem(idx, 'type', e.target.value)}
                      style={{ flex: 2, padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                    />
                    <input type="text" placeholder="Unit (e.g. kg/boxes)" value={item.unit} onChange={e => updateSupplyItem(idx, 'unit', e.target.value)}
                       style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
                    />
                    <button type="button" onClick={() => removeSupplyItem(idx)} disabled={supplySchema.length === 1}
                      style={{ padding: '0.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', color: supplySchema.length === 1 ? 'var(--text-dim)' : 'var(--error)', cursor: supplySchema.length === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addSupplyItem}
                style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8125rem', width: '100%', justifyContent: 'center' }}
              >
                <Plus size={14} /> Add Supply Asset Type
              </button>
            </div>
          </div>
        </div>
        
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={isSubmitting} className="btn-primary" style={{ padding: '0.75rem 2rem', opacity: isSubmitting ? 0.7 : 1 }}>
            {isSubmitting ? 'Provisioning...' : 'Initialize Environment'}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
