import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Map as MapIcon, 
  Zap, 
  Users, 
  FileSearch, 
  Settings,
  Plus,
  Cpu,
  MoreHorizontal,
  ChevronRight,
  Crosshair,
  BarChart2,
  LogOut,
  User,
  HandHeart,
  ShieldCheck,
  Radar,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import BeneficiaryModal from '../components/Modals/BeneficiaryModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ImpactSimulator from '../components/Simulator/ImpactSimulator';
import ActionCenter from '../components/ActionCenter/ActionCenter';
import KineticMap from '../components/Map/KineticMap';
import SectorPulseBoard from '../components/Radar/SectorPulseBoard';
import MisallocationRadar from '../components/Radar/MisallocationRadar';
import AIGlobalAdvisory from '../components/Radar/AIGlobalAdvisory';
import RedeploymentStrategy from '../components/Radar/RedeploymentStrategy';
import NewIncidentModal from '../components/Modals/NewIncidentModal';
import WorkspaceModal from '../components/Modals/WorkspaceModal';
import { extractDataFromReport } from '../services/gemini';
import { getSectorHealthStatus } from '../services/logic';
import { logout } from '../services/firebase';
import { resolveCoordinates } from '../services/coordinates';
import * as api from '../services/api';
import { dbscan, aggregateClusters } from '../services/clustering';

/**
 * Utility: Format a date to relative time string
 */
