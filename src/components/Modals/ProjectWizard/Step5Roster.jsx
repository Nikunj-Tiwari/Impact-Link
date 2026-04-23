import React, { useState, useEffect, useMemo } from 'react';
import { Users, MapPin, Plane, Award, CheckCircle2, Loader2, Sparkles, Star, Zap, ShieldCheck, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchVolunteers } from '../../../services/api';
import { calculateHaversineDistance } from '../../../services/logic';

const ExperienceBadge = ({ level }) => {
  const colors = {
    'Junior': { bg: 'rgba(255,255,255,0.05)', text: 'var(--text-dim)' },
    'Mid-Level': { bg: 'rgba(52, 211, 153, 0.1)', text: '#34d399' },
    'Senior': { bg: 'rgba(99, 102, 241, 0.1)', text: 'var(--accent-brand)' },
    'Elite': { bg: 'rgba(245, 158, 11, 0.1)', text: '#f59e0b' }
  };
  const theme = colors[level] || colors['Mid-Level'];
  return (
    <div style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: theme.bg, color: theme.text, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>
      {level}
    </div>
  );
};

export default function Step5Roster({ data, update }) {
  const [volunteers, setVolunteers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // Region Index

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await fetchVolunteers();
        setVolunteers(list);
      } catch (err) {
        console.error('Failed to load roster:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const toggleVolunteer = (regionIdx, volunteerId, type) => {
    const currentRoster = [...(data.assignedRoster || [])];
    const isSelected = currentRoster.some(r => r.volunteerId === volunteerId && r.regionIndex === regionIdx && r.type === type);
    
    if (isSelected) {
      const updated = currentRoster.filter(r => !(r.volunteerId === volunteerId && r.regionIndex === regionIdx && r.type === type));
      update('roster', { assignedRoster: updated });
    } else {
      // Check limits
      const target = data.regions[regionIdx]?.volunteerTargets?.[type] || 0;
      const currentlySelected = currentRoster.filter(r => r.regionIndex === regionIdx && r.type === type).length;
      
      if (currentlySelected < target) {
        update('roster', { assignedRoster: [...currentRoster, { volunteerId, regionIndex: regionIdx, type }] });
      }
    }
  };

  const getFilteredVolunteers = (regionIdx, type) => {
    if (!volunteers.length) return [];
    
    if (type === 'local') {
      const region = data.regions[regionIdx];
      const { lat, lng } = region.center;
      const radius = region.radius;
      
      return volunteers.filter(v => {
        const vLat = v.locationId?.lat;
        const vLng = v.locationId?.lng;
        if (!vLat || !vLng) return false;
        const dist = calculateHaversineDistance(lat, lng, vLat, vLng);
        return dist <= radius && v.status === 'Active';
      });
    } else {
      // Travel (Mobile) - Anyone Active
      return volunteers.filter(v => v.status === 'Active');
    }
  };

  const handleAutoDraft = async () => {
    try {
      setIsLoading(true);
      const missionContext = `${data.name}. ${data.description}. Focus: ${data.metadata.beneficiaryType}. Priority: ${data.metadata.priority}`;
      
      const res = await fetch('http://localhost:5000/api/allocate/semantic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Strategic: Identity Context
        },
        body: JSON.stringify({
          missionContext,
          volunteerIds: volunteers.map(v => v._id)
        })
      });

      if (!res.ok) throw new Error('Semantic allocation request failed.');
      
      const semanticMatches = await res.json();
      
      // Map scores back to volunteers
      const scoredVolunteers = volunteers.map(v => {
        const match = semanticMatches.find(m => m.volunteerId === v._id);
        return { ...v, semanticScore: match ? match.semanticScore : 0 };
      });

      setVolunteers(scoredVolunteers.sort((a, b) => (b.semanticScore || 0) - (a.semanticScore || 0)));

      // Optional: Auto-select Top 3 for current region?
      // For now, just let the user see the scores and decide, OR we can auto-toggle the best ones.
      
    } catch (err) {
      console.error('Auto-Draft Failure:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
       {data.allocationStrategy === 'ai' && (
         <div style={{ 
           padding: '1.5rem 2rem', 
           background: 'rgba(79, 70, 229, 0.05)', 
           border: '1px solid rgba(79, 70, 229, 0.2)', 
           borderRadius: '16px',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'space-between',
           gap: '2rem'
         }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
              }}>
                <Sparkles size={20} color="#fff" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff', margin: 0 }}>AI-Augmented Allocation Active</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
                  The engine will auto-draft top responders. Manual selections below act as **Tactical Overrides**.
                </p>
              </div>
           </div>
           
           <button 
             onClick={handleAutoDraft}
             disabled={isLoading}
             style={{ 
               padding: '0.75rem 1.25rem', background: 'var(--primary)', color: '#fff',
               border: 'none', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700,
               cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
               boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
             }}
           >
             <Zap size={14} /> {isLoading ? 'Analyzing Roster...' : 'Execute AI Auto-Draft'}
           </button>
         </div>
       )}

       {/* Region Navigation */}
       <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
         {data.regions.map((region, idx) => (
           <button
             key={idx}
             onClick={() => setActiveTab(idx)}
             style={{
               padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid',
               borderColor: activeTab === idx ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
               background: activeTab === idx ? 'rgba(79, 70, 229, 0.1)' : 'rgba(255,255,255,0.02)',
               color: activeTab === idx ? '#fff' : 'var(--text-dim)',
               cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
               display: 'flex', alignItems: 'center', gap: '0.6rem'
             }}
           >
             <MapPin size={14} /> {region.name || `Area ${idx + 1}`}
           </button>
         ))}
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          {/* LOCAL DRAFTBOARD */}
          <DraftSection 
            title="Resident Base Selection"
            icon={MapPin}
            type="local"
            color="var(--success)"
            target={data.regions?.[activeTab]?.volunteerTargets?.local || 0}
            candidates={getFilteredVolunteers(activeTab, 'local')}
            selectedRoster={data.assignedRoster || []}
            onToggle={(id) => toggleVolunteer(activeTab, id, 'local')}
            regionIdx={activeTab}
            isLoading={isLoading}
          />

          {/* TRAVEL DRAFTBOARD */}
          <DraftSection 
            title="Mobile Unit Selection"
            icon={Plane}
            type="travel"
            color="var(--accent-tertiary)"
            target={data.regions?.[activeTab]?.volunteerTargets?.travel || 0}
            candidates={getFilteredVolunteers(activeTab, 'travel')}
            selectedRoster={data.assignedRoster || []}
            onToggle={(id) => toggleVolunteer(activeTab, id, 'travel')}
            regionIdx={activeTab}
            isLoading={isLoading}
          />
       </div>
    </div>
  );
}

