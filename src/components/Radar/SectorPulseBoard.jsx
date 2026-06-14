import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { getBeneficiaryHubs, getBeneficiarySectorHealthStatus, getBeneficiaryUrgency } from '../../services/logic';
import { Activity, AlertTriangle, Users, TrendingUp, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react';

function AnimatedCounter({ value, decimals = 0 }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {typeof value === 'number' ? value.toFixed(decimals) : value}
    </motion.span>
  );
}

function KPICard({ icon: Icon, label, value, decimals = 0, color, subtext, pulse = false }) {
  return (
    <div style={{
      flex: 1, padding: '1.25rem 1.5rem',
      background: 'var(--bg-pane)', backdropFilter: 'blur(24px)',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderRadius: '12px', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', gap: '0.5rem'
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px',
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: `${color}15`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
        }}>
          <Icon size={14} color={color} />
        </div>
        {pulse && (
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }}
          />
        )}
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>
        <AnimatedCounter value={value} decimals={decimals} />
      </div>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
      {subtext && <div style={{ fontSize: '0.6875rem', color }}>{subtext}</div>}
    </div>
  );
}

function SeverityArc({ beneficiaries }) {
  const total = beneficiaries.length || 1;
  const buckets = useMemo(() => {
    const critical = beneficiaries.filter(b => getBeneficiaryUrgency(b) >= 8).length;
    const high     = beneficiaries.filter(b => getBeneficiaryUrgency(b) >= 6 && getBeneficiaryUrgency(b) < 8).length;
    const medium   = beneficiaries.filter(b => getBeneficiaryUrgency(b) >= 4 && getBeneficiaryUrgency(b) < 6).length;
    const low      = beneficiaries.filter(b => getBeneficiaryUrgency(b) < 4).length;
    return [
      { label: 'Critical', count: critical, color: '#ef4444', pct: critical / total },
      { label: 'High',     count: high,     color: '#f59e0b', pct: high / total },
      { label: 'Medium',   count: medium,   color: '#38bdf8', pct: medium / total },
      { label: 'Low',      count: low,      color: '#10b981', pct: low / total },
    ];
  }, [beneficiaries]);

  return (
    <div style={{ padding: '1.25rem 1.5rem', background: 'var(--bg-pane)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}>
      <div style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: '1rem' }}>
        Severity Distribution — {beneficiaries.length} Registered Beneficiaries
      </div>
      {/* Segmented bar */}
      <div style={{ height: '8px', borderRadius: '4px', display: 'flex', overflow: 'hidden', gap: '2px', marginBottom: '1rem' }}>
        {buckets.map((b, i) => (
          <motion.div
            key={b.label}
            initial={{ width: 0 }}
            animate={{ width: `${b.pct * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
            style={{ height: '100%', background: b.color, borderRadius: '2px', minWidth: b.count > 0 ? '4px' : '0px' }}
          />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {buckets.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: b.color }} />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)' }}>{b.label}</span>
            <span style={{ fontSize: '0.6875rem', color: b.color, fontWeight: 700, fontFamily: 'monospace' }}>{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SectorPulseBoard({ beneficiaries, volunteers }) {
  const totalBeneficiaries = beneficiaries.length;
  const avgUrgency         = totalBeneficiaries > 0 ? beneficiaries.reduce((s, b) => s + getBeneficiaryUrgency(b), 0) / totalBeneficiaries : 0;
  const highNeedCount      = beneficiaries.filter(b => getBeneficiaryUrgency(b) > 5).length;
  const allocatedVols      = volunteers.filter(v => v.assignmentStatus === 'assigned' || v.currentAssignmentId).length;
  const criticalCount      = beneficiaries.filter(b => getBeneficiaryUrgency(b) >= 8).length;
  const activeHubs         = getBeneficiaryHubs(beneficiaries, volunteers).slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <KPICard
          icon={AlertTriangle}
          label="Total Beneficiaries"
          value={totalBeneficiaries}
          color="#ef4444"
          subtext={criticalCount > 0 ? `${criticalCount} critical` : 'None critical'}
          pulse={criticalCount > 0}
        />
        <KPICard
          icon={TrendingUp}
          label="Avg Urgency"
          value={avgUrgency}
          decimals={1}
          color="#f59e0b"
          subtext={avgUrgency >= 7 ? 'High stress' : avgUrgency >= 5 ? 'Moderate' : 'Low stress'}
        />
        <KPICard
          icon={ShieldAlert}
          label="High Needs"
          value={highNeedCount}
          color="#a855f7"
          subtext="Beneficiaries sev > 5"
        />
        <KPICard
          icon={Users}
          label="Active Responders"
          value={allocatedVols}
          color="#10b981"
          subtext={`of ${volunteers.length} total deployed`}
        />
      </div>

      {/* Severity Arc */}
      <SeverityArc beneficiaries={beneficiaries} />

      {/* Hub Health Cards (if available) */}
      {activeHubs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          {activeHubs.slice(0, 4).map(hub => {
            const status = getBeneficiarySectorHealthStatus(beneficiaries, hub.name, volunteers);
            const StatusIcon = status.label === 'CRITICAL' ? ShieldX : status.label === 'UNSTABLE' ? ShieldAlert : ShieldCheck;
            return (
              <motion.div
                key={hub.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '1rem', borderRadius: '10px',
                  background: 'var(--bg-pane)', backdropFilter: 'blur(24px)',
                  border: `1px solid ${status.color}35`,
                  display: 'flex', flexDirection: 'column', gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                    {hub.name}
                  </span>
                  <StatusIcon size={12} color={status.color} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <motion.div
                    animate={{ scale: status.pulse ? [1, 1.4, 1] : 1, opacity: status.pulse ? [1, 0.3, 1] : 0.8 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.color, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: status.color }}>{status.label}</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${status.percentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    style={{ height: '100%', background: status.color, borderRadius: '2px' }}
                  />
                </div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)' }}>
                  {hub.count} beneficiaries · sev {hub.avgUrgency?.toFixed(1)}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
