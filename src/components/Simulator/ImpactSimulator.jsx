import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingDown, ArrowRight, Zap, Sparkles, Target } from 'lucide-react';
import { calculatePriorityScore, getPriorityLevel } from '../../services/logic';
import { getImpactSimulation } from '../../services/gemini';

export default function ImpactSimulator({ incident }) {
  const [simulationVolunteers, setSimulationVolunteers] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  
  // Base scenario
  const baseScore = calculatePriorityScore({
    severity: incident.severity,
    frequency: incident.frequency,
    resourceGap: incident.resourceGap,
    timeSensitivity: incident.timeSensitivity
  });

  // Simulated scenario (each volunteer reduces resource gap by 0.5)
  const simulatedResourceGap = Math.max(1, incident.resourceGap - (simulationVolunteers * 0.5));
  const newScore = calculatePriorityScore({
    ...incident,
    resourceGap: simulatedResourceGap
  });

  const baseLevel = getPriorityLevel(baseScore);
  const displayScore = aiInsight ? parseFloat(aiInsight.newScore) : newScore;
  const newLevel = getPriorityLevel(displayScore);

  const scoreDiff = parseFloat((baseScore - displayScore).toFixed(1));

  const runSimulation = async () => {
    if (simulationVolunteers === 0) return;
    setIsSimulating(true);
    setAiInsight(null);
    try {
      const result = await getImpactSimulation(incident, simulationVolunteers);
      setAiInsight(result);
    } catch (error) {
      console.error("Simulation failed", error);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div style={{ padding: '0', background: 'transparent' }}>
      <div className="pane-header" style={{ marginBottom: '1.5rem', color: '#fff' }}>
        <Zap size={14} color="var(--success)" /> Impact Simulator
      </div>

      <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, padding: '1rem', background: '#0a0a0a', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Current</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 500, lineHeight: 1, color: '#ffffff' }}>{baseScore}</span>
            <span style={{ color: baseLevel.color, fontSize: '0.75rem', fontWeight: 600 }}>{baseLevel.label}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ArrowRight size={14} color="var(--text-dim)" />
        </div>

        <div style={{ flex: 1, padding: '1rem', background: 'linear-gradient(180deg, #111 0%, #050505 100%)', borderRadius: '4px', border: '1px solid var(--border-focus)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'var(--border-focus)' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Simulated</p>
            <motion.span 
              key={displayScore}
              initial={{ scale: 1.1, color: '#fff' }}
              animate={{ scale: 1, color: '#fff' }}
              style={{ fontSize: '2rem', fontWeight: 500, lineHeight: 1 }}
            >
              {displayScore}
            </motion.span>
            <span style={{ color: newLevel.color, fontSize: '0.75rem', fontWeight: 600 }}>{newLevel.label}</span>
          {scoreDiff > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success)', fontSize: '0.75rem', marginTop: '0.5rem' }}
            >
              <TrendingDown size={10} />
              <span>Reduced by {scoreDiff} pts</span>
            </motion.div>
          )}
        </div>
      </div>

      {aiInsight && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '2.5rem', padding: '1.25rem', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.1)', borderRadius: '4px' }}
        >
          <div style={{ display: 'flex', gap: '0.75rem' }}>
             <Sparkles size={16} color="#38bdf8" style={{ marginTop: '3px', flexShrink: 0 }} />
             <div>
                <p style={{ fontSize: '0.8125rem', color: '#fff', fontWeight: 600, marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Projection</p>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: '1.5', fontStyle: 'italic' }}>"{aiInsight.projection}"</p>
                
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                   <Target size={12} color="var(--success)" />
                   <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{aiInsight.successRate}% Success Probability</span>
                </div>
             </div>
          </div>
        </motion.div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Allocate Volunteers to Test Impact
        </label>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input 
            type="range" 
            min="0" 
            max="15" 
            value={simulationVolunteers}
            onChange={(e) => setSimulationVolunteers(parseInt(e.target.value))}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 500, width: '2rem', textAlign: 'center', color: '#fff' }}>
            {simulationVolunteers}
          </span>
        </div>
      </div>

      <button 
        className="btn" 
        style={{ width: '100%', justifyContent: 'center', border: '1px solid var(--border-strong)', background: '#0a0a0a' }}
        onClick={runSimulation}
        disabled={isSimulating}
      >
        {isSimulating ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Zap size={14} />
          </motion.div>
        ) : (
          <>
            <Play size={14} /> Generate AI Simulation
          </>
        )}
      </button>
    </div>
  );
}
