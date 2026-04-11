import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, MapPin, Fingerprint, Shield, Calendar } from 'lucide-react';
import { fetchLocations } from '../../services/api';

export default function BeneficiaryModal({ isOpen, onClose, onAdd, initialData = null, mode = 'REGISTER' }) {
  const isView = mode === 'VIEW';
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'M',
    contactPhone: '',
    aadharMasked: '',
    locationId: ''
  });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (isView && initialData) {
        setFormData({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          age: initialData.age || '',
          gender: initialData.gender || 'M',
          contactPhone: initialData.contactPhone || 'Encrypted at Rest',
          aadharMasked: initialData.aadharMasked || '',
          locationId: initialData.locationId?._id || initialData.locationId || ''
        });
      } else if (mode === 'REGISTER') {
        setFormData({ firstName: '', lastName: '', age: '', gender: 'M', contactPhone: '', aadharMasked: '', locationId: '' });
      }

      fetchLocations()
        .then(data => setLocations(data))
        .catch(err => console.error("Failed to fetch locations:", err));
    }
  }, [isOpen, isView, initialData, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isView) return;
    
    onAdd({
      ...formData,
      age: parseInt(formData.age),
    });
    setFormData({ firstName: '', lastName: '', age: '', gender: 'M', contactPhone: '', aadharMasked: '', locationId: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px', border: isView ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: isView ? 'rgba(0, 191, 255, 0.1)' : 'var(--bg-pane)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              border: isView ? '1px solid var(--accent-primary)' : '1px solid var(--border-strong)' 
            }}>
              {isView ? <Shield size={16} color="var(--accent-primary)" /> : <User size={16} color="#fff" />}
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                {isView ? 'Beneficiary Profile' : 'Register Beneficiary'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                {isView ? `Secure Identity Record: ${initialData?._id}` : 'Add a new record to the normalized directory.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>First Name</label>
              <input 
                type="text" 
                required 
                disabled={isView}
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                placeholder="Ravi"
                style={{ opacity: isView ? 0.8 : 1 }}
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input 
                type="text" 
                required 
                disabled={isView}
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                placeholder="Kumar"
                style={{ opacity: isView ? 0.8 : 1 }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Age</label>
              <input 
                type="number" 
                required 
                disabled={isView}
                value={formData.age}
                onChange={e => setFormData({...formData, age: e.target.value})}
                placeholder="34"
                style={{ opacity: isView ? 0.8 : 1 }}
              />
            </div>
            <div className="input-group">
              <label>Gender</label>
              <select 
                disabled={isView}
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
                style={{ opacity: isView ? 0.8 : 1 }}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label><Phone size={12} style={{marginRight: '4px'}}/> Contact Phone (PII Encrypted)</label>
            <input 
              type="text" 
              disabled={isView}
              value={formData.contactPhone}
              onChange={e => setFormData({...formData, contactPhone: e.target.value})}
              placeholder="9876543210"
              style={{ opacity: isView ? 0.8 : 1 }}
            />
          </div>

          <div className="input-group">
            <label><Fingerprint size={12} style={{marginRight: '4px'}}/> Aadhaar (Masked ID)</label>
            <input 
              type="text" 
              maxLength="4"
              required 
              disabled={isView}
              value={formData.aadharMasked}
              onChange={e => setFormData({...formData, aadharMasked: e.target.value})}
              placeholder="1234"
              style={{ opacity: isView ? 0.8 : 1, fontFamily: 'monospace' }}
            />
          </div>

          <div className="input-group">
            <label><MapPin size={12} style={{marginRight: '4px'}}/> Primary Location</label>
            <select 
              required
              disabled={isView}
              value={formData.locationId}
              onChange={e => setFormData({...formData, locationId: e.target.value})}
              style={{ opacity: isView ? 0.8 : 1 }}
            >
              <option value="">Select a Ward/Sector</option>
              {locations.map(loc => (
                <option key={loc._id} value={loc._id}>{loc.name} ({loc.type})</option>
              ))}
              {isView && initialData?.locationId?.name && !locations.find(l => l._id === formData.locationId) && (
                <option value={formData.locationId}>{initialData.locationId.name}</option>
              )}
            </select>
          </div>

          {isView && initialData?.registeredAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={14} color="var(--text-dim)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Registered on {new Date(initialData.registeredAt).toLocaleString()}
              </span>
            </div>
          )}

          <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem' }}>
            {isView ? (
              <button type="button" onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>Close Profile</button>
            ) : (
              <>
                <button type="button" onClick={onClose} className="btn" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Record</button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
