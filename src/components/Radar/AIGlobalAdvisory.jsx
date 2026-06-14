import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Terminal, RefreshCw, ChevronRight } from 'lucide-react';
import { getGlobalStrategicAdvice } from '../../services/gemini';

export default function AIGlobalAdvisory({ incidents }) {
  const [advice, setAdvice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const initiateScan = async () => {
    setIsScanning(true);
    try {
      const result = await getGlobalStrategicAdvice(incidents);
      setAdvice(result);
    } catch (error) {
      const msg = error?.message || '';
      if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota') || msg.includes('rate-limited')) {
        setAdvice("Network Scan Paused.\\nFree tier API rate limit reached. Please wait 5 minutes before rescanning.");
      } else {
        setAdvice("Strategic layer offline. Please check API configuration.");
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="pane" style={{ padding: '2rem', flex: 1, minHeight: '350px', display: 'flex', flexDirection: 'column', background: 'linear-gradient(135deg, rgba(20,20,20,0.8) 0%, rgba(10,10,10,0.95) 100%)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Cpu size={16} color="var(--success)" /> Strategic Advisory Matrix
        </h3>
        <button 
          className="btn" 
          onClick={initiateScan} 
          disabled={isScanning}
          style={{ border: '1px solid var(--border-strong)', fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
        >
          {isScanning ? <RefreshCw size={12} className="spinning" /> : <Zap size={12} />} 
          {isScanning ? 'Scanning...' : 'Initiate Scan'}
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {!advice && !isScanning ? (
            <motion.div 
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}
            >
              <Terminal size={32} color="rgba(255,255,255,0.05)" />
              <span style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>Awaiting tactical data stream...</span>
            </motion.div>
          ) : isScanning ? (
            <motion.div 
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}
            >
               <div style={{ position: 'relative' }}>
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    style={{ width: '80px', height: '80px', borderRadius: '50%', border: '1px solid var(--border-subtle)', borderTopColor: 'var(--success)' }}
                  />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    <Zap size={24} color="var(--success)" />
                  </div>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                 <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>ORCHESTRATING DATA</span>
                 <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>Analyzing {incidents.length} active misallocation hotspots...</span>
               </div>
            </motion.div>
          ) : (
            <motion.div 
              key="advice"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="terminal-text"
              style={{ fontSize: '0.875rem', lineHeight: '1.6', color: 'var(--text-muted)', overflowY: 'auto', maxHeight: '250px', paddingRight: '1rem' }}
            >
              {advice.split('\n').map((line, idx) => (
                <div key={idx} style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
                  <ChevronRight size={14} color="var(--success)" style={{ marginTop: '4px', flexShrink: 0 }} />
                  <p>{line}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
