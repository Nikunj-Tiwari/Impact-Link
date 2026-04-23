import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Check, Save, Loader2 } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { updateMyProfile } from '../../services/volunteerApi';

export default function ScheduleTab() {
  const { appUser, refreshUser } = useAuth();
  const [schedule, setSchedule] = useState(
    appUser?.linkedVolunteerId?.availability || {
      monday: { morning: false, afternoon: false, night: false },
      tuesday: { morning: false, afternoon: false, night: false },
      wednesday: { morning: false, afternoon: false, night: false },
      thursday: { morning: false, afternoon: false, night: false },
      friday: { morning: false, afternoon: false, night: false },
      saturday: { morning: false, afternoon: false, night: false },
      sunday: { morning: false, afternoon: false, night: false },
    }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const days = Object.keys(schedule);
  const slots = ['morning', 'afternoon', 'night'];

  const toggleSlot = (day, slot) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: !prev[day][slot]
      }
    }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMyProfile({ availability: schedule });
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save schedule:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <header>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Operational Availability</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
          Mark when you're available for localized dispatch missions.
        </p>
      </header>

      <div style={{ 
        display: 'flex', flexDirection: 'column', gap: '1rem',
        background: '#111', padding: '1.5rem', borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '0.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div />
          {slots.map(s => (
            <div key={s} style={{ 
              fontSize: '0.65rem', textTransform: 'uppercase', 
              color: 'var(--text-dim)', textAlign: 'center', fontWeight: 700 
            }}>
              {s}
            </div>
          ))}
        </div>

        {/* Day rows */}
        {days.map(day => (
          <div key={day} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: '0.5rem', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{day.slice(0,3)}</div>
            {slots.map(slot => (
              <div 
                key={slot} 
                onClick={() => toggleSlot(day, slot)}
                style={{ 
                  height: '48px', borderRadius: '12px', cursor: 'pointer',
                  background: schedule[day][slot] ? 'var(--v-amber, #F59E0B)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid',
                  borderColor: schedule[day][slot] ? 'transparent' : 'rgba(255,255,255,0.05)',
                  transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {schedule[day][slot] && <Check size={18} color="#000" />}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          width: '100%', padding: '1.25rem', borderRadius: '100px',
          background: saveSuccess ? '#10B981' : 'var(--primary)',
          color: '#fff', fontSize: '1.1rem', fontWeight: 700, border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          transition: 'all 0.3s ease'
        }}
      >
        {isSaving ? <Loader2 className="animate-spin" size={20} /> : (
          saveSuccess ? <>Schedule Locked <Check size={20} /></> : <>Update Availability <Save size={20} /></>
        )}
      </button>
    </div>
  );
}
