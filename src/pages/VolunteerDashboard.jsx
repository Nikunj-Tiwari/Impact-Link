import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  MapPin, 
  Calendar, 
  User, 
  Bell, 
  Clock, 
  LogOut,
  Navigation,
  CheckCircle2
} from 'lucide-react';

// Components
import HomeTab from '../components/volunteer/HomeTab';
import AssignmentTab from '../components/volunteer/AssignmentTab';
import ScheduleTab from '../components/volunteer/ScheduleTab';
import ProfileTab from '../components/volunteer/ProfileTab';
import AlertsTab from '../components/volunteer/AlertsTab';

import useAuth from '../hooks/useAuth';
import { logout } from '../services/firebase';

export default function VolunteerDashboard() {
  const { appUser } = useAuth();
  const [activeTab, setActiveTab] = useState('home');

  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'assignment', icon: MapPin, label: 'Mission' },
    { id: 'schedule', icon: Calendar, label: 'Schedule' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <HomeTab />;
      case 'assignment': return <AssignmentTab />;
      case 'schedule': return <ScheduleTab />;
      case 'alerts': return <AlertsTab />;
      case 'profile': return <ProfileTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#000', color: '#fff',
      display: 'flex', flexDirection: 'column', paddingBottom: '90px' // Space for bottom tab bar
    }}>
      {/* Header */}
      <header style={{
        padding: '1.25rem 1.5rem', background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)',
        position: 'sticky', top: 0, zIndex: 100, display: 'flex',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--v-amber, #F59E0B), #D97706)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 700, color: '#000'
          }}>
            {appUser?.displayName?.charAt(0) || 'V'}
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{appUser?.displayName || 'Volunteer'}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Level: Specialist
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => logout()}
          style={{ 
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '0.5rem', color: 'var(--text-dim)'
          }}
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Feature Area */}
      <main style={{ flex: 1, padding: '1.5rem' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav style={{
        position: 'fixed', bottom: '1.5rem', left: '1.5rem', right: '1.5rem',
        background: 'rgba(15,15,15,0.9)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px',
        height: '72px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-around', padding: '0 0.5rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)', zIndex: 1000
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none', border: 'none', padding: '0.5rem',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.25rem', position: 'relative', width: '20%'
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-active"
                  style={{
                    position: 'absolute', inset: 0, background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '16px', zIndex: -1
                  }}
                />
              )}
              <Icon size={isActive ? 22 : 20} color={isActive ? '#F59E0B' : 'var(--text-dim)'} />
              <span style={{ 
                fontSize: '0.6rem', fontWeight: isActive ? 700 : 500,
                color: isActive ? '#F59E0B' : 'var(--text-dim)'
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
