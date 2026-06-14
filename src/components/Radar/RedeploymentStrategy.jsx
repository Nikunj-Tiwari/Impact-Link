import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MoveRight, AlertCircle, CheckCircle2, TrendingDown, Users, Activity, BarChart2, Target } from 'lucide-react';
import { getBeneficiarySectorHealthStatus, getBeneficiaryHubs } from '../../services/logic';

const EVENT_COLORS = {
  'Medical':        '#ef4444',
  'medical':        '#ef4444',
  'Medical Crisis': '#ef4444',
  'Food':           '#f59e0b',
  'food':           '#f59e0b',
  'Food Shortage':  '#f59e0b',
  'Water':          '#38bdf8',
  'water':          '#38bdf8',
  'Flood':          '#38bdf8',
  'Infrastructure': '#a855f7',
  'infrastructure': '#a855f7',
  'Shelter':        '#6366f1',
  'shelter':        '#6366f1',
  'Evacuation Alert': '#f97316',
  'general':        '#94a3b8',
  'General':        '#94a3b8',
};

function getEventColor(type) {
  return EVENT_COLORS[type] || '#94a3b8';
}

function EventBreakdownBar({ beneficiaries }) {
  const breakdown = useMemo(() => {
    const counts = {};
    beneficiaries.forEach(b => {
      const type = b.primaryNeed || b.campaignCategory || 'Medicine Distribution';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count, pct: count / Math.max(1, beneficiaries.length) }))
      .sort((a, b) => b.count - a.count);
  }, [beneficiaries]);

  if (breakdown.length === 0) return null;

  return (
    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <BarChart2 size={12} color="var(--text-dim)" />
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Need Category Distribution
        </span>
      </div>
      {/* Stacked bar */}
      <div style={{ height: '8px', borderRadius: '4px', display: 'flex', overflow: 'hidden', gap: '2px', marginBottom: '0.875rem' }}>
        {breakdown.map((b, i) => (
          <motion.div
            key={b.type}
            initial={{ width: 0 }}
            animate={{ width: `${b.pct * 100}%` }}
            transition={{ delay: i * 0.08, duration: 0.7, ease: 'easeOut' }}
            style={{ height: '100%', background: getEventColor(b.type), borderRadius: '2px', minWidth: b.count > 0 ? '4px' : '0px' }}
          />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
        {breakdown.map(b => (
          <div key={b.type} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '1px', background: getEventColor(b.type) }} />
            <span style={{ fontSize: '0.5625rem', color: 'var(--text-dim)' }}>{b.type}</span>
            <span style={{ fontSize: '0.5625rem', color: getEventColor(b.type), fontWeight: 700, fontFamily: 'monospace' }}>{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeploymentSummary({ volunteers, beneficiaries }) {
  const allocated   = volunteers.filter(v => v.currentAssignmentId || v.assignmentStatus === 'assigned').length;
  const unallocated = volunteers.length - allocated;
  const covered     = beneficiaries.filter(b => b.assignedResponders?.length > 0 || b.allocationStatus === 'partially_saturated' || b.allocationStatus === 'saturated').length;
  const coverage    = beneficiaries.length > 0 ? (covered / beneficiaries.length) * 100 : 0;

  return (
    <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Target size={12} color="var(--text-dim)" />
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Deployment Coverage
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        {[
          { label: 'Deployed', value: allocated, color: '#10b981' },
          { label: 'Standby', value: unallocated, color: '#f59e0b' },
          { label: 'Covered', value: `${covered}/${beneficiaries.length}`, color: '#38bdf8' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '0.625rem', borderRadius: '8px', background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: s.color, fontFamily: 'monospace', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.5625rem', color: 'var(--text-dim)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>
      {/* Coverage bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.5625rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response Coverage</span>
          <span style={{ fontSize: '0.5625rem', color: coverage >= 60 ? '#10b981' : coverage >= 30 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
            {coverage.toFixed(0)}%
          </span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${coverage}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: '3px',
              background: coverage >= 60 ? 'linear-gradient(90deg, #10b981, #34d399)' : coverage >= 30 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : 'linear-gradient(90deg, #ef4444, #f87171)'
            }}
          />
        </div>
      </div>
    </div>
  );
}

function RedeploymentShifts({ beneficiaries, volunteers }) {
  const activeHubs = getBeneficiaryHubs(beneficiaries, volunteers).slice(0, 8);
  const hubStatuses = activeHubs.map(h => ({
    name: h.name,
    ...getBeneficiarySectorHealthStatus(beneficiaries, h.name, volunteers)
  }));
  const targets = hubStatuses.filter(s => s.label === 'CRITICAL' || s.label === 'UNSTABLE');
  const sources  = hubStatuses.filter(s => s.label === 'NOMINAL' || s.label === 'STABLE');
  const shifts   = targets.map((t, idx) => sources.length === 0 ? null : { target: t, source: sources[idx % sources.length] }).filter(Boolean);

  if (shifts.length === 0) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <TrendingDown size={12} color="var(--text-dim)" />
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Recommended Lateral Shifts
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {shifts.slice(0, 3).map((shift, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            style={{
              padding: '0.875rem 1rem', borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
              display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.75rem'
            }}
          >
            {/* Source */}
            <div>
              <div style={{ fontSize: '0.5rem', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Surplus</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={11} color="#10b981" />
                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{shift.source.name}</span>
              </div>
            </div>
            {/* Arrow */}
            <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <MoveRight size={16} color="rgba(255,255,255,0.3)" />
            </motion.div>
            {/* Target */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.5rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Deficit</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600 }}>{shift.target.name}</span>
                <AlertCircle size={11} color="#ef4444" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function RedeploymentStrategy({ beneficiaries, volunteers, allocationResult }) {
  const unmetCount    = allocationResult?.pass2?.criticalUnmet || 0;
  const pass1Count    = allocationResult?.pass1?.assignments || 0;
  const pass2Count    = allocationResult?.pass2?.dispatches || 0;
  const hasAllocation = allocationResult !== null;

  return (
    <div className="pane" style={{ padding: '1.75rem', background: 'var(--bg-pane)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.625rem', margin: 0 }}>
          <Activity size={16} color="#10b981" />
          Resource Flow Intelligence
        </h3>
        {hasAllocation && (
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>
            Last engine run: <span style={{ color: '#fff' }}>{pass1Count + pass2Count} assignments</span>
            {unmetCount > 0 && <span style={{ color: '#ef4444' }}> · {unmetCount} unmet</span>}
          </div>
        )}
      </div>

      {/* Allocation Engine Result Banner */}
      {hasAllocation && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '0.875rem 1.25rem', borderRadius: '10px',
            background: unmetCount > 0 ? 'rgba(245,158,11,0.06)' : 'rgba(16,185,129,0.06)',
            border: `1px solid ${unmetCount > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.25)'}`,
            display: 'flex', alignItems: 'center', gap: '0.75rem'
          }}
        >
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
            background: unmetCount > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {unmetCount > 0 ? <AlertCircle size={14} color="#f59e0b" /> : <CheckCircle2 size={14} color="#10b981" />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', marginBottom: '0.15rem' }}>
              Allocation Engine Report
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Pass 1 (Resident): <span style={{ color: '#10b981' }}>{pass1Count} assignments</span>
              {' · '}
              Pass 2 (Mobile): <span style={{ color: '#38bdf8' }}>{pass2Count} dispatches</span>
              {unmetCount > 0 && <>{' · '}<span style={{ color: '#ef4444' }}>{unmetCount} critical unmet — escalate immediately</span></>}
            </div>
          </div>
        </motion.div>
      )}

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <DeploymentSummary volunteers={volunteers} beneficiaries={beneficiaries} />
        <EventBreakdownBar beneficiaries={beneficiaries} />
      </div>

      {/* Redeployment shifts */}
      <RedeploymentShifts beneficiaries={beneficiaries} volunteers={volunteers} />

      {/* Empty state when all balanced and no allocation */}
      {!hasAllocation && beneficiaries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)', fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          System state balanced. No beneficiaries to analyze.
        </div>
      )}
    </div>
  );
}