function DraftSection({ title, icon: Icon, type, color, target, candidates, selectedRoster, onToggle, regionIdx, isLoading }) {
  const selectedCount = selectedRoster.filter(r => r.regionIndex === regionIdx && r.type === type).length;
  const isComplete = selectedCount === target && target > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
             <Icon size={18} color={color} />
             <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{title}</span>
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isComplete ? 'var(--success)' : 'var(--text-dim)' }}>
             Drafted: <span style={{ color: isComplete ? 'var(--success)' : '#fff', fontSize: '1rem' }}>{selectedCount}</span> / {target}
          </div>
       </div>

       <div style={{ 
         height: '500px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', 
         borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)',
         padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'
       }}>
          {isLoading ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Loader2 className="animate-spin" color="var(--primary)" />
            </div>
          ) : candidates.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
               No available responders found for this criteria.
            </div>
          ) : candidates.map(v => {
            const isSelected = selectedRoster.some(r => r.volunteerId === v._id && r.regionIndex === regionIdx && r.type === type);
            const isSelectedElsewhere = selectedRoster.some(r => r.volunteerId === v._id && (r.regionIndex !== regionIdx || r.type !== type));
            
            return (
              <motion.div
                key={v._id}
                whileHover={{ scale: 1.01 }}
                onClick={() => !isSelectedElsewhere && onToggle(v._id)}
                style={{
                  padding: '1rem', background: isSelected ? 'rgba(79, 70, 229, 0.08)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid', borderColor: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '12px', cursor: isSelectedElsewhere ? 'default' : 'pointer',
                  opacity: isSelectedElsewhere ? 0.3 : 1, transition: 'all 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                   <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        {v.name.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{v.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{v.skills.slice(0, 2).join(' • ')}</div>
                      </div>
                   </div>
                   {isSelected && <CheckCircle2 size={16} color="var(--primary)" />}
                   
                   {/* STRATEGIC: Semantic Relevance Indicator */}
                   {v.semanticScore !== undefined && v.semanticScore > 0 && (
                     <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.5rem', color: 'var(--primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Match</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 900, color: v.semanticScore > 0.8 ? '#10B981' : '#fff' }}>{Math.round(v.semanticScore * 100)}%</div>
                     </div>
                   )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
                   <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                         <span>Performance Index</span>
                         <span style={{ color: '#fff' }}>{v.performanceScore}%</span>
                      </div>
                      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                        <div style={{ width: `${v.performanceScore}%`, height: '100%', background: 'var(--success)', borderRadius: '2px' }} />
                      </div>
                   </div>
                   <ExperienceBadge level={v.experienceLevel} />
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Zap size={10} color="#f59e0b" /> {v.missionsCompleted} Missions
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <ShieldCheck size={10} color="var(--success)" /> Verified
                   </div>
                </div>
              </motion.div>
            );
          })}
       </div>
    </div>
  );
}
