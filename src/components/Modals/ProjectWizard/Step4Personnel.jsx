import React, { useState } from 'react';
import { Users, MapPin, Plane, Award, X, ShieldAlert, Target, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Step4Personnel({ data, update }) {
  const [newSkill, setNewSkill] = useState('');

  const handleTargetChange = (field, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    const newTargets = { ...data.volunteerTargets, [field]: numValue };
    
    // Auto-sum correlation
    if (field === 'local' || field === 'travel') {
      newTargets.total = newTargets.local + newTargets.travel;
    } else if (field === 'total') {
      // If total is changed directly, we don't auto-distribute but keep it >= sum of parts
      newTargets.total = Math.max(numValue, newTargets.local + newTargets.travel);
    }

    update('personnel', { 
      volunteerTargets: newTargets 
    });
  };

  const addSkill = () => {
    if (newSkill && !data.volunteerTargets.requiredSkills.includes(newSkill)) {
      update('personnel', {
        volunteerTargets: { 
          ...data.volunteerTargets, 
          requiredSkills: [...data.volunteerTargets.requiredSkills, newSkill] 
        }
      });
      setNewSkill('');
    }
  };

  const removeSkill = (skill) => {
    update('personnel', {
      volunteerTargets: { 
        ...data.volunteerTargets, 
        requiredSkills: data.volunteerTargets.requiredSkills.filter(s => s !== skill) 
      }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Target Taskforce Metrics */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Taskforce Target Metrics</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
               Define the scale of human capital required. These numbers act as triggers for the AI allocation engine.
            </p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { label: 'Total', field: 'total', icon: Users, color: 'var(--accent-brand)', desc: 'Absolute Target' },
              { label: 'Local', field: 'local', icon: MapPin, color: 'var(--success)', desc: 'Resident Base' },
              { label: 'Travel', field: 'travel', icon: Plane, color: 'var(--accent-tertiary)', desc: 'Mobile Unit' }
            ].map((item) => (
              <div key={item.field} style={{ 
                padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem', 
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px', textAlign: 'center', transition: 'all 0.2s', position: 'relative'
              }}>
                 <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <item.icon size={20} color={item.color} />
                    </div>
                 </div>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <input 
                      type="number" 
                      min="0"
                      value={data.volunteerTargets[item.field]}
                      onChange={(e) => handleTargetChange(item.field, e.target.value)}
                      className="metric-input"
                      style={{ 
                        width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                        color: '#fff', fontSize: '1.75rem', fontWeight: 800, textAlign: 'center', outline: 'none',
                        borderRadius: '8px', padding: '0.25rem 0', cursor: 'pointer'
                      }}
                    />
                    <div style={{ fontSize: '0.625rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.desc}</div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }} />

      {/* Skills Matrix */}
      <section>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Specialized Skills Matrix</h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                 List any non-negotiable professional certifications or skills required for ground operations.
              </p>
            </div>
            
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="e.g. BLS Certification, Heavy Logistics, HINDI Speaking..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                style={{ 
                  width: '100%', padding: '1.1rem 5rem 1.1rem 1.25rem', background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid rgba(255,255,255,0.08)', color: '#fff', borderRadius: '12px', fontSize: '0.95rem' 
                }}
              />
              <button 
                onClick={addSkill} 
                style={{ 
                  position: 'absolute', right: '0.6rem', top: '0.6rem', bottom: '0.6rem',
                  padding: '0 1.25rem', background: 'var(--primary)', border: 'none',
                  color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem'
                }}
              >
                Add Pin
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <AnimatePresence>
                {data.volunteerTargets.requiredSkills.map(skill => (
                  <motion.div 
                    key={skill}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1rem', 
                      background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.2)', 
                      borderRadius: '100px', color: '#fff', fontSize: '0.8rem', fontWeight: 600 
                    }}
                  >
                    <Award size={14} color="var(--primary)" />
                    {skill}
                    <button onClick={() => removeSkill(skill)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {data.volunteerTargets.requiredSkills.length === 0 && (
                <div style={{ width: '100%', padding: '1.25rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
                   No mandatory specializations defined. Generalist responders will be prioritized.
                </div>
              )}
            </div>
          </div>

          {/* Validation Checklist */}
          <div style={{ padding: '2rem', background: 'rgba(10, 15, 20, 0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
               <ShieldAlert size={20} color="var(--primary)" />
               <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personnel Guardrails</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { title: 'Database Query', desc: 'Sync with verified NGO responder registry' },
                { title: 'Skill Matching', desc: 'Auto-reject responders lacking core certifications' },
                { title: 'Availability Sync', desc: 'Validate responder windows vs mission timeline' }
              ].map((check, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem' }}>
                   <CheckCircle2 size={16} color="var(--success)" style={{ marginTop: '0.2rem' }} />
                   <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{check.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{check.desc}</div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