function timeAgo(dateStr) {
  if (!dateStr) return 'just now';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const [incidents, setIncidents] = useState([]);
  const [activeDispatches, setActiveDispatches] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [clusters, setClusters] = useState({ points: [], hotspots: [] });
  const [isIngesting, setIsIngesting] = useState(false);
  const [isNewIncidentOpen, setIsNewIncidentOpen] = useState(false);
  const [isBeneficiaryOpen, setIsBeneficiaryOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [incData, benData, cluData, volData] = await Promise.allSettled([
        api.fetchIncidents(),
        api.fetchBeneficiaries(),
        api.fetchClusters(),
        api.fetchVolunteers()
      ]);
      if (incData.status === 'fulfilled') setIncidents(incData.value);
      if (benData.status === 'fulfilled') setBeneficiaries(benData.value);
      if (cluData.status === 'fulfilled') {
        const val = cluData.value;
        if (Array.isArray(val)) {
          setClusters({ points: val, hotspots: [] });
        } else {
          setClusters(val);
        }
      }
      if (volData.status === 'fulfilled') setVolunteers(volData.value);
    } catch (error) {
      console.error("Data loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Computed metrics
  const allocationEfficiency = useMemo(() => {
    if (incidents.length === 0) return 100;
    const totalGap = incidents.reduce((sum, inc) => sum + (inc.resourceGap || 5), 0);
    const maxGap = incidents.length * 10;
    return (((maxGap - totalGap) / maxGap) * 100).toFixed(1);
  }, [incidents]);

  // Reactive Strategic Clustering (separate from heatmap)
  const strategicClusters = useMemo(() => {
    if (incidents.length === 0) return { points: [], hotspots: [] };
    // Increased EPS to 1.5 for broader state-level clustering
    // Increased minSamples to 3 to ignore low-density outliers
    const labels = dbscan(incidents, 1.5, 3); 
    return aggregateClusters(incidents, labels);
  }, [incidents]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleCreateIncident = async (newInc) => {
    try {
      const savedIncident = await api.createIncident(newInc);
      setIncidents(prev => [savedIncident, ...prev]);
    } catch (error) {
      console.error("Failed to save new incident:", error);
    }
  };

  const handleCreateBeneficiary = async (data) => {
    try {
      const saved = await api.createBeneficiary(data);
      setBeneficiaries(prev => [saved, ...prev]);
    } catch (error) {
      console.error("Failed to save beneficiary:", error);
    }
  };

  const handleDispatch = async (incidentId, volunteerCount) => {
    const dispatchId = Date.now();
    setActiveDispatches(prev => [...prev, { id: dispatchId, targetId: incidentId, volunteers: volunteerCount }]);
    
    const targetIncident = incidents.find(i => i._id === incidentId || i.id === incidentId);
    if (!targetIncident) return;

    const updatedData = {
      resourceGap: Math.max(1, targetIncident.resourceGap - (volunteerCount * 1.5)),
      severity: Math.max(1, targetIncident.severity - 4)
    };

    setTimeout(async () => {
      setActiveDispatches(prev => prev.filter(d => d.id !== dispatchId));
      try {
        const saved = await api.patchIncident(targetIncident._id || incidentId, updatedData);
        setIncidents(prev => prev.map(inc => (inc._id === (saved._id || incidentId) ? saved : inc)));
      } catch (error) {
        console.error("Dispatch update failed:", error);
      }
    }, 1400);
  };

  const handleIngestion = async (data) => {
    const coords = resolveCoordinates(data.location);
    const newIncident = {
      ...data,
      title: `${data.needType} - ${data.location}`,
      eventType: data.needType,
      type: data.severity > 8 ? 'Critical' : 'Alert',
      lat: coords.lat,
      lng: coords.lng
    };
    
    try {
      const savedIncident = await api.createIncident(newIncident);
      setIncidents(prev => [savedIncident, ...prev]);
      setActiveTab('overview');
    } catch (error) {
      console.error("Failed to save ingested incident:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}>
           <div style={{ width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 20px #fff' }} />
        </motion.div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', icon: Activity, label: 'Overview' },
    { id: 'analysis', icon: Crosshair, label: 'Threat Radar' },
    { id: 'ai_radar', icon: Zap, label: 'AI Insights' },
    { id: 'ingestion', icon: FileSearch, label: 'Data Ingestion' },
    { id: 'beneficiaries', icon: Users, label: 'Beneficiaries' },
    { id: 'volunteers', icon: HandHeart, label: 'Responders' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ 
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 2rem',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        height: '3.5rem',
        background: 'var(--bg-main)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div 
            onClick={() => window.location.href = '/'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#fff', cursor: 'pointer' }}
          >
            <div style={{ width: '14px', height: '14px', background: 'linear-gradient(135deg, #fff 0%, #666 100%)', borderRadius: '3px' }} />
            ImpactLink
          </div>
          
          <nav style={{ display: 'flex', gap: '0.25rem' }}>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="btn"
                style={{
                  color: activeTab === item.id ? '#fff' : 'var(--text-muted)',
                  background: activeTab === item.id ? 'var(--border-subtle)' : 'transparent',
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8125rem'
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn" 
            onClick={() => setIsWorkspaceOpen(true)}
            style={{ fontSize: '0.8125rem' }}
          >
            <Settings size={14} /> Workspace
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setIsNewIncidentOpen(true)}
            style={{ fontSize: '0.8125rem', padding: '0.35rem 0.75rem' }}
          >
            <Plus size={14} /> New Incident
          </button>
          <button 
            className="btn" 
            onClick={() => setIsBeneficiaryOpen(true)}
            style={{ fontSize: '0.8125rem', background: 'rgba(255,255,255,0.05)' }}
          >
            <User size={14} /> + Record
          </button>
          <button 
            className="btn" 
            onClick={handleLogout}
            style={{ fontSize: '0.8125rem', color: 'var(--error)' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '3rem 4rem', position: 'relative' }}>
        <div className="radial-glow" style={{ top: '-10%', left: '20%' }} />
        
        <div style={{ marginBottom: '4rem', maxWidth: '800px', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-subtle)', borderRadius: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
             <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
             Gemini 1.5 Flash Engine is Active
          </div>
          <h1 className="hero-title">Extreme Orchestration for Smart Resource Allocation</h1>
          <p className="hero-subtitle">Aggregating scattered NGO data. Eliminating misallocation through AI-driven visibility.</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{ width: '100%', maxWidth: '1400px', alignSelf: 'center', flex: 1 }}
          >
            {activeTab === 'overview' && (
              <OverviewTab 
                incidents={incidents} 
                setIncidents={setIncidents} 
                activeDispatches={activeDispatches} 
                setActiveDispatches={setActiveDispatches} 
                clusters={strategicClusters} 
                onDispatch={handleDispatch}
                allocationEfficiency={allocationEfficiency}
              />
            )}
            {activeTab === 'analysis' && <AnalysisTab incidents={incidents} />}
            {activeTab === 'ai_radar' && <AIRadarTab clusters={clusters} incidents={incidents} />}
            {activeTab === 'beneficiaries' && <BeneficiariesTab beneficiaries={beneficiaries} onView={(b) => {
              setSelectedBeneficiary(b);
              setIsViewOpen(true);
            }} />}
            {activeTab === 'volunteers' && <VolunteersTab volunteers={volunteers} />}
            {activeTab === 'ingestion' && <IngestionTab onIngest={handleIngestion} isIngesting={isIngesting} setIsIngesting={setIsIngesting} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <NewIncidentModal 
        isOpen={isNewIncidentOpen} 
        onClose={() => setIsNewIncidentOpen(false)} 
        onAdd={handleCreateIncident} 
      />

      <BeneficiaryModal
        isOpen={isBeneficiaryOpen}
        onClose={() => setIsBeneficiaryOpen(false)}
        onAdd={handleCreateBeneficiary}
      />

      <BeneficiaryModal 
        isOpen={isViewOpen} 
        onClose={() => {
          setIsViewOpen(false);
          setSelectedBeneficiary(null);
        }} 
        mode="VIEW"
        initialData={selectedBeneficiary}
      />

      <WorkspaceModal 
        isOpen={isWorkspaceOpen} 
        onClose={() => setIsWorkspaceOpen(false)}
        onReset={() => {
          setIncidents([]);
          setIsWorkspaceOpen(false);
        }}
        onScenario={(id) => {
          const scenarioData = {
            flood: [
              { id: 101, title: 'Flash Flood - Wayanad, Kerala', location: 'Kerala', needType: 'Water', severity: 9, resourceGap: 8, frequency: 7, timeSensitivity: 9, lat: 11.6050, lng: 76.0828 },
              { id: 102, title: 'Brahmaputra Overflow - Assam', location: 'Assam', needType: 'Medical', severity: 7, resourceGap: 9, frequency: 5, timeSensitivity: 8, lat: 26.2006, lng: 92.9376 }
            ],
            earthquake: [
              { id: 201, title: 'Structural Collapse - Delhi NCR', location: 'Delhi', needType: 'Infrastructure', severity: 10, resourceGap: 10, frequency: 9, timeSensitivity: 10, lat: 28.6139, lng: 77.2090 },
              { id: 202, title: 'Casualties - Bhuj Region', location: 'Gujarat', needType: 'Medical', severity: 9, resourceGap: 8, frequency: 8, timeSensitivity: 10, lat: 23.2420, lng: 69.6669 }
            ],
            conflict: [
              { id: 301, title: 'IDP Movement - Jammu Border', location: 'J&K', needType: 'Food', severity: 8, resourceGap: 9, frequency: 8, timeSensitivity: 7, lat: 32.7330, lng: 74.8643 }
            ]
          };
          setIncidents(scenarioData[id] || []);
        }}
      />
    </div>
  );
}

function OverviewTab({ incidents, activeDispatches, setIncidents, setActiveDispatches, clusters, onDispatch, allocationEfficiency }) {
  const [selectedIncident, setSelectedIncident] = useState(null);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1px', background: 'var(--border-subtle)', border: '1px solid var(--border-subtle)', borderRadius: '8px', overflow: 'hidden' }}>
      <div className="pane" style={{ gridColumn: 'span 12', display: 'flex', gap: '4rem', padding: '1.5rem 2rem', alignItems: 'center' }}>
        <div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Active Incidents</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 500, color: '#fff' }}>{incidents.length}</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Visibility Index</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 500, color: '#fff' }}>
            {(() => {
              const sectors = ['Sector 1', 'Sector 2', 'Sector 3', 'Sector 4', 'Sector 5', 'Sector 6', 'Sector 7', 'Sector 8'];
              const stableSectors = sectors.filter(s => {
                const status = getSectorHealthStatus(incidents, s);
                return status.label === 'STABLE' || status.label === 'NOMINAL';
              }).length;
              const ratio = (stableSectors / sectors.length) * 100;
              return ratio.toFixed(0);
            })()}% 
            <span style={{ fontSize: '0.875rem', color: 'var(--success)' }}> NOMINAL</span>
          </div>
        </div>
        <div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Allocation Efficiency</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 500, color: '#fff' }}>{allocationEfficiency}%</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
           <button className="btn" style={{ border: '1px solid var(--border-strong)' }}><BarChart2 size={14} /> Full Report</button>
        </div>
      </div>

      <div className="pane" style={{ gridColumn: 'span 8', minHeight: '450px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div className="pane-header">
           <MapIcon size={14} /> Live Resource Allocation Network
        </div>
        <KineticMap 
          incidents={incidents} 
          selectedIncident={selectedIncident} 
          activeDispatches={activeDispatches} 
          clusters={clusters}
        />
      </div>

      <div className="pane" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {!selectedIncident ? (
          <>
            <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={14} /> Priority Queue</div>
               <MoreHorizontal size={14} color="var(--text-dim)" />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', margin: '0 -2rem', maxHeight: '450px', overflowY: 'auto' }}>
              {incidents
                .map(inc => ({
                  ...inc,
                  score: (inc.severity * 0.4 + inc.frequency * 0.2 + inc.resourceGap * 0.3 + inc.timeSensitivity * 0.1)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 50)
                .map((alert, idx) => {
                  const score = alert.score.toFixed(1);
                  const isCritical = alert.score > 8;
                  return (
                    <div key={alert._id || alert.id} 
                      onClick={() => setSelectedIncident(alert)}
                      style={{ 
                        padding: '1rem 2rem', 
                        background: 'transparent',
                        borderBottom: '1px solid var(--border-subtle)',
                        borderTop: idx === 0 ? '1px solid var(--border-subtle)' : 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-pane-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           {isCritical && (
                             <motion.div 
                               animate={{ opacity: [0.4, 1, 0.4] }} 
                               transition={{ duration: 1.2, repeat: Infinity }}
                               style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 6px var(--danger)' }} 
                             />
                           )}
                           {alert.title}
                        </span>
                        <span style={{ color: isCritical ? '#fff' : 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'monospace' }}>{score}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{timeAgo(alert.createdAt)}</span>
                         <ChevronRight size={14} color="var(--text-dim)" />
                      </div>
                    </div>
                  )
                })}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '550px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8125rem' }} onClick={() => setSelectedIncident(null)}>
              <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Back to Queue
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem', color: '#fff' }}>{selectedIncident.title}</h3>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8125rem', marginBottom: '2rem' }}>Priority ID: IMP-{selectedIncident._id?.slice(-6) || selectedIncident.id}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
               <ImpactSimulator incident={selectedIncident} />
               <ActionCenter incident={selectedIncident} onDispatch={onDispatch} />
            </div>
          </div>
        )}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)', marginTop: 'auto' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '1rem' }}>
              <Cpu size={10} color="var(--success)" /> Live AI Ingestion Feed
           </div>
           <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { time: '14:02', msg: 'Gemini structured paper survey from Sector 4' },
                { time: '14:03', msg: 'Divergence detected in Medical Supply vs Need' },
                { time: '14:05', msg: 'Lateral shift recommended: Sector 2 → Sector 5' }
              ].map((log, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                   <span style={{ color: 'var(--text-dim)', fontFamily: 'monospace' }}>[{log.time}]</span>
                   <span style={{ color: idx === 0 ? '#fff' : 'rgba(255,255,255,0.4)' }}>{log.msg}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisTab({ incidents }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
       <div style={{ padding: '0 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }} />
          Multi-Sector Intelligence Synchronized
       </div>
       <SectorPulseBoard incidents={incidents} />
       <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
          <MisallocationRadar incidents={incidents} />
          <AIGlobalAdvisory incidents={incidents} />
       </div>
       <RedeploymentStrategy incidents={incidents} />
    </div>
  );
}

function IngestionTab({ onIngest, isIngesting, setIsIngesting }) {
  const [isSuccess, setIsSuccess] = useState(false);
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsIngesting(true);
    setIsSuccess(false);
    try {
      const extractedData = await extractDataFromReport(file);
      if (extractedData) {
        setIsSuccess(true);
        setTimeout(() => onIngest(extractedData), 1200);
      }
    } catch (error) {
      console.error("Ingestion failed:", error);
      alert("AI Extraction failed. Please ensure your API key is valid.");
    } finally {
      setIsIngesting(false);
    }
  };
  return (
    <div className="pane" style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '6rem 2rem' }}>
      <div style={{ width: '48px', height: '48px', border: '1px solid var(--border-strong)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem auto', background: 'var(--bg-pane)' }}>
         <FileSearch size={20} color="#fff" />
      </div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Scattered Data Ingestion</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '3rem' }}>Upload paper surveys, field notes, or unstructured NGO reports. Gemini structures the chaos.</p>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <input type="file" accept="image/*" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} disabled={isIngesting} />
        <button className="btn btn-primary" style={{ padding: '0.75rem 2rem', background: isSuccess ? 'var(--success)' : undefined, borderColor: isSuccess ? 'var(--success)' : undefined }} disabled={isIngesting || isSuccess}>
           {isIngesting ? <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1 }}>Analyzing Report...</motion.div> : isSuccess ? <motion.div animate={{ scale: [1, 1.1, 1] }}>Extracted Successfully</motion.div> : 'Select Field Report'}
        </button>
      </div>
      {isIngesting && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '2rem', color: 'var(--text-dim)', fontSize: '0.8125rem' }}>Connecting to Gemini 1.5 Flash Vision Layer...</motion.div>}
      {isSuccess && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: '2rem', color: 'var(--success)', fontSize: '0.8125rem' }}>Incident parsed. Redirecting to Command Center...</motion.div>}
    </div>
  );
}

