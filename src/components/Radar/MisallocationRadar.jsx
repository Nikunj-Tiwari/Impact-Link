import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, AlertTriangle } from 'lucide-react';
import { calculateBeneficiaryMisallocationScore, getBeneficiaryUrgency } from '../../services/logic';

const SEV_COLOR = (s) => {
  if (s >= 8) return '#ef4444';
  if (s >= 6) return '#f59e0b';
  if (s >= 4) return '#38bdf8';
  return '#10b981';
};

const GAP_COLOR = (g) => {
  if (g >= 8) return '#ef4444';
  if (g >= 5) return '#f59e0b';
  return '#10b981';
};

function ThreatHeatGrid({ beneficiaries, volunteers }) {
  const [hovered, setHovered] = useState(null);
  const cells = useMemo(() =>
    beneficiaries
      .map(b => ({ ...b, score: calculateBeneficiaryMisallocationScore(b, volunteers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 40),
    [beneficiaries, volunteers]
  );

  if (cells.length === 0) return null;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.75rem' }}>
        Threat Heatgrid — Top {cells.length} Beneficiaries by Divergence Score
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', position: 'relative' }}>
        {cells.map((b, i) => {
          const isHov = hovered?._id === b._id || hovered?.id === b.id;
          const urgency = getBeneficiaryUrgency(b);
          const size = Math.max(20, Math.min(40, urgency * 3.5));
          return (
            <motion.div
              key={b._id || b.id || i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.015, duration: 0.3 }}
              onMouseEnter={() => setHovered(b)}
              onMouseLeave={() => setHovered(null)}
              style={{
                width: `${size}px`, height: `${size}px`, borderRadius: '4px',
                background: SEV_COLOR(urgency),
                opacity: isHov ? 1 : 0.7,
                cursor: 'pointer', position: 'relative',
                boxShadow: isHov ? `0 0 16px ${SEV_COLOR(urgency)}99` : 'none',
                transition: 'box-shadow 0.2s, opacity 0.2s',
                border: isHov ? `1px solid ${SEV_COLOR(urgency)}` : '1px solid transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              {size >= 28 && (
                <span style={{ fontSize: '0.5rem', color: '#000', fontWeight: 800, opacity: 0.7 }}>
                  {urgency.toFixed(0)}
                </span>
              )}
            </motion.div>
          );
        })}

        {/* Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', zIndex: 9999,
                pointerEvents: 'none',
                background: '#0d0d0d', border: `1px solid ${SEV_COLOR(hovered.severity || 5)}50`,
                borderRadius: '8px', padding: '0.75rem 1rem', minWidth: '200px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                {hovered.primaryNeed || 'General Need'}
              </div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
                {hovered.village || hovered.district || 'Unknown Location'}
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Urgency</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: SEV_COLOR(getBeneficiaryUrgency(hovered)) }}>{getBeneficiaryUrgency(hovered)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: GAP_COLOR(hovered.score) }}>{hovered.score?.toFixed(1) || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</div>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase' }}>{hovered.firstName || 'Unknown'}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.5625rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Severity:</span>
        {[{ l: 'Low', c: '#10b981' }, { l: 'Med', c: '#38bdf8' }, { l: 'High', c: '#f59e0b' }, { l: 'Crit', c: '#ef4444' }].map(b => (
          <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: b.c }} />
            <span style={{ fontSize: '0.5625rem', color: 'var(--text-dim)' }}>{b.l}</span>
          </div>
        ))}
        <span style={{ fontSize: '0.5625rem', color: 'var(--text-dim)', marginLeft: '0.5rem' }}>Cell size = severity magnitude · Hover for details</span>
      </div>
    </div>
  );
}

function DivergenceTable({ data }) {
  return (
    <div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '0.75rem' }}>
        Top Critical Misallocations
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((b, i) => {
          const urgency = getBeneficiaryUrgency(b);
          const sevColor = SEV_COLOR(urgency);
          const gapColor = GAP_COLOR(b.score);
          return (
            <motion.div
              key={b._id || b.id || i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                display: 'grid', gridTemplateColumns: '24px 1fr 60px 60px 72px',
                alignItems: 'center', gap: '0.75rem',
                padding: '0.625rem 0.875rem', borderRadius: '8px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Rank */}
              <span style={{ fontSize: '0.625rem', color: 'var(--text-dim)', fontFamily: 'monospace', fontWeight: 700 }}>
                #{String(i + 1).padStart(2, '0')}
              </span>
              {/* Name & location */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                  {b.primaryNeed || b.campaignCategory || 'Medicine Distribution'}
                </div>
                <div style={{ fontSize: '0.5625rem', color: 'var(--text-dim)' }}>
                  {b.village || (b.geo?.formattedAddress ? b.geo.formattedAddress.split(',')[0] : null) || b.rawLocation || b.district || 'Unknown Location'}
                </div>
              </div>
              {/* Urgency badge */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block', padding: '0.15rem 0.4rem', borderRadius: '4px',
                  background: `${sevColor}15`, border: `1px solid ${sevColor}40`,
                  fontSize: '0.625rem', fontWeight: 800, color: sevColor, fontFamily: 'monospace'
                }}>
                  URG {urgency}
                </div>
              </div>
              {/* Score badge */}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  display: 'inline-block', padding: '0.15rem 0.4rem', borderRadius: '4px',
                  background: `${gapColor}15`, border: `1px solid ${gapColor}40`,
                  fontSize: '0.625rem', fontWeight: 800, color: gapColor, fontFamily: 'monospace'
                }}>
                  SCR {b.score?.toFixed(1) || 0}
                </div>
              </div>
              {/* Score bar */}
              <div>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden', marginBottom: '0.2rem' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.score / 10) * 100}%` }}
                    transition={{ delay: i * 0.07 + 0.3, duration: 0.6 }}
                    style={{ height: '100%', background: `linear-gradient(90deg, ${sevColor}, ${gapColor})`, borderRadius: '2px' }}
                  />
                </div>
                <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', textAlign: 'right' }}>
                  score {b.score.toFixed(1)}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function MisallocationRadar({ beneficiaries, volunteers }) {
  const misallocationData = useMemo(() =>
    beneficiaries
      .map(b => ({ ...b, score: calculateBeneficiaryMisallocationScore(b, volunteers) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 7),
    [beneficiaries, volunteers]
  );

  const systemDivergenceIndex = useMemo(() => {
    if (beneficiaries.length === 0) return 0;
    const totalScore = beneficiaries.reduce((s, b) => s + calculateBeneficiaryMisallocationScore(b, volunteers), 0);
    return totalScore / beneficiaries.length;
  }, [beneficiaries, volunteers]);

  const divergenceLevel = systemDivergenceIndex >= 7 ? 'CRITICAL' : systemDivergenceIndex >= 5 ? 'HIGH' : systemDivergenceIndex >= 3 ? 'MODERATE' : 'LOW';
  const divergenceColor = systemDivergenceIndex >= 7 ? '#ef4444' : systemDivergenceIndex >= 5 ? '#f59e0b' : systemDivergenceIndex >= 3 ? '#38bdf8' : '#10b981';

  return (
    <div className="pane" style={{ padding: '1.75rem', flex: 1, minHeight: '400px', background: 'var(--bg-pane)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.625rem', margin: 0 }}>
          <Crosshair size={16} color="#ef4444" />
          Threat Matrix
        </h3>
        {/* System divergence index */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.15rem' }}>System Divergence Index</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: divergenceColor, fontFamily: 'monospace', lineHeight: 1 }}>
              {systemDivergenceIndex.toFixed(1)}
            </span>
            <span style={{
              fontSize: '0.5625rem', fontWeight: 700, color: divergenceColor,
              background: `${divergenceColor}15`, border: `1px solid ${divergenceColor}40`,
              padding: '0.15rem 0.4rem', borderRadius: '4px'
            }}>
              {divergenceLevel}
            </span>
          </div>
        </div>
      </div>

      {beneficiaries.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-dim)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Crosshair size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '0.8125rem', textAlign: 'center' }}>
            No beneficiaries detected.<br />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>System divergence nominal.</span>
          </div>
        </div>
      ) : (
        <>
          <ThreatHeatGrid beneficiaries={beneficiaries} volunteers={volunteers} />
          {misallocationData.length > 0 && <DivergenceTable data={misallocationData} />}
        </>
      )}
    </div>
  );
}
