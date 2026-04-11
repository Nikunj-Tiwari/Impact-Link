import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CheckCircle, Send, Users, MapPin, Sparkles } from 'lucide-react';
import { getMatchReasoning } from '../../services/gemini';
import { getPriorityLevel } from '../../services/logic';

export default function ActionCenter({ incident, onDispatch }) {
  const [deployed, setDeployed] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [volunteers, setVolunteers] = useState(5);
  const [matchInsight, setMatchInsight] = useState('');

  const priorityInfo = useMemo(() => {
    const score = (incident.severity * 0.4 + incident.frequency * 0.2 + incident.resourceGap * 0.3 + incident.timeSensitivity * 0.1);
    return getPriorityLevel(score);
  }, [incident]);

  // Mock responder pool (all over India) with Historical Reliability (0-1)
  const responderPool = useMemo(() => [
    { id: 'R1', name: 'Alok K.', lat: 19.1000, lng: 72.9000, skill: 'Medical', reliability: 0.94 },
    { id: 'R2', name: 'Sana M.', lat: 12.9000, lng: 77.6000, skill: 'Logistics', reliability: 0.88 },
    { id: 'R3', name: 'Vikram R.', lat: 28.7000, lng: 77.1000, skill: 'Infrastructure', reliability: 0.91 },
    { id: 'R4', name: 'Priya S.', lat: 13.1000, lng: 80.2000, skill: 'Medical', reliability: 0.85 },
    { id: 'R5', name: 'Rahul V.', lat: 19.2000, lng: 72.8000, skill: 'Food', reliability: 0.78 },
    { id: 'R6', name: 'Anita D.', lat: 13.0000, lng: 80.3000, skill: 'Water', reliability: 0.96 },
    { id: 'R7', name: 'Kunal G.', lat: 12.8000, lng: 77.4000, skill: 'Medical', reliability: 0.82 },
    { id: 'R8', name: 'Meera P.', lat: 28.5000, lng: 77.3000, skill: 'Infrastructure', reliability: 0.89 },
  ], []);

  // Filter responders based on INTELLIGENT ORCHESTRATION (Skills, History, Proximity)
  const responders = useMemo(() => {
    return responderPool
      .map(r => {
        // Rough Haversine-like distance in degrees translated to km (~111km per degree)
        const distanceVal = Math.sqrt(Math.pow(r.lat - incident.lat, 2) + Math.pow(r.lng - incident.lng, 2)) * 111;
        const skillMatch = r.skill === incident.needType ? 1 : 0.4;
        // Confidence = (Reliability * 0.5) + (SkillMatch * 0.3) + (ProximityBonus * 0.2)
        // Adjusting proximity bonus for India scale (max 500km)
        const proximityBonus = Math.max(0, 1 - (distanceVal / 500));
        const confidence = (r.reliability * 0.5) + (skillMatch * 0.3) + (proximityBonus * 0.2);
        
        return { ...r, distanceVal, confidence };
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }, [incident.lat, incident.lng, incident.needType]);

  const topMatch = responders[0];

  React.useEffect(() => {
    if (topMatch && !deployed) {
      getMatchReasoning(topMatch, incident).then(setMatchInsight);
    }
  }, [topMatch, incident, deployed]);

  const handleDeploy = () => {
    setDeploying(true);
    
    // Trigger global dispatch animation
    if (onDispatch) onDispatch(incident.id, volunteers);
    
    // Simulate API call to Firebase
    setTimeout(() => {
      setDeploying(false);
      setDeployed(true);
    }, 1500);
  };

  const calculateDistance = (r) => {
    return `${r.distanceVal.toFixed(1)} km`;
  };

  return (
    <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--border-subtle)', background: 'transparent' }}>
      <div className="pane-header" style={{ marginBottom: '1.5rem', color: '#fff' }}>
        <ShieldAlert size={14} color="var(--warning)" /> Action Center
      </div>
      
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.5rem' }}>
        Orchestrate response from verified resource directory. {incident.needType} skill priority is recommended.
      </p>

      {!deployed && (
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin size={10} /> Suggested Responders
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {responders.map((r, idx) => (
              <div key={r.id} style={{ padding: '0.75rem 1rem', background: idx === 0 ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.03)', borderRadius: '4px', border: idx === 0 ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {r.name}
                    {idx === 0 && <span style={{ fontSize: '0.625rem', background: '#38bdf8', color: '#000', padding: '0.1rem 0.3rem', borderRadius: '2px', fontWeight: 700 }}>AI RECOMMENDATION</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.skill} • {calculateDistance(r)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '0.75rem', color: idx === 0 ? '#38bdf8' : 'var(--success)', fontWeight: 600 }}>{(r.confidence * 100).toFixed(0)}%</div>
                   <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Match</div>
                </div>
              </div>
            ))}
          </div>

          {matchInsight && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '4px', display: 'flex', gap: '0.75rem' }}
            >
              <Sparkles size={14} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: '1.4' }}>
                <span style={{ fontWeight: 600, color: '#38bdf8', fontStyle: 'normal', textTransform: 'uppercase', marginRight: '0.5rem' }}>Reasoning:</span>
                "{matchInsight}"
              </div>
            </motion.div>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {!deployed ? (
          <motion.div
            key="deploy-form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
               <div style={{ flex: 1, position: 'relative' }}>
                  <Users size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="number" 
                    value={volunteers}
                    onChange={(e) => setVolunteers(parseInt(e.target.value))}
                    min="1"
                    style={{ 
                      width: '100%', 
                      background: 'rgba(0,0,0,0.5)', 
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      padding: '0.5rem 1rem 0.5rem 2.5rem',
                      color: '#fff',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}
                  />
               </div>
               <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Count</span>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.8125rem' }}
              onClick={handleDeploy}
              disabled={deploying}
            >
              {deploying ? (
                <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}>
                  Deploying...
                </motion.div>
              ) : (
                <>
                  <Send size={14} /> Dispatch Mission
                </>
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="success-state"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', padding: '1rem' }}
          >
            <CheckCircle color="var(--success)" size={32} style={{ margin: '0 auto 1rem auto' }} />
            <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Personnel Dispatched</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>
              Mission protocol sent to {volunteers} nearby volunteers.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
