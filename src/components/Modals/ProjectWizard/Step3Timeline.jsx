import React, { useState } from 'react';
import { 
  Clock, 
  ListPlus, 
  Trash2, 
  Calendar, 
  Zap, 
  Activity, 
  Sparkles, 
  BrainCircuit,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateTimelinePhases } from '../../../services/gemini';

export default function Step3Timeline({ data, update }) {
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showDateInputs, setShowDateInputs] = useState(false);
  const [error, setError] = useState(null);

  const handleTimelineChange = (field, value) => {
    update('timeline', { 
      timeline: { ...data.timeline, [field]: value } 
    });
  };

  const resetPhases = () => {
    update('timeline', {
      timeline: { ...data.timeline, phases: [] }
    });
  };

  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) return;
    
    try {
      setIsGenerating(true);
      setError(null);
      const aiResponse = await generateTimelinePhases(aiDescription);
      
      if (aiResponse) {
        if (aiResponse.isOffTopic) {
          setError("This input seems unrelated to mission orchestration. Please describe a relief strategy.");
          setIsGenerating(false);
          return;
        }

        // Apply dates and phases (always exists due to AI fallback)
        update('timeline', {
          timeline: { 
            ...data.timeline, 
            startDate: aiResponse.startDate || data.timeline.startDate,
            endDate: aiResponse.endDate || data.timeline.endDate,
            phases: aiResponse.phases 
          }
        });
        
        if (aiResponse.startDate || aiResponse.endDate) {
          setShowDateInputs(true);
        }
        
        setAiDescription(''); // Clear on success
      }
    } catch (err) {
      // This is now only for true technical crashes
      setError("Strategic engine encountered a synchronization error. Attempting local fallback...");
    } finally {
      setIsGenerating(false);
    }
  };

  const addPhase = () => {
    update('timeline', {
      timeline: { ...data.timeline, phases: [...data.timeline.phases, { name: '', durationDays: 1 }] }
    });
  };

  const updatePhase = (idx, field, val) => {
    const updated = [...data.timeline.phases];
    updated[idx][field] = field === 'durationDays' ? parseInt(val) || 0 : val;
    update('timeline', { timeline: { ...data.timeline, phases: updated } });
  };

  const removePhase = (idx) => {
    update('timeline', {
      timeline: { ...data.timeline, phases: data.timeline.phases.filter((_, i) => i !== idx) }
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      
      {/* Smart Orchestration Section */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Sparkles size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>Smart Phase Orchestration</h3>
          <div style={{ padding: '0.2rem 0.5rem', background: 'rgba(79, 70, 229, 0.15)', border: '1px solid rgba(79, 70, 229, 0.3)', borderRadius: '4px', fontSize: '10px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Powered</div>
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '1.5rem',
          display: 'flex', flexDirection: 'column', gap: '1.25rem'
        }}>
           <div style={{ position: 'relative' }}>
             <textarea 
               value={aiDescription}
               onChange={(e) => setAiDescription(e.target.value)}
               placeholder="Example: Starting this October for 6 months, we need 5 days of surveys followed by..."
               style={{ 
                 width: '100%', minHeight: '100px', padding: '1.25rem', background: 'rgba(0,0,0,0.3)', 
                 border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', 
                 fontSize: '0.9rem', lineHeight: '1.6', outline: 'none', resize: 'vertical'
               }}
             />
             {isGenerating && (
               <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                     <Loader2 size={32} className="animate-spin" color="var(--primary)" />
                     <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, letterSpacing: '0.05em' }}>Architecting Timeline...</span>
                  </div>
               </div>
             )}
           </div>

           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0, maxWidth: '60%' }}>The AI will extract phase windows AND detect mission dates automatically from your description.</p>
              <button 
                onClick={handleAIGenerate}
                disabled={isGenerating || !aiDescription.trim()}
                style={{ 
                  padding: '0.75rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', 
                  borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: (isGenerating || !aiDescription.trim()) ? 0.5 : 1,
                  transition: 'all 0.2s', boxShadow: '0 4px 20px rgba(79, 70, 229, 0.2)'
                }}
              >
                <BrainCircuit size={16} /> Orchestrate Strategy
              </button>
           </div>
           
           {error && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               style={{ padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
             >
                <AlertCircle size={14} /> {error}
             </motion.div>
           )}
        </div>
      </section>

      {/* Date Range Section - Now with Progressive Disclosure */}
      <AnimatePresence>
        {showDateInputs && (
          <motion.section 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '1rem 0' }}>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <Calendar size={18} color="var(--primary)" />
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activation Date</label>
                </div>
                <input 
                  type="date" 
                  value={data.timeline.startDate}
                  onChange={(e) => handleTimelineChange('startDate', e.target.value)}
                  style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', fontSize: '1rem', outline: 'none' }}
                />
              </div>
              <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <Clock size={18} color="var(--primary)" />
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deactivation Target</label>
                </div>
                <input 
                  type="date" 
                  value={data.timeline.endDate}
                  onChange={(e) => handleTimelineChange('endDate', e.target.value)}
                  style={{ width: '100%', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '10px', fontSize: '1rem', outline: 'none' }}
                />
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {!showDateInputs && (
        <button 
          onClick={() => setShowDateInputs(true)}
          style={{ 
            alignSelf: 'center', background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem 2rem', 
            borderRadius: '100px', color: 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          <Calendar size={14} /> Define Specific Calendar Window (Manual)
        </button>
      )}

      <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }} />

      {/* Phase Orchestration */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Phase Registry & Refinement</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)' }}>Fine-tune the operational windows deduced by the strategic engine.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button 
              onClick={resetPhases}
              style={{ 
                padding: '0.6rem 1.5rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', 
                color: '#f87171', borderRadius: '100px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500,
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.05)'}
            >
              Reset Registry
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AnimatePresence>
            {data.timeline.phases.map((phase, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                style={{ 
                  display: 'grid', gridTemplateColumns: '40px 1fr 140px 40px', gap: '1.5rem', alignItems: 'center',
                  padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '12px'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 800 
                }}>
                  {idx + 1}
                </div>
                <input 
                  type="text" 
                  placeholder="Phase Identifier (e.g. Ingestion)" 
                  value={phase.name}
                  onChange={(e) => updatePhase(idx, 'name', e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.9rem', outline: 'none' }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input 
                    type="number" 
                    value={phase.durationDays}
                    onChange={(e) => updatePhase(idx, 'durationDays', e.target.value)}
                    style={{ width: '60px', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.85rem', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>DAYS</span>
                </div>
                <button 
                  onClick={() => removePhase(idx)} 
                  style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.4)'}
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          <button 
            onClick={addPhase} 
            style={{ 
              marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', 
              background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', 
              color: 'var(--text-dim)', padding: '1.25rem', borderRadius: '12px', cursor: 'pointer', 
              fontSize: '0.85rem', fontWeight: 500, width: '100%', justifyContent: 'center', transition: 'all 0.2s' 
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
          >
            <ListPlus size={16} /> Add Custom Operational Phase
          </button>
        </div>
      </section>

      <div style={{ padding: '1.5rem', background: 'rgba(79, 70, 229, 0.03)', border: '1px solid rgba(79, 70, 229, 0.1)', borderRadius: '16px', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
         <div style={{ padding: '0.75rem', background: 'var(--primary-glow)', borderRadius: '12px' }}>
            <Activity size={20} color="var(--primary)" />
         </div>
         <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: 1.6 }}>
            The <strong style={{ color: '#fff' }}>Strategic AI Engine</strong> will prioritize resource distribution peaks based on these phase windows, ensuring no depletion occurs during critical deactivation stages.
         </p>
      </div>
    </div>
  );
}



