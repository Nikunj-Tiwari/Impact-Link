import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Map as MapIcon, 
  Trophy, 
  TrendingUp, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

export default function HomeTab() {
  const { appUser } = useAuth();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* High-Level Message */}
      <section>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
          Welcome back,
        </h2>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Strategic <span style={{ color: 'var(--v-amber, #F59E0B)' }}>Responder</span>
        </h1>
      </section>

      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <StatCard 
          icon={<TrendingUp size={20} color="#F59E0B" />} 
          label="Efficiency" 
          value="98.2%" 
          trend="+2.4%" 
        />
        <StatCard 
          icon={<Trophy size={20} color="#F59E0B" />} 
          label="Missions" 
          value={appUser?.linkedVolunteerId?.totalMissionsCompleted || 0} 
        />
      </div>

      {/* Tactical Alerts */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Tactical Region: Indore</h3>
          <span style={{ fontSize: '0.75rem', color: '#10B981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>Active</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AlertItem 
            type="high"
            title="Resource Influx"
            desc="Indore Hub Alpha reports 2.4k units medical arrived."
            time="12m ago"
          />
          <AlertItem 
            type="info"
            title="Network Update"
            desc="New strategic reallocation pass complete."
            time="1h ago"
          />
        </div>
      </section>

      {/* Profile Card */}
      <div style={{ 
        padding: '1.5rem', background: '#111', borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)', display: 'flex',
        alignItems: 'center', gap: '1rem'
      }}>
        <div style={{ 
          width: '56px', height: '56px', borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)', display: 'flex',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <ShieldAlert size={28} color="var(--text-dim)" />
        </div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontWeight: 700 }}>Operational Profile</h4>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>View your skills and ratings.</p>
        </div>
        <ChevronRight size={20} color="var(--text-dim)" />
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend }) {
  return (
    <div style={{ 
      padding: '1.25rem', background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        {icon}
        {trend && <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>{trend}</span>}
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  );
}

function AlertItem({ type, title, desc, time }) {
  return (
    <div style={{ 
      padding: '1rem', background: 'rgba(255,255,255,0.01)',
      borderLeft: `4px solid ${type === 'high' ? '#F59E0B' : '#6366F1'}`,
      borderRadius: '8px', display: 'flex', justifyContent: 'space-between'
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.2rem' }}>{title}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{desc}</div>
      </div>
      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', paddingLeft: '1rem' }}>{time}</div>
    </div>
  );
}
