import React, { useState, useMemo } from 'react';
import Modal from '../Common/Modal';
import { 
  FileText, Download, Users, Target, Activity, Shield, 
  Truck, MapPin, BarChart3, Clock, Loader2, CheckCircle2
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Tiny CSS bar chart ────────────────────────────────────────────────────────
const MiniBar = ({ label, value, max, color }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', width: '80px', flexShrink: 0, textTransform: 'capitalize' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '3px', transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', width: '28px', textAlign: 'right' }}>{value}</span>
    </div>
  );
};

// ── Donut Ring ────────────────────────────────────────────────────────────────
const DonutRing = ({ percentage, color = '#6366f1', size = 72 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" 
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" 
        fill="#fff" fontSize="14" fontWeight="700" style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>
        {percentage}%
      </text>
    </svg>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, sub, color = '#6366f1', children }) => (
  <div style={{
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ 
        width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}18`, color 
      }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
    </div>
    {value !== undefined && (
      <div>
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginLeft: '0.5rem' }}>{sub}</span>}
      </div>
    )}
    {children}
  </div>
);

export default function WorkspaceModal({ isOpen, onClose, currentProject, beneficiaries = [], volunteers = [], supplies = [], allocationResult }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  // ── Computed KPIs ─────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const severityCounts = { high: 0, medium: 0, low: 0 };
    const genderCounts = {};
    const needCounts = {};
    const locationCounts = {};

    beneficiaries.forEach(b => {
      severityCounts[b.needSeverity || 'medium']++;
      const g = b.gender || 'unknown';
      genderCounts[g] = (genderCounts[g] || 0) + 1;
      const n = b.primaryNeed || 'Unspecified';
      needCounts[n] = (needCounts[n] || 0) + 1;
      const loc = b.state || b.district || 'Unknown';
      locationCounts[loc] = (locationCounts[loc] || 0) + 1;
    });

    const statusCounts = { Active: 0, Deployed: 0, Inactive: 0 };
    const skillCounts = {};
    const vehicleCounts = {};
    let assigned = 0;

    volunteers.forEach(v => {
      statusCounts[v.status || 'Active']++;
      if (v.assignmentStatus && v.assignmentStatus !== 'unassigned') assigned++;
      (v.skills || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
      const vt = v.vehicleType || 'none';
      vehicleCounts[vt] = (vehicleCounts[vt] || 0) + 1;
    });

    const allocationPct = volunteers.length > 0 ? Math.round((assigned / volunteers.length) * 100) : 0;

    return { severityCounts, genderCounts, needCounts, locationCounts, statusCounts, skillCounts, vehicleCounts, assigned, allocationPct };
  }, [beneficiaries, volunteers]);

  // ── PDF Generator ─────────────────────────────────────────────────────────
  const generatePDF = async () => {
    setIsGenerating(true);
    setGenerated(false);

    // Give the UI a tick to show the spinner
    await new Promise(r => setTimeout(r, 100));

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      let y = 15;

      // ── Header ──────────────────────────────────────────────────────────
      doc.setFillColor(15, 15, 25);
      doc.rect(0, 0, pageW, 40, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text('ImpactLink Situation Report', 14, y + 10);
      doc.setFontSize(10);
      doc.setTextColor(180, 180, 200);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y + 18);
      doc.text(`Project: ${currentProject?.name || 'N/A'}`, 14, y + 24);
      y = 48;

      // ── Project Overview ────────────────────────────────────────────────
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('Project Overview', 14, y);
      y += 8;
      autoTable(doc, {
        startY: y,
        head: [['Property', 'Value']],
        body: [
          ['Name', currentProject?.name || 'N/A'],
          ['Scope', currentProject?.scope || 'N/A'],
          ['Priority', currentProject?.metadata?.priority || 'Medium'],
          ['Operating Mode', currentProject?.operatingMode || 'manual'],
          ['Allocation Strategy', currentProject?.allocationStrategy || 'ai'],
          ['Regions', (currentProject?.regions || []).map(r => r.name || 'Unnamed').join(', ') || 'None'],
          ['Start Date', currentProject?.timeline?.startDate ? new Date(currentProject.timeline.startDate).toLocaleDateString() : 'N/A'],
          ['End Date', currentProject?.timeline?.endDate ? new Date(currentProject.timeline.endDate).toLocaleDateString() : 'N/A'],
        ],
        styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
        headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [25, 25, 40] },
        margin: { left: 14, right: 14 }
      });
      y = doc.lastAutoTable.finalY + 12;

      // ── Beneficiary Analytics ───────────────────────────────────────────
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('Beneficiary Analytics', 14, y);
      y += 4;
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 200);
      doc.text(`Total Beneficiaries: ${beneficiaries.length}`, 14, y + 4);
      y += 10;

      // Severity table
      autoTable(doc, {
        startY: y,
        head: [['Severity', 'Count', 'Percentage']],
        body: Object.entries(kpis.severityCounts).map(([k, v]) => [
          k.charAt(0).toUpperCase() + k.slice(1), 
          v, 
          beneficiaries.length > 0 ? `${Math.round((v / beneficiaries.length) * 100)}%` : '0%'
        ]),
        styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
        headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [25, 25, 40] },
        margin: { left: 14, right: pageW / 2 + 2 }
      });

      // Gender table (side by side)
      const sevEndY = doc.lastAutoTable.finalY;
      autoTable(doc, {
        startY: y,
        head: [['Gender', 'Count']],
        body: Object.entries(kpis.genderCounts).map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1), v]),
        styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
        headStyles: { fillColor: [168, 85, 247], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [25, 25, 40] },
        margin: { left: pageW / 2 + 2, right: 14 }
      });
      y = Math.max(sevEndY, doc.lastAutoTable.finalY) + 8;

      // Needs breakdown
      if (Object.keys(kpis.needCounts).length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Primary Need', 'Count']],
          body: Object.entries(kpis.needCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => [k, v]),
          styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
          headStyles: { fillColor: [245, 158, 11], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [25, 25, 40] },
          margin: { left: 14, right: 14 }
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // ── Volunteer Analytics ─────────────────────────────────────────────
      if (y > 240) { doc.addPage(); y = 15; }
      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('Volunteer Analytics', 14, y);
      y += 4;
      doc.setFontSize(9);
      doc.setTextColor(180, 180, 200);
      doc.text(`Total Volunteers: ${volunteers.length}  |  Allocated: ${kpis.assigned}  |  Coverage: ${kpis.allocationPct}%`, 14, y + 4);
      y += 10;

      autoTable(doc, {
        startY: y,
        head: [['Status', 'Count']],
        body: Object.entries(kpis.statusCounts).map(([k, v]) => [k, v]),
        styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [25, 25, 40] },
        margin: { left: 14, right: pageW / 2 + 2 }
      });

      const statusEndY = doc.lastAutoTable.finalY;
      const topSkills = Object.entries(kpis.skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (topSkills.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Skill', 'Count']],
          body: topSkills.map(([k, v]) => [k.replace(/_/g, ' '), v]),
          styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
          headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [25, 25, 40] },
          margin: { left: pageW / 2 + 2, right: 14 }
        });
      }
      y = Math.max(statusEndY, doc.lastAutoTable?.finalY || statusEndY) + 8;

      // Vehicle fleet
      const vehicleEntries = Object.entries(kpis.vehicleCounts).filter(([k]) => k !== 'none');
      if (vehicleEntries.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Vehicle Type', 'Count']],
          body: vehicleEntries.map(([k, v]) => [k.charAt(0).toUpperCase() + k.slice(1), v]),
          styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
          headStyles: { fillColor: [251, 146, 60], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [25, 25, 40] },
          margin: { left: 14, right: 14 }
        });
        y = doc.lastAutoTable.finalY + 12;
      }

      // ── Resource Inventory ──────────────────────────────────────────────
      const hierSupplies = currentProject?.hierarchicalSupplies || [];
      if (hierSupplies.length > 0) {
        if (y > 230) { doc.addPage(); y = 15; }
        doc.setFontSize(14);
        doc.setTextColor(99, 102, 241);
        doc.text('Resource Inventory', 14, y);
        y += 8;
        const supplyRows = [];
        hierSupplies.forEach(cat => {
          (cat.items || []).forEach(item => {
            supplyRows.push([cat.category, item.type, `${item.targetQuantity || 0} ${item.unit || 'units'}`]);
          });
        });
        if (supplyRows.length > 0) {
          autoTable(doc, {
            startY: y,
            head: [['Category', 'Item', 'Target Quantity']],
            body: supplyRows,
            styles: { fontSize: 9, cellPadding: 3, textColor: [220, 220, 230], fillColor: [20, 20, 30] },
            headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [25, 25, 40] },
            margin: { left: 14, right: 14 }
          });
        }
      }

      // ── Footer ──────────────────────────────────────────────────────────
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 140);
        doc.text(`ImpactLink Situation Report  ·  Page ${i} of ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
      }

      doc.save(`ImpactLink_SitRep_${(currentProject?.name || 'project').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
      setGenerated(true);
    } catch (err) {
      console.error('[WorkspaceModal] PDF generation failed:', err);
      alert('PDF generation failed: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const topNeeds = Object.entries(kpis.needCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topSkills = Object.entries(kpis.skillCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Intelligence Hub" maxWidth="900px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* ── Project Header ──────────────────────────────────────────────── */}
        <div style={{ 
          padding: '1rem', borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.05))',
          border: '1px solid rgba(99,102,241,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem'
        }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              {currentProject?.name || 'No Project Selected'}
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
              {currentProject?.description || 'Select a project to view intelligence.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentProject?.scope && (
              <span style={{ 
                fontSize: '0.6875rem', padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: 600,
                background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)'
              }}>{currentProject.scope}</span>
            )}
            {currentProject?.metadata?.priority && (
              <span style={{ 
                fontSize: '0.6875rem', padding: '0.25rem 0.75rem', borderRadius: '20px', fontWeight: 600,
                background: currentProject.metadata.priority === 'Critical' ? 'rgba(239,68,68,0.15)' : 'rgba(251,146,60,0.15)',
                color: currentProject.metadata.priority === 'Critical' ? '#fca5a5' : '#fed7aa',
                border: `1px solid ${currentProject.metadata.priority === 'Critical' ? 'rgba(239,68,68,0.3)' : 'rgba(251,146,60,0.3)'}`
              }}>{currentProject.metadata.priority}</span>
            )}
          </div>
        </div>

        {/* ── KPI Bento Grid ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          
          {/* Beneficiaries */}
          <StatCard icon={<Users size={14} />} label="Beneficiaries" value={beneficiaries.length} sub="registered" color="#a78bfa">
            <div style={{ marginTop: '0.25rem' }}>
              <MiniBar label="High" value={kpis.severityCounts.high} max={beneficiaries.length} color="#ef4444" />
              <MiniBar label="Medium" value={kpis.severityCounts.medium} max={beneficiaries.length} color="#f59e0b" />
              <MiniBar label="Low" value={kpis.severityCounts.low} max={beneficiaries.length} color="#10b981" />
            </div>
          </StatCard>

          {/* Volunteers */}
          <StatCard icon={<Shield size={14} />} label="Volunteers" value={volunteers.length} sub="enrolled" color="#10b981">
            <div style={{ marginTop: '0.25rem' }}>
              <MiniBar label="Active" value={kpis.statusCounts.Active} max={volunteers.length} color="#10b981" />
              <MiniBar label="Deployed" value={kpis.statusCounts.Deployed} max={volunteers.length} color="#38bdf8" />
              <MiniBar label="Inactive" value={kpis.statusCounts.Inactive} max={volunteers.length} color="#6b7280" />
            </div>
          </StatCard>

          {/* Allocation Coverage */}
          <StatCard icon={<Activity size={14} />} label="Allocation" color="#6366f1">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0' }}>
              <DonutRing percentage={kpis.allocationPct} color={kpis.allocationPct > 70 ? '#10b981' : kpis.allocationPct > 40 ? '#f59e0b' : '#ef4444'} />
            </div>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.4)', textAlign: 'center', display: 'block' }}>
              {kpis.assigned} / {volunteers.length} deployed
            </span>
          </StatCard>

          {/* Top Needs */}
          <StatCard icon={<Target size={14} />} label="Top Needs" color="#f59e0b">
            {topNeeds.length > 0 ? topNeeds.map(([need, count]) => (
              <MiniBar key={need} label={need.length > 10 ? need.slice(0, 10) + '…' : need} value={count} max={beneficiaries.length} color="#fbbf24" />
            )) : <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>No data</span>}
          </StatCard>

          {/* Top Skills */}
          <StatCard icon={<BarChart3 size={14} />} label="Skill Coverage" color="#38bdf8">
            {topSkills.length > 0 ? topSkills.map(([skill, count]) => (
              <MiniBar key={skill} label={skill.replace(/_/g, ' ').slice(0, 10)} value={count} max={volunteers.length} color="#60a5fa" />
            )) : <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>No data</span>}
          </StatCard>

          {/* Fleet */}
          <StatCard icon={<Truck size={14} />} label="Fleet" color="#fb923c">
            {Object.entries(kpis.vehicleCounts).filter(([k]) => k !== 'none').length > 0
              ? Object.entries(kpis.vehicleCounts).filter(([k]) => k !== 'none').map(([type, count]) => (
                  <MiniBar key={type} label={type} value={count} max={volunteers.length} color="#fb923c" />
                ))
              : <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>No vehicles</span>
            }
          </StatCard>

        </div>

        {/* ── Region Summary ──────────────────────────────────────────────── */}
        {(currentProject?.regions || []).length > 0 && (
          <div style={{ 
            display: 'flex', gap: '0.75rem', flexWrap: 'wrap',
            padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <span style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', width: '100%', marginBottom: '0.25rem' }}>
              <MapPin size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Operational Regions
            </span>
            {currentProject.regions.map((r, i) => (
              <span key={i} style={{ 
                fontSize: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: '6px',
                background: 'rgba(99,102,241,0.1)', color: '#c7d2fe', border: '1px solid rgba(99,102,241,0.2)'
              }}>
                {r.name || `Region ${i + 1}`} · {r.radius || 50}km
              </span>
            ))}
          </div>
        )}

        {/* ── PDF Export Button ────────────────────────────────────────────── */}
        <button
          onClick={generatePDF}
          disabled={isGenerating || !currentProject}
          style={{
            width: '100%', padding: '1rem', borderRadius: '12px', border: 'none', cursor: 'pointer',
            background: generated 
              ? 'linear-gradient(135deg, #10b981, #059669)' 
              : 'linear-gradient(135deg, #6366f1, #a855f7)',
            color: '#fff', fontSize: '0.9375rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
            opacity: isGenerating || !currentProject ? 0.6 : 1,
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(99,102,241,0.3)'
          }}
        >
          {isGenerating ? (
            <><Loader2 size={18} className="spin" /> Generating Report…</>
          ) : generated ? (
            <><CheckCircle2 size={18} /> Report Downloaded</>
          ) : (
            <><FileText size={18} /> Generate Situation Report</>
          )}
        </button>

      </div>
    </Modal>
  );
}
