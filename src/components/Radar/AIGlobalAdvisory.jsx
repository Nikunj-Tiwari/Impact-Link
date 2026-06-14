import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Terminal, RefreshCw, MapPin, ArrowRight, ShieldAlert, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { getGlobalStrategicAdvice } from '../../services/gemini';

const THREAT_COLORS = {
  CRITICAL: '#ef4444',
  HIGH:     '#f59e0b',
  MODERATE: '#38bdf8',
  LOW:      '#10b981',
};

function ThreatLevelBadge({ level }) {
  const color = THREAT_COLORS[level] || '#94a3b8';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.2rem 0.6rem', borderRadius: '20px',
      background: `${color}15`, border: `1px solid ${color}40`,
      fontSize: '0.6rem', fontWeight: 800, color, letterSpacing: '0.08em'
    }}>
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        style={{ width: '5px', height: '5px', borderRadius: '50%', background: color }}
      />
      {level}
    </div>
  );
}

function HotspotCard({ hotspot }) {
  const color = THREAT_COLORS[hotspot.risk_level] || '#ef4444';
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      style={{
        padding: '1rem 1.25rem', borderRadius: '10px',
        background: `${color}08`, border: `1px solid ${color}30`,
        position: 'relative', overflow: 'hidden'
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: '3px', background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MapPin size={12} color={color} />
          <span style={{ fontSize: '0.6875rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Hotspot Identified
          </span>
        </div>
        <ThreatLevelBadge level={hotspot.risk_level || 'HIGH'} />
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '0.35rem' }}>
        {hotspot.location}
      </div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        {hotspot.reason}
      </div>
      {hotspot.severity_score && (
        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(hotspot.severity_score / 10) * 100}%` }}
              transition={{ duration: 0.8, delay: 0.3 }}
              style={{ height: '100%', background: color, borderRadius: '2px' }}
            />
          </div>
          <span style={{ fontSize: '0.625rem', color, fontFamily: 'monospace', fontWeight: 700 }}>
            {hotspot.severity_score}/10
          </span>
        </div>
      )}
    </motion.div>
  );
}

function LateralShiftCard({ shift }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{
        padding: '1rem 1.25rem', borderRadius: '10px',
        background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <ArrowRight size={12} color="#38bdf8" />
        <span style={{ fontSize: '0.6875rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Recommended Lateral Shift
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        {/* Source */}
        <div style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.5rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Surplus Zone</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{shift.from_zone}</div>
        </div>
        {/* Arrow */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem' }}>
          <div style={{ fontSize: '0.5rem', color: '#38bdf8', fontWeight: 700 }}>{shift.resource_type}</div>
          <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
            <ArrowRight size={16} color="#38bdf8" />
          </motion.div>
        </div>
        {/* Target */}
        <div style={{ flex: 1, padding: '0.5rem 0.75rem', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', textAlign: 'center' }}>
          <div style={{ fontSize: '0.5rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Deficit Zone</div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>{shift.to_zone}</div>
        </div>
      </div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <span style={{ color: '#38bdf8', fontWeight: 600 }}>Expected outcome: </span>
        {shift.estimated_impact}
      </div>
    </motion.div>
  );
}

function TacticalSummaryCard({ summary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        padding: '1rem 1.25rem', borderRadius: '10px',
        background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)',
        borderLeft: '3px solid rgba(168,85,247,0.7)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <TrendingUp size={12} color="#a855f7" />
        <span style={{ fontSize: '0.6875rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Tactical Summary
        </span>
      </div>
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.65, fontStyle: 'italic' }}>
        "{summary}"
      </div>
    </motion.div>
  );
}

function ActionItemsCard({ actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <CheckCircle2 size={12} color="#10b981" />
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Recommended Actions
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {actions.map((action, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.08 }}
            style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.5rem', fontWeight: 800, color: '#10b981', fontFamily: 'monospace'
            }}>
              {i + 1}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{action}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function FallbackText({ text }) {
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Zap size={12} color="var(--success)" style={{ marginTop: '3px', flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{line}</p>
        </div>
      ))}
    </div>
  );
}

export default function AIGlobalAdvisory({ beneficiaries }) {
  const [rawResponse, setRawResponse] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [parseError, setParseError] = useState(false);

  const initiateScan = async () => {
    setIsScanning(true);
    setRawResponse(null);
    setParsed(null);
    setParseError(false);
    try {
      const result = await getGlobalStrategicAdvice(beneficiaries);
      setRawResponse(result);
      // Try to parse structured JSON
      try {
        // Strip possible markdown code fences
        const cleaned = result.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        const data = JSON.parse(cleaned);
        setParsed(data);
      } catch {
        setParseError(true);
      }
    } catch (error) {
      const msg = error?.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('rate-limited')) {
        setRawResponse("⚠️ API rate limit reached.\nPlease wait a few minutes before running another strategic scan.");
        setParseError(true);
      } else {
        setRawResponse("Strategic layer offline. Please check your API configuration.");
        setParseError(true);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const hasResult = rawResponse !== null;
  const threatColor = parsed ? (THREAT_COLORS[parsed.system_threat_level] || '#94a3b8') : '#94a3b8';

  return (
    <div className="pane" style={{
      padding: '1.75rem', flex: 1, minHeight: '400px',
      display: 'flex', flexDirection: 'column', gap: '1.25rem',
      background: 'linear-gradient(135deg, rgba(20,20,30,0.9) 0%, rgba(10,10,15,0.98) 100%)',
      border: hasResult && parsed ? `1px solid ${threatColor}25` : '1px solid rgba(255,255,255,0.05)',
      transition: 'border-color 0.5s ease'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.625rem', margin: 0 }}>
          <Cpu size={16} color="#10b981" />
          AI Strategic Command
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {parsed?.system_threat_level && <ThreatLevelBadge level={parsed.system_threat_level} />}
          <button
            className="btn"
            onClick={initiateScan}
            disabled={isScanning}
            style={{ border: '1px solid var(--border-strong)', fontSize: '0.6875rem', padding: '0.35rem 0.75rem', gap: '0.4rem' }}
          >
            {isScanning ? <RefreshCw size={11} className="spinning" /> : <Zap size={11} />}
            {isScanning ? 'Scanning...' : hasResult ? 'Re-scan' : 'Initiate Scan'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {!hasResult && !isScanning && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', minHeight: '200px' }}
            >
              <Terminal size={36} color="rgba(255,255,255,0.04)" />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>Awaiting tactical data stream</div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', opacity: 0.6 }}>
                  {beneficiaries.length} beneficiaries loaded · Click "Initiate Scan" to analyze
                </div>
              </div>
            </motion.div>
          )}

          {isScanning && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem', minHeight: '200px' }}
            >
              <div style={{ position: 'relative' }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                  style={{ width: '72px', height: '72px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', borderTopColor: '#10b981' }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  style={{ position: 'absolute', inset: '8px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.03)', borderBottomColor: '#a855f7' }}
                />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <Cpu size={20} color="#10b981" />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', letterSpacing: '0.05em', marginBottom: '0.25rem' }}
                >
                  ORCHESTRATING INTELLIGENCE
                </motion.div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
                  Analyzing {beneficiaries.length} beneficiaries across all sectors...
                </div>
              </div>
            </motion.div>
          )}

          {hasResult && !isScanning && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            >
              {parsed && !parseError ? (
                <>
                  {parsed.hotspot && <HotspotCard hotspot={parsed.hotspot} />}
                  {parsed.lateral_shift && <LateralShiftCard shift={parsed.lateral_shift} />}
                  {parsed.tactical_summary && <TacticalSummaryCard summary={parsed.tactical_summary} />}
                  {parsed.recommended_actions?.length > 0 && <ActionItemsCard actions={parsed.recommended_actions} />}
                </>
              ) : (
                <FallbackText text={rawResponse} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
