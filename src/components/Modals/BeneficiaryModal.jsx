import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, MapPin, Fingerprint, Shield, Calendar, Target, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { fetchLocations } from '../../services/api';
import { resolveCoordinates } from '../../services/coordinates';

export default function BeneficiaryModal({ isOpen, onClose, onAdd, initialData = null, mode = 'REGISTER', currentProject }) {
  const isView = mode === 'VIEW';
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'male',
    contactPhone: '',
    aadharMasked: '',
    rawLocation: '',
    primaryNeed: '',
    needSeverity: 'medium',
  });
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      if (isView && initialData) {
        setFormData({
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          age: initialData.age || '',
          gender: initialData.gender || 'male',
          contactPhone: initialData.contactPhone || 'Encrypted at Rest',
          aadharMasked: initialData.aadharMasked || '',
          rawLocation: initialData.rawLocation || initialData.state || initialData.district || '',
          primaryNeed: initialData.primaryNeed || '',
          needSeverity: initialData.needSeverity || 'medium',
        });
      } else if (mode === 'REGISTER') {
        setFormData({ firstName: '', lastName: '', age: '', gender: 'male', contactPhone: '', aadharMasked: '', rawLocation: '', primaryNeed: '', needSeverity: 'medium' });
      }

      fetchLocations()
        .then(data => setLocations(data))
        .catch(err => console.error("Failed to fetch locations:", err));
    }
  }, [isOpen, isView, initialData, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isView || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Geocode the raw location text
      const geo = resolveCoordinates(formData.rawLocation);

      const payload = {
        ...formData,
        age: parseInt(formData.age),
        projectId: currentProject?._id || null,
        state: formData.rawLocation,
        geo: {
          lat: geo.lat,
          lng: geo.lng,
          formattedAddress: formData.rawLocation,
          geocodeMethod: 'geocoded',
          confidenceScore: 0.8,
          geocodedAt: new Date().toISOString(),
        },
        zoneAssignment: { status: 'matched', resolvedBy: 'auto' },
      };

      await onAdd(payload);
      setSubmitted(true);

      // Auto-close after a brief success animation
      setTimeout(() => {
        setFormData({ firstName: '', lastName: '', age: '', gender: 'male', contactPhone: '', aadharMasked: '', rawLocation: '', primaryNeed: '', needSeverity: 'medium' });
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to register beneficiary:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const needOptions = ['Food', 'Water', 'Medical', 'Shelter', 'Infrastructure', 'Education', 'Sanitation', 'Clothing', 'Counseling'];
  const severityColor = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '540px', border: isView ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)' }}
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
                {isView ? `Secure Identity Record: ${initialData?._id}` : `Adding to: ${currentProject?.name || 'Current Project'}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem 2rem' }}>
          {/* Name Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>First Name</label>
              <input 
                type="text" required disabled={isView}
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                placeholder="Ravi"
                style={{ opacity: isView ? 0.8 : 1 }}
              />
            </div>
            <div className="input-group">
              <label>Last Name</label>
              <input 
                type="text" required disabled={isView}
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                placeholder="Kumar"
                style={{ opacity: isView ? 0.8 : 1 }}
              />
            </div>
          </div>

          {/* Age + Gender */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label>Age</label>
              <input 
                type="number" required disabled={isView}
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
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Phone + Aadhaar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label><Phone size={12} style={{marginRight: '4px'}}/> Phone</label>
              <input 
                type="text" disabled={isView}
                value={formData.contactPhone}
                onChange={e => setFormData({...formData, contactPhone: e.target.value})}
                placeholder="9876543210"
                style={{ opacity: isView ? 0.8 : 1 }}
              />
            </div>
            <div className="input-group">
              <label><Fingerprint size={12} style={{marginRight: '4px'}}/> Aadhaar (Last 4)</label>
              <input 
                type="text" maxLength="4" required disabled={isView}
                value={formData.aadharMasked}
                onChange={e => setFormData({...formData, aadharMasked: e.target.value})}
                placeholder="1234"
                style={{ opacity: isView ? 0.8 : 1, fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Location (text input for geocoding) */}
          <div className="input-group">
            <label><MapPin size={12} style={{marginRight: '4px'}}/> Location (City, District, or Village)</label>
            <input 
              type="text" required disabled={isView}
              value={formData.rawLocation}
              onChange={e => setFormData({...formData, rawLocation: e.target.value})}
              placeholder="e.g. Wayanad, Kerala or Delhi NCR"
              style={{ opacity: isView ? 0.8 : 1 }}
              list="location-suggestions"
            />
            <datalist id="location-suggestions">
              {locations.map(loc => (
                <option key={loc._id} value={loc.name} />
              ))}
              {['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Wayanad', 'Pune', 'Jaipur', 'Lucknow'].map(city => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>

          {/* Need + Severity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label><Target size={12} style={{marginRight: '4px'}}/> Primary Need</label>
              <select
                disabled={isView}
                value={formData.primaryNeed}
                onChange={e => setFormData({...formData, primaryNeed: e.target.value})}
                style={{ opacity: isView ? 0.8 : 1 }}
              >
                <option value="">Select need...</option>
                {needOptions.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label><AlertTriangle size={12} style={{marginRight: '4px'}}/> Severity</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                {['low', 'medium', 'high'].map(sev => (
                  <button
                    key={sev}
                    type="button"
                    disabled={isView}
                    onClick={() => setFormData({...formData, needSeverity: sev})}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: '8px', cursor: isView ? 'default' : 'pointer',
                      fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', border: 'none',
                      background: formData.needSeverity === sev ? `${severityColor[sev]}22` : 'rgba(255,255,255,0.03)',
                      color: formData.needSeverity === sev ? severityColor[sev] : 'rgba(255,255,255,0.4)',
                      outline: formData.needSeverity === sev ? `1px solid ${severityColor[sev]}55` : '1px solid rgba(255,255,255,0.06)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isView && initialData?.registeredAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
              <Calendar size={14} color="var(--text-dim)" />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Registered on {new Date(initialData.registeredAt).toLocaleString()}
              </span>
            </div>
          )}

          <div style={{ marginTop: '0.25rem', display: 'flex', gap: '1rem' }}>
            {isView ? (
              <button type="button" onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>Close Profile</button>
            ) : (
              <>
                <button type="button" onClick={onClose} className="btn" style={{ flex: 1 }}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={isSubmitting || submitted}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} className="spin" /> Registering…</>
                  ) : submitted ? (
                    <><CheckCircle2 size={16} /> Added & Plotted</>
                  ) : (
                    'Register & Plot on Map'
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
