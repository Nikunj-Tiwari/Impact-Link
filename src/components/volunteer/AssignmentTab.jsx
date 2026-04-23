import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Package, 
  PhoneCall, 
  ChevronRight, 
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import useAssignment from '../../hooks/useAssignment';

export default function AssignmentTab() {
  const { assignment, loading, error, updateStatus } = useAssignment();
  
  if (loading) return <div className="p-4 text-dim">Loading assignment...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  if (!assignment || !assignment.id) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ 
          width: '80px', height: '80px', background: 'rgba(255,255,255,0.03)',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 2rem'
        }}>
          <MapPin size={32} color="var(--text-dim)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>No Active Mission</h2>
        <p style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
          We're currently scanning for local resource gaps. You'll receive a notification as soon as a mission matching your skills is available.
        </p>
      </div>
    );
  }

  const { status, details } = assignment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Real-time Map (Placeholder for Integration) */}
      <div style={{ 
        height: '240px', background: '#111', borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.08)', position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute', top: '1rem', right: '1rem', 
          background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem',
          borderRadius: '100px', fontSize: '0.7rem', display: 'flex',
          alignItems: 'center', gap: '0.5rem', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Navigation size={12} color="var(--v-amber, #F59E0B)" /> EN ROUTE TO SECTOR 4
        </div>
      </div>

      {/* Mission Meta */}
      <div style={{ padding: '0 0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {details?.title || 'Emergency Medical Distribution'}
            </h1>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
              Location: Indore Cluster Hub Alpha
            </p>
          </div>
          <div style={{ 
            padding: '0.4rem 0.8rem', background: '#F59E0B', color: '#000',
            borderRadius: '8px', fontWeight: 800, fontSize: '0.8rem'
          }}>
            PRIORITY: 9.4
          </div>
        </div>

        {/* Status Stepper */}
        <StatusStepper currentStatus={status} onUpdate={updateStatus} />

        {/* Resource Checklist */}
        <div style={{ marginTop: '2.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} /> Required Payload
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { item: 'First Aid Kits', qty: 12, unit: 'units' },
              { item: 'Oxygen Cylinders', qty: 2, unit: 'tank' },
              { item: 'Antiseptic Solution', qty: 5, unit: 'litres' }
            ].map((pkg, i) => (
              <div key={i} style={{ 
                padding: '1rem', background: 'rgba(255,255,255,0.03)',
                borderRadius: '16px', display: 'flex', justifyContent: 'space-between',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{ fontWeight: 600 }}>{pkg.item}</span>
                <span style={{ color: 'var(--text-dim)' }}>{pkg.qty} {pkg.unit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
           <button style={{ 
             flex: 1, padding: '1.25rem', borderRadius: '16px',
             background: '#fff', color: '#000', fontWeight: 700,
             border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
           }}>
             <PhoneCall size={18} /> Contact Admin
           </button>
           <button style={{ 
             padding: '1.25rem', borderRadius: '16px',
             background: 'rgba(255,255,255,0.05)', color: '#fff',
             border: '1px solid rgba(255,255,255,0.1)'
           }}>
             <Info size={20} />
           </button>
        </div>
      </div>
    </div>
  );
}

function StatusStepper({ currentStatus, onUpdate }) {
  const steps = [
    { id: 'pending_accept', label: 'Incoming', sub: 'New Mission Request' },
    { id: 'accepted', label: 'Accepted', sub: 'Preparing for Dispatch' },
    { id: 'en_route', label: 'En Route', sub: 'Navigating to Sector' },
    { id: 'on_site', label: 'On Site', sub: 'Operational in Sector' },
    { id: 'completed', label: 'Finished', sub: 'Mission Logged' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStatus);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ 
            flex: 1, height: '4px', borderRadius: '2px',
            background: i <= currentIndex ? '#F59E0B' : 'rgba(255,255,255,0.1)',
            transition: 'all 0.5s ease'
          }} />
        ))}
      </div>
      
      <div style={{ 
        background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)',
        padding: '1.25rem', borderRadius: '20px', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#F59E0B', fontWeight: 700, marginBottom: '0.25rem' }}>
            Current Status
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{steps[currentIndex]?.label}</div>
        </div>
        
        {currentIndex < steps.length - 1 && (
          <button 
            onClick={() => onUpdate(steps[currentIndex + 1].id)}
            style={{ 
              background: '#F59E0B', color: '#000', border: 'none',
              padding: '0.75rem 1.25rem', borderRadius: '12px', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            Update <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