function AIRadarTab({ clusters, incidents }) {
  const hotspots = clusters.hotspots || [];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      <div className="pane">
        <div className="pane-header"><Radar size={14} /> AI Cluster Analysis [DBSCAN]</div>
        <div style={{ padding: '2rem' }}>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', marginBottom: '2rem' }}>
            Machine learning has identified {hotspots.length} high-density clusters of misallocated resources.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hotspots.slice(0, 5).map((c, i) => (
               <div key={i} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#fff' }}>Hotspot Cluster #{c.cluster}</span>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--error)' }}>Intensity: {c.avgSeverity?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Centroid: {c.lat?.toFixed(4)}, {c.lng?.toFixed(4)} ({c.count} incidents)</div>
               </div>
            ))}
          </div>
        </div>
      </div>
      <div className="pane" style={{ background: 'linear-gradient(180deg, var(--bg-pane) 0%, rgba(20,20,20,0.8) 100%)' }}>
          <div className="pane-header"><Zap size={14} /> Anomaly Detection</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '4rem', textAlign: 'center' }}>
             <ShieldCheck size={48} color="var(--success)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
             <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Network Integrity Optimal</h3>
             <p style={{ color: 'var(--text-dim)', fontSize: '0.8125rem' }}>No significant spatial anomalies detected outside of known clusters in the current time-window.</p>
          </div>
      </div>
    </div>
  );
}

