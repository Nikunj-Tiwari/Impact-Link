import { Package, Plus, Trash2, Layers, Tag, ChevronDown, ListTree, Calculator, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Step5Resources({ data, update }) {
  const addCategory = () => {
    update('resources', {
      hierarchicalSupplies: [
        ...data.hierarchicalSupplies, 
        { category: '', items: [{ type: '', unit: 'units', targetQuantity: 0 }] }
      ]
    });
  };

  const removeCategory = (catIdx) => {
    update('resources', {
      hierarchicalSupplies: data.hierarchicalSupplies.filter((_, i) => i !== catIdx)
    });
  };

  const updateCategoryName = (catIdx, name) => {
    const updated = [...data.hierarchicalSupplies];
    updated[catIdx].category = name;
    update('resources', { hierarchicalSupplies: updated });
  };

  const addItem = (catIdx) => {
    const updated = [...data.hierarchicalSupplies];
    updated[catIdx].items.push({ type: '', unit: 'units', targetQuantity: 0 });
    update('resources', { hierarchicalSupplies: updated });
  };

  const removeItem = (catIdx, itemIdx) => {
    const updated = [...data.hierarchicalSupplies];
    updated[catIdx].items = updated[catIdx].items.filter((_, i) => i !== itemIdx);
    update('resources', { hierarchicalSupplies: updated });
  };

  const updateItem = (catIdx, itemIdx, field, val) => {
    const updated = [...data.hierarchicalSupplies];
    updated[catIdx].items[itemIdx][field] = field === 'targetQuantity' ? parseInt(val) || 0 : val;
    update('resources', { hierarchicalSupplies: updated });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
      {/* Information Header */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '4rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>Resource Architecture</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-dim)', lineHeight: '1.6' }}>
            Structure your mission resources into a hierarchical schema. This allows the AI to track consumption rates and predict depletion peaks for specific item groups.
          </p>
        </div>

        <div style={{ padding: '2rem', background: 'rgba(255,165,0,0.03)', border: '1px solid rgba(255,165,0,0.1)', borderRadius: '20px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'rgba(255,165,0,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <Layers size={24} color="orange" />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>Hierarchical Intelligence</div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
               Categories act as "Smart Buckets". For example, adding "Food" as a category and "Rice" as an item allows the system to calculate "Total Days of Sustenance" across all food types.
            </p>
          </div>
        </div>
      </section>

      <div style={{ height: '1px', background: 'linear-gradient(to right, rgba(255,255,255,0.05), transparent)' }} />

      {/* Resource Grid */}
      <section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {data.hierarchicalSupplies.map((cat, catIdx) => (
            <motion.div 
              key={catIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ 
                background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', 
                borderRadius: '20px', padding: '2rem', overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Tag size={16} color="var(--primary)" />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Category Title (e.g. MEDICAL, HYGIENE...)"
                      value={cat.category}
                      onChange={(e) => updateCategoryName(catIdx, e.target.value)}
                      style={{ background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '1.25rem', fontWeight: 700, padding: '0.25rem 0', width: '40%', outline: 'none' }}
                    />
                 </div>
                 <button 
                  onClick={() => removeCategory(catIdx)} 
                  style={{ background: 'none', border: 'none', color: 'rgba(239, 68, 68, 0.4)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(239, 68, 68, 0.4)'}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Items Table Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 40px', gap: '1.5rem', marginBottom: '0.75rem', padding: '0 1rem' }}>
                 <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Item Classification</span>
                 <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Measurement Unit</span>
                 <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Strategic Target</span>
                 <span></span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <AnimatePresence>
                  {cat.items.map((item, itemIdx) => (
                    <motion.div 
                      key={itemIdx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      style={{ 
                        display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr 40px', gap: '1.5rem', alignItems: 'center',
                        padding: '1.25rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.03)'
                      }}
                    >
                      <input 
                        type="text" 
                        placeholder="e.g. Rehydration Salts" 
                        value={item.type}
                        onChange={(e) => updateItem(catIdx, itemIdx, 'type', e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.95rem', outline: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <ListTree size={14} color="var(--text-dim)" />
                        <input 
                          type="text" 
                          placeholder="Kits/Units/Kgs" 
                          value={item.unit}
                          onChange={(e) => updateItem(catIdx, itemIdx, 'unit', e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: '0.9rem', outline: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Calculator size={14} color="var(--primary)" />
                        <input 
                          type="number" 
                          placeholder="0000"
                          value={item.targetQuantity}
                          onChange={(e) => updateItem(catIdx, itemIdx, 'targetQuantity', e.target.value)}
                          style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, textAlign: 'center' }}
                        />
                      </div>
                      <button 
                        onClick={() => removeItem(catIdx, itemIdx)} 
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                      >
                        <X size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                <button 
                  onClick={() => addItem(catIdx)} 
                  style={{ 
                    marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', 
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                    color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', cursor: 'pointer', 
                    fontSize: '0.85rem', fontWeight: 600, width: 'fit-content', transition: 'all 0.2s' 
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <Plus size={16} color="var(--accent-brand)" /> Add Specific Resource Item
                </button>
              </div>
            </motion.div>
          ))}

          <button 
            onClick={addCategory} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '1rem', padding: '2.5rem', 
              background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.15)', 
              borderRadius: '20px', color: 'var(--accent-brand)', cursor: 'pointer', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 700, transition: 'all 0.3s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.03)'; e.currentTarget.style.borderColor = 'var(--accent-brand)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
          >
             <Package size={24} /> Initialize New Strategic Resource Category
          </button>
        </div>
      </section>
    </div>
  );
}
