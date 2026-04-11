import React, { useState } from 'react';
import Modal from '../Common/Modal';
import { smartParseIncident } from '../../services/gemini';
import { resolveCoordinates } from '../../services/coordinates';
import { Sparkles, Save } from 'lucide-react';

export default function NewIncidentModal({ isOpen, onClose, onAdd }) {
  const [formData, setFormData] = useState({
    location: '',
    needType: 'Medical',
    severity: 5,
    frequency: 5,
    resourceGap: 5,
    timeSensitivity: 5
  });
  const [aiText, setAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiFill = async () => {
    if (!aiText) return;
    setIsAiLoading(true);
    try {
      const parsed = await smartParseIncident(aiText);
      if (parsed) {
        setFormData({
          ...formData,
          location: parsed.location || formData.location,
          needType: parsed.needType || formData.needType,
          severity: parsed.severity || formData.severity,
          resourceGap: parsed.resourceGap || formData.resourceGap,
          frequency: parsed.frequency || 5,
          timeSensitivity: parsed.timeSensitivity || 5
        });
      }
    } catch (error) {
      alert("AI Scan failed. Please check your text snippet and try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Resolve real coordinates from location name instead of random
    const coords = resolveCoordinates(formData.location);
    onAdd({
      ...formData,
      id: Date.now(),
      title: `${formData.needType} - ${formData.location}`,
      eventType: formData.needType,
      type: formData.severity > 8 ? 'Critical' : 'Alert',
      lat: coords.lat,
      lng: coords.lng
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Strategic Incident">
      <div style={{ marginBottom: '2rem', padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
           <Sparkles size={14} color="#38bdf8" /> SMART-FILL ASSISTANT
        </div>
        <textarea 
          placeholder="e.g. 'Sector 4 is reporting high water scarcity and aid is completely missing...'"
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.75rem', color: '#fff', fontSize: '0.875rem', marginBottom: '1rem', resize: 'vertical', fontFamily: 'inherit' }}
        />
        <button 
          onClick={handleAiFill} 
          className="btn" 
          disabled={isAiLoading || !aiText}
          style={{ width: '100%', justifyContent: 'center', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)' }}
        >
          {isAiLoading ? 'Analyzing Text...' : 'Auto-Populate Form'}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ gridColumn: 'span 2' }}>
           <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>LOCATION / SECTOR</label>
           <input 
             required
             value={formData.location} 
             onChange={(e) => setFormData({...formData, location: e.target.value})}
             placeholder="e.g. Mumbai, Delhi NCR, Sector 4, Wayanad..."
             className="input" style={{ width: '100%', background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.5rem', color: '#fff' }} 
           />
        </div>

        <div>
           <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>NEED TYPE</label>
           <select 
             className="input" 
             value={formData.needType}
             onChange={(e) => setFormData({...formData, needType: e.target.value})}
             style={{ width: '100%', background: 'var(--bg-pane)', border: '1px solid var(--border-subtle)', borderRadius: '4px', padding: '0.5rem', color: '#fff' }}
           >
              {['Medical', 'Food', 'Water', 'Infrastructure', 'Shelter'].map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>

        {['severity', 'resourceGap', 'frequency', 'timeSensitivity'].map(field => (
           <div key={field}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                {field.replace(/([A-Z])/g, ' $1')} <span style={{ float: 'right', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{formData[field]}</span>
              </label>
              <input 
                type="range" min="1" max="10" 
                value={formData[field]}
                onChange={(e) => setFormData({...formData, [field]: parseInt(e.target.value)})}
                style={{ width: '100%' }}
              />
           </div>
        ))}

        <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2', marginTop: '1rem', justifyContent: 'center' }}>
          <Save size={16} /> Deploy Report
        </button>
      </form>
    </Modal>
  );
}
