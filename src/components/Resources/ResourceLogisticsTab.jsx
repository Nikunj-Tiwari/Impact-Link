import React, { useState } from 'react';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  Search,
  PlusCircle,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResourceLogisticsTab({ project, resources, onUpdateResource }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(null); // resourceId
  const [updateValue, setUpdateValue] = useState(0);

  const filteredResources = resources.filter(res => 
    res.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getHealthColor = (quantity) => {
    if (quantity === 0) return 'var(--danger)';
    if (quantity < 100) return 'var(--warning)';
    return 'var(--success)';
  };

  const handleUpdate = async (id) => {
    await onUpdateResource(id, { quantity: parseInt(updateValue) });
    setIsUpdating(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Stats Header */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Total Base Reserves', value: resources.reduce((acc, r) => acc + r.quantity, 0), icon: Database, color: 'var(--primary)' },
          { label: 'Critical Assets', value: resources.filter(r => r.quantity < 50).length, icon: AlertTriangle, color: 'var(--danger)' },
          { label: 'Deployment Speed', value: '4.2h', icon: TrendingUp, color: 'var(--success)' },
          { label: 'Supply Integrity', value: '98.4%', icon: ShieldCheck, color: 'var(--accent-tertiary)' }
        ].map((stat, i) => (
          <div key={i} className="pane" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{stat.label}</span>
               <stat.icon size={16} color={stat.color} style={{ opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 600, color: '#fff' }}>{stat.value}</div>
            <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', opacity: 0.03 }}>
               <stat.icon size={80} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Resource Grid */}
      <div className="pane" style={{ background: 'transparent', border: 'none', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '300px' }}>
               <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
               <input 
                 type="text" 
                 placeholder="Search assets..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '0.8125rem' }} 
               />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
               <button className="btn" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}><BarChart3 size={14} /> Analytics</button>
               <button className="btn-primary" style={{ padding: '0.5rem 1rem' }}><PlusCircle size={14} /> Register Batch</button>
            </div>
         </div>

         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {filteredResources.map((res) => (
               <motion.div 
                 key={res._id} 
                 layout
                 className="pane" 
                 style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
               >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                     <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                           <Package size={20} color="var(--primary)" />
                        </div>
                        <div>
                           <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9375rem' }}>{res.type}</div>
                           <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID: {res._id.slice(-8)}</div>
                        </div>
                     </div>
                     <div style={{ padding: '0.25rem 0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.625rem', color: 'var(--text-dim)' }}>
                        {res.location || 'Central Hub'}
                     </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
                     <div style={{ fontSize: '2.5rem', fontWeight: 700, lineHeight: 1, color: '#fff' }}>
                        {res.quantity}
                     </div>
                     <div style={{ fontSize: '0.875rem', color: 'var(--text-dim)', paddingBottom: '0.25rem' }}>
                        units available
                     </div>
                  </div>

                  <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (res.quantity / 500) * 100)}%` }}
                        style={{ height: '100%', background: getHealthColor(res.quantity) }} 
                     />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: res.quantity < 50 ? 'var(--danger)' : 'var(--success)' }}>
                        {res.quantity < 50 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
                        <span>{res.quantity < 50 ? 'Critical Reserve' : 'Operational'}</span>
                     </div>
                     
                     <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                           onClick={() => { setIsUpdating(res._id); setUpdateValue(res.quantity); }}
                           className="btn" 
                           style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.75rem' }}
                        >
                           Manage
                        </button>
                     </div>
                  </div>

                  <AnimatePresence>
                     {isUpdating === res._id && (
                        <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           style={{ overflow: 'hidden', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.03)', marginTop: '0.5rem' }}
                        >
                           <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input 
                                 type="number" 
                                 value={updateValue} 
                                 onChange={(e) => setUpdateValue(e.target.value)}
                                 style={{ flex: 1, padding: '0.4rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px', fontSize: '0.8125rem' }}
                              />
                              <button onClick={() => handleUpdate(res._id)} className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}>Save</button>
                              <button onClick={() => setIsUpdating(null)} className="btn" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8125rem' }}>Cancel</button>
                           </div>
                        </motion.div>
                     )}
                  </AnimatePresence>
               </motion.div>
            ))}
         </div>

         {filteredResources.length === 0 && (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)' }}>
               <Database size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
               <p>No records found in active logistics stream.</p>
            </div>
         )}
      </div>
    </div>
  );
}

const ShieldCheck = ({ size, color, style }) => (
   <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
     <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
     <path d="m9 12 2 2 4-4" />
   </svg>
);
