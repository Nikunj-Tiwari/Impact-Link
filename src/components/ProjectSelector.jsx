import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { FolderGit2, Plus, Check, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProjectSelector({ onNewProject, onEditProject, onDeleteProject }) {
  const { projects, currentProject, switchProject } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDeleteClick = (e, projectId) => {
    e.stopPropagation();
    if (deletingId === projectId) {
      onDeleteProject(projectId);
      setDeletingId(null);
    } else {
      setDeletingId(projectId);
      // Reset after 3 seconds if not clicked again
      setTimeout(() => setDeletingId(null), 3000);
    }
  };

  return (
    <div style={{ position: 'relative', zIndex: 100 }}>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.45rem 1rem', borderRadius: '8px',
          color: '#fff', fontSize: '0.8125rem', fontWeight: 500,
          cursor: 'pointer', transition: 'background 0.2s ease',
          whiteSpace: 'nowrap'
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
      >
        <FolderGit2 size={14} color="var(--primary)" />
        {currentProject?.name || 'Loading Project Context...'}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '120%', left: 0,
              width: '320px', background: '#111',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden'
            }}
          >
            <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, letterSpacing: '0.05em' }}>
              OPERATIONAL WORKSPACES
            </div>
            
            <div style={{ maxHeight: '350px', overflowY: 'auto' }} className="no-scrollbar">
              {projects.map(proj => {
                const isActive = currentProject?._id === proj._id;
                const isDeleting = deletingId === proj._id;
                const isGlobal = proj.scope === 'Global';

                return (
                  <div
                    key={proj._id}
                    className="group"
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '0.85rem 1rem', background: 'transparent', border: 'none',
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      textAlign: 'left', cursor: 'pointer', fontSize: '0.875rem',
                      borderBottom: '1px solid rgba(255,255,255,0.02)',
                      transition: 'background 0.2s', position: 'relative'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    onClick={() => { switchProject(proj._id); setIsOpen(false); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <span style={{ 
                        fontWeight: isActive ? 600 : 400, 
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
                      }}>
                        {proj.name}
                      </span>
                      {isActive && <Check size={14} color="var(--primary)" />}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', opacity: isDeleting ? 1 : 0 }} className="project-actions">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEditProject(proj); setIsOpen(false); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '0.25rem' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                      >
                        <Pencil size={14} />
                      </button>
                      
                      {!isGlobal && (
                        <button 
                          onClick={(e) => handleDeleteClick(e, proj._id)}
                          style={{ 
                            background: isDeleting ? 'rgba(239, 68, 68, 0.1)' : 'none', 
                            border: 'none', 
                            color: isDeleting ? 'var(--error)' : 'var(--text-dim)', 
                            cursor: 'pointer', padding: '0.25rem',
                            borderRadius: '4px', display: 'flex', alignItems: 'center'
                          }}
                          onMouseEnter={e => { if (!isDeleting) e.currentTarget.style.color = 'var(--error)'; }}
                          onMouseLeave={e => { if (!isDeleting) e.currentTarget.style.color = 'var(--text-dim)'; }}
                        >
                          {isDeleting ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ padding: '0.5rem', background: 'var(--bg-pane)' }}>
              <button 
                onClick={() => { setIsOpen(false); onNewProject(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  padding: '0.75rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)',
                  color: 'var(--primary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600
                }}
              >
                <Plus size={14} /> New Project Environment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
