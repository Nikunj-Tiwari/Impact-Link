import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  MapPin, 
  MessageSquare, 
  Zap,
  Info
} from 'lucide-react';

export default function AlertsTab() {
  const alerts = [
    { 
      id: 1, 
      type: 'assignment', 
      title: 'New Mission Opportunity', 
      msg: 'Medical supply run available in Sector 7. 4.2km from you.',
      time: 'Just now',
      read: false
    },
    { 
      id: 2, 
      type: 'update', 
      title: 'Strategic Pass Complete', 
      msg: 'Allocation engine updated localized priority scores.',
      time: '45m ago',
      read: true
    },
    { 
      id: 3, 
      type: 'system', 
      title: 'Weather Warning', 
      msg: 'Heavy rain expected in Sector 2. Exercise caution during delivery.',
      time: '2h ago',
      read: true
    },
    { 
      id: 4, 
      type: 'message', 
      title: 'Admin Broadcast', 
      msg: 'Indore Hub Alpha is running low on Water Units. Prioritize transport if available.',
      time: '4h ago',
      read: true
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Tactical Alerts</h1>
        <Settings size={20} color="var(--text-dim)" />
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {alerts.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ 
              padding: '1.25rem', background: '#111', borderRadius: '20px',
              border: '1px solid',
              borderColor: alert.read ? 'rgba(255,255,255,0.05)' : 'rgba(245, 158, 11, 0.2)',
              display: 'flex', gap: '1.25rem', position: 'relative'
            }}
          >
            {!alert.read && (
              <div style={{ 
                position: 'absolute', top: '1.25rem', right: '1.25rem',
                width: '8px', height: '8px', background: '#F59E0B', borderRadius: '50%'
              }} />
            )}
            
            <div style={{ 
              width: '44px', height: '44px', borderRadius: '12px',
              background: getAlertColor(alert.type, 'bg'),
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {getAlertIcon(alert.type)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{alert.title}</h4>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{alert.time}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
                {alert.msg}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getAlertIcon(type) {
  switch (type) {
    case 'assignment': return <MapPin size={20} color="#F59E0B" />;
    case 'update': return <Zap size={20} color="#818CF8" />;
    case 'system': return <Info size={20} color="#F87171" />;
    case 'message': return <MessageSquare size={20} color="#10B981" />;
    default: return <Bell size={20} color="#fff" />;
  }
}

function getAlertColor(type, target) {
  const colors = {
    assignment: { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B' },
    update: { bg: 'rgba(129, 140, 248, 0.1)', text: '#818CF8' },
    system: { bg: 'rgba(248, 113, 113, 0.1)', text: '#F87171' },
    message: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981' }
  };
  return colors[type]?.[target] || 'rgba(255,255,255,0.05)';
}
