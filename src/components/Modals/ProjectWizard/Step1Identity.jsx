import React, { useState, useEffect } from 'react';
import { Target, Zap, Cpu, Settings, MessageSquare, Info, Shield, Radio } from 'lucide-react';

export default function Step1Identity({ data, update }) {
  const [showCustomBeneficiary, setShowCustomBeneficiary] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const standardTypes = ["Flood Victims", "Medical Emergency", "IDP/Refugee", "Rural Distress"];
    if (data.metadata.beneficiaryType && !standardTypes.includes(data.metadata.beneficiaryType)) {
      setShowCustomBeneficiary(true);
      setCustomValue(data.metadata.beneficiaryType);
    }
  }, []);

  const handleChange = (field, value) => {
    update('identity', { [field]: value });
  };

  const handleMetaChange = (field, value) => {
    update('identity', { 
      metadata: { ...data.metadata, [field]: value } 
    });
  };

  const handleBeneficiarySelect = (val) => {
    if (val === 'OTHER') {
      setShowCustomBeneficiary(true);
      handleMetaChange('beneficiaryType', customValue);
    } else {
      setShowCustomBeneficiary(false);
      handleMetaChange('beneficiaryType', val);
    }
  };

  const handleCustomBeneficiaryChange = (val) => {
    setCustomValue(val);
    handleMetaChange('beneficiaryType', val);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Primary Info Section */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '4rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Basic Information</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
              Give your mission a unique identifier and a brief context for the AI and ground responders.
            </p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Campaign / Mission Name</label>
              <input 
                type="text" 
                placeholder="e.g. Operation Nilphamari Relief"
                value={data.name}
                onChange={(e) => handleChange('name', e.target.value)}
                style={{ 
                  width: '100%', padding: '1.25rem', background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px', 
                  fontSize: '1.1rem', fontWeight: 500, outline: 'none', transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mission Objectives & Context</label>
              <textarea 
                placeholder="Describe the mission goals, operational constraints, and intended impact..."
                value={data.description}
                onChange={(e) => handleChange('description', e.target.value)}
                style={{ 
                  width: '100%', minHeight: '140px', padding: '1.25rem', 
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', 
                  color: '#fff', borderRadius: '12px', fontSize: '1rem', resize: 'vertical',
                  lineHeight: '1.6', outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>
          </div>
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }} />

      {/* Strategic Parameters Section */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '4rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Strategic Parameters</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
              Define the logic engine and priority for this specific mission cluster.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operational Strategy</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { id: 'manual', icon: Settings, label: 'Manual Control', desc: 'Coordinator handles all logic' },
                    { id: 'assisted', icon: Zap, label: 'AI Assisted', desc: 'Gemini provides recommendations' },
                    { id: 'autopilot', icon: Cpu, label: 'AI Autopilot', desc: 'Autonomous orchestration (Locked)', locked: true }
                  ].map((mode) => (
                    <div 
                      key={mode.id}
                      onClick={() => !mode.locked && handleChange('operatingMode', mode.id)}
                      style={{ 
                        padding: '1.25rem', borderRadius: '12px', border: '1px solid',
                        borderColor: data.operatingMode === mode.id 
                          ? (mode.id === 'assisted' ? '#10B981' : 'var(--primary)') 
                          : 'rgba(255,255,255,0.05)',
                        background: data.operatingMode === mode.id 
                          ? (mode.id === 'assisted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(79, 70, 229, 0.08)') 
                          : 'rgba(255,255,255,0.01)',
                        cursor: mode.locked ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '1.25rem',
                        opacity: mode.locked ? 0.4 : 1, transition: 'all 0.2s',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: (data.operatingMode === mode.id && mode.id === 'assisted') 
                          ? '0 0 20px rgba(16, 185, 129, 0.15)' 
                          : 'none'
                      }}
                    >
                      {mode.id === 'assisted' && (
                        <div style={{
                          position: 'absolute', top: '0', right: '0',
                          background: '#10B981', color: '#fff', fontSize: '9px',
                          fontWeight: 900, padding: '4px 10px', borderRadius: '0 12px 0 12px',
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          boxShadow: '-2px 2px 10px rgba(16, 185, 129, 0.2)'
                        }}> Recommended </div>
                      )}
                      <div style={{ 
                        width: '40px', height: '40px', borderRadius: '10px', 
                        background: data.operatingMode === mode.id 
                          ? (mode.id === 'assisted' ? '#10B981' : 'var(--primary)') 
                          : 'rgba(255,255,255,0.03)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <mode.icon size={20} color={data.operatingMode === mode.id ? '#fff' : 'var(--text-dim)'} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: data.operatingMode === mode.id ? '#fff' : 'var(--text-dim)' }}>{mode.label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{mode.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mission Priority</label>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Low', 'Medium', 'High', 'Critical'].map(p => (
                    <button 
                      key={p} 
                      onClick={() => handleMetaChange('priority', p)}
                      style={{ 
                        flex: 1, padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700,
                        background: data.metadata.priority === p ? 'var(--primary)' : 'transparent',
                        color: data.metadata.priority === p ? '#fff' : 'var(--text-dim)', 
                        border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beneficiary Profile</label>
                <select 
                  value={showCustomBeneficiary ? 'OTHER' : data.metadata.beneficiaryType} 
                  onChange={(e) => handleBeneficiarySelect(e.target.value)}
                  style={{ 
                    width: '100%', padding: '1.1rem', background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.08)', color: '#fff', 
                    borderRadius: '12px', outline: 'none', fontSize: '0.95rem' 
                  }}
                >
                  <option value="" style={{ background: '#111' }}>Select focus type...</option>
                  <option value="Flood Victims" style={{ background: '#111' }}>Flood / Displacement</option>
                  <option value="Medical Emergency" style={{ background: '#111' }}>Medical / Health</option>
                  <option value="IDP/Refugee" style={{ background: '#111' }}>Internal Displacement</option>
                  <option value="Rural Distress" style={{ background: '#111' }}>Rural Subsistence</option>
                  <option value="OTHER" style={{ background: '#111' }}>Other / Custom...</option>
                </select>
                {showCustomBeneficiary && (
                  <input 
                    type="text"
                    placeholder="Type custom profile name..."
                    value={customValue}
                    onChange={(e) => handleCustomBeneficiaryChange(e.target.value)}
                    style={{ 
                      width: '100%', padding: '1rem', marginTop: '0.75rem', 
                      background: 'rgba(79, 70, 229, 0.05)', border: '1px solid var(--primary)', 
                      color: '#fff', borderRadius: '12px', fontSize: '0.9rem' 
                    }}
                  />
                )}
              </div>

              <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)', borderRadius: '16px', position: 'relative' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <Radio size={18} color="var(--success)" />
                       <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>Notification Relay</span>
                    </div>
                    <div 
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      style={{ cursor: 'help', color: 'var(--text-dim)', position: 'relative' }}
                    >
                      <Info size={14} />
                      {showTooltip && (
                        <div style={{
                          position: 'absolute', bottom: '30px', right: '0',
                          padding: '1.25rem', background: 'rgba(15, 23, 42, 0.98)', 
                          backdropFilter: 'blur(12px)',
                          color: '#fff', fontSize: '0.8rem', borderRadius: '16px', zIndex: 100,
                          width: '280px', border: '1px solid rgba(245, 158, 11, 0.3)',
                          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                          lineHeight: '1.5',
                          textAlign: 'left'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ width: '3px', height: '14px', background: '#F59E0B', borderRadius: '10px' }} />
                            <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#F59E0B', fontSize: '0.75rem' }}>Operational Insight</div>
                          </div>
                          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem', color: '#fff' }}>Broadcast Protocol</div>
                          <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontWeight: 400 }}>
                            Enables low-latency push notifications via Firebase and SMS gateways to all active responders in the sector.
                          </p>
                        </div>
                      )}
                    </div>
                 </div>
                 <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.25rem', lineHeight: '1.5' }}>
                    Instantly broadcast mission alerts to all responders in the tactical zone.
                 </p>
                 <div 
                   onClick={() => handleMetaChange('notificationsEnabled', !data.metadata.notificationsEnabled)}
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer'
                   }}
                 >
                    <div style={{ 
                      width: '44px', height: '24px', borderRadius: '100px', 
                      background: data.metadata.notificationsEnabled ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                      position: 'relative', transition: 'background 0.3s'
                    }}>
                       <div style={{ 
                         width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
                         position: 'absolute', top: '3px',
                         left: data.metadata.notificationsEnabled ? '23px' : '3px',
                         transition: 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                       }} />
                    </div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: data.metadata.notificationsEnabled ? '#fff' : 'var(--text-dim)' }}>
                       Active Broadcasting
                    </span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