function BeneficiariesTab({ beneficiaries = [], onView }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState('ALL');
  const itemsPerPage = 15;

  // 1. Filtering Logic (Memoized)
  const filteredItems = useMemo(() => {
    if (!beneficiaries) return [];
    return beneficiaries.filter(b => {
      if (!b) return false;
      const firstName = b.firstName || '';
      const lastName = b.lastName || '';
      const full = (firstName + ' ' + lastName).toLowerCase();
      const aadhar = b.aadharMasked || '';
      
      const matchesSearch = full.includes(searchTerm.toLowerCase()) || aadhar.includes(searchTerm);
      const matchesGender = genderFilter === 'ALL' || b.gender === genderFilter;
      return matchesSearch && matchesGender;
    });
  }, [beneficiaries, searchTerm, genderFilter]);

  // 2. Reset back to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, genderFilter]);

  // 3. Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Jump Input State
  const [jumpVal, setJumpVal] = useState('');
  const [activeJump, setActiveJump] = useState(null); // 'top' | 'bottom' | null

  const getRange = () => {
    const delta = 2; // Window size
    const range = [];
    const left = currentPage - delta;
    const right = currentPage + delta + 1;
    
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i < right)) {
        range.push(i);
      }
    }

    const finalRange = [];
    let l;
    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          finalRange.push(l + 1);
        } else if (i - l !== 1) {
          finalRange.push('...');
        }
      }
      finalRange.push(i);
      l = i;
    }
    return finalRange;
  };

  const handleJump = (e) => {
    if (e.key === 'Enter') {
      const p = parseInt(jumpVal);
      if (p >= 1 && p <= totalPages) {
        setCurrentPage(p);
        setActiveJump(null);
        setJumpVal('');
      }
    } else if (e.key === 'Escape') {
      setActiveJump(null);
      setJumpVal('');
    }
  };

  const renderPagination = (pos) => (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      <button className="btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: currentPage === 1 ? 0.3 : 1 }}>Prev</button>
      
      {getRange().map((n, idx) => {
        if (n === '...') {
          const jumpId = `${pos}-${idx}`;
          const isThisJumping = activeJump === jumpId;
          return isThisJumping ? (
            <input 
              key={`jump-input-${jumpId}`}
              type="text"
              autoFocus
              placeholder="Pg"
              value={jumpVal}
              onChange={(e) => setJumpVal(e.target.value)}
              onKeyDown={handleJump}
              onBlur={() => {
                setTimeout(() => setActiveJump(null), 200);
              }}
              style={{ width: '40px', background: 'rgba(255,255,255,0.1)', border: '1px solid var(--accent-primary)', color: '#fff', fontSize: '0.75rem', padding: '0.2rem', textAlign: 'center', borderRadius: '4px' }}
            />
          ) : (
            <span 
              key={`dots-${jumpId}`} 
              onClick={() => {
                setActiveJump(jumpId);
                setJumpVal('');
              }}
              style={{ color: 'var(--text-dim)', fontSize: '0.75rem', cursor: 'pointer', padding: '0 0.5rem', userSelect: 'none' }}
              title="Click to jump to page"
            >...</span>
          );
        }
        return (
          <button 
            key={`page-${n}`} 
            onClick={() => setCurrentPage(n)}
            className="btn"
            style={{ 
              padding: '0.3rem 0.6rem', 
              fontSize: '0.75rem', 
              background: currentPage === n ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
              border: currentPage === n ? 'none' : '1px solid var(--border-subtle)',
              color: currentPage === n ? '#000' : '#fff'
            }}
          >
            {n}
          </button>
        );
      })}

      <button className="btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: currentPage === totalPages ? 0.3 : 1 }}>Next</button>
    </div>
  );

  return (
    <div className="pane">
      <div className="pane-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users size={14}/> Normalized Beneficiary Directory</div>
        
        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
           <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
             <Search size={12} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dim)' }} />
             <input 
                type="text" 
                placeholder="Search name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-strong)', borderRadius: '4px', padding: '0.4rem 1rem 0.4rem 2rem', color: '#fff', fontSize: '0.75rem', minWidth: '180px' }}
             />
           </div>
           
           <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
             <Filter size={12} style={{ position: 'absolute', left: '0.75rem', color: 'var(--text-dim)' }} />
             <select 
               value={genderFilter} 
               onChange={(e) => setGenderFilter(e.target.value)}
               style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-strong)', borderRadius: '4px', padding: '0.4rem 1rem 0.4rem 2rem', color: '#fff', fontSize: '0.75rem', appearance: 'none', cursor: 'pointer' }}
             >
               <option value="ALL">All Genders</option>
               <option value="M">Male</option>
               <option value="F">Female</option>
               <option value="O">Other</option>
             </select>
           </div>

           {renderPagination('top')}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-strong)', textAlign: 'left', color: 'var(--text-dim)' }}>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Name</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Age/Gender</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Location</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>ID (Aadhaar)</th>
              <th style={{ padding: '1rem', fontWeight: 500 }}>Registration</th>
              <th style={{ padding: '1rem', fontWeight: 500, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? currentItems.map(b => (
              <tr key={b._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '1rem', color: '#fff' }}>{b.firstName} {b.lastName}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{b.age} / {b.gender}</td>
                <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{b.locationId?.name || 'Unknown Hub'}</td>
                <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'var(--success)' }}>XXXX-XXXX-{b.aadharMasked}</td>
                <td style={{ padding: '1rem', color: 'var(--text-dim)' }}>{new Date(b.registeredAt).toLocaleDateString()}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button 
                    onClick={() => onView(b)}
                    className="btn-icon" 
                    title="View Profile" 
                    style={{ background: 'rgba(0, 191, 255, 0.1)', border: '1px solid rgba(0, 191, 255, 0.2)' }}
                  >
                    <Eye size={14} color="var(--accent-primary)" />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <Search size={32} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                  <div>No matching beneficiary records found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div style={{ padding: '1.5rem', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)' }}>
        {renderPagination('bottom')}
      </div>
    </div>
  );
}

function VolunteersTab({ volunteers }) {
  return (
    <div className="pane" style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px' }}>
      <div className="pane-header" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><HandHeart size={14}/> Live Responder Network</div>
        <button className="btn" style={{ border: '1px solid var(--border-strong)', fontSize: '0.75rem' }}>Onboard</button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-strong)', textAlign: 'left', color: 'var(--text-dim)' }}>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Name</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Status</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Assigned Location</th>
            <th style={{ padding: '1rem', fontWeight: 500 }}>Capabilities</th>
          </tr>
        </thead>
        <tbody>
          {volunteers?.map(v => (
            <tr key={v._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <td style={{ padding: '1rem', color: '#fff' }}>{v.name}</td>
              <td style={{ padding: '1rem' }}><div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: v.status === 'Deployed' ? '#34d399' : '#fff' }}><div style={{ width: '4px', height: '4px', background: v.status === 'Deployed' ? '#34d399' : '#fff', borderRadius: '50%' }}/> {v.status}</div></td>
              <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{v.locationId?.name || 'Unassigned'}</td>
              <td style={{ padding: '1rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>{v.skills?.join(', ') || 'Generalist'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
