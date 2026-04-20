import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, CircleF, MarkerF, Autocomplete } from '@react-google-maps/api';
import { 
  MapPin, 
  Search, 
  Compass, 
  Info, 
  X, 
  Plus, 
  Trash2, 
  Map as MapIcon, 
  ChevronRight, 
  Target, 
  Edit3, 
  Navigation, 
  GripHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  backgroundColor: '#050505',
  styles: [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] }
  ]
};

const LIBRARIES = ['visualization', 'places'];

export default function Step2Geography({ data, update }) {
  const [autocomplete, setAutocomplete] = useState(null);
  const [relocateAutocomplete, setRelocateAutocomplete] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [relocateSearchValue, setRelocateSearchValue] = useState('');
  const [activeRegionIndex, setActiveRegionIndex] = useState(-1);
  const sidebarRef = React.useRef(null);

  React.useEffect(() => {
    const handleGlobalClick = (e) => {
      // If clicking globally outside the tactile management areas, collapse everything
      // We skip if clicking the map markers (handled by library) or our cards/inputs
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        // Only collapse if we aren't clicking on the map canvas itself (which has its own click logic)
        const isMapClick = e.target.closest('.gm-style');
        if (!isMapClick) {
          setActiveRegionIndex(-1);
        }
      }
    };

    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  const regions = data.regions || [];
  const activeRegion = activeRegionIndex >= 0 ? regions[activeRegionIndex] : null;

  const updateRegion = (index, updates) => {
    if (index < 0) return;
    const newRegions = [...regions];
    newRegions[index] = { ...newRegions[index], ...updates };
    update('geography', { regions: newRegions });
  };

  const addRegion = (lat, lng, name = 'New Operational Area') => {
    const newRegion = {
      center: lat && lng ? { lat, lng } : { lat: 20.5937, lng: 78.9629 },
      radius: 50,
      name: name,
      volunteerTargets: {
        total: 0,
        local: 0,
        travel: 0
      }
    };
    const newRegions = [...regions, newRegion];
    update('geography', { regions: newRegions });
    setActiveRegionIndex(newRegions.length - 1);
  };

  /**
   * Manual Geocoding Fallback for loose text queries
   */
  const handleManualSearch = (query, mode = 'ADD', index = null) => {
    if (!query || !window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        const name = formatAddress(results[0]);
        if (mode === 'ADD') {
          addRegion(lat(), lng(), name);
          setSearchValue('');
        } else if (mode === 'UPDATE' && index !== null) {
          updateRegion(index, { center: { lat: lat(), lng: lng() }, name });
          setRelocateSearchValue('');
        }
      }
    });
  };

  const removeRegion = (e, index) => {
    e.stopPropagation();
    const newRegions = regions.filter((_, i) => i !== index);
    update('geography', { regions: newRegions });
    setActiveRegionIndex(-1); // Collapse after deletion
  };

  const handleMapClick = (e) => {
    if (activeRegionIndex >= 0) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      updateRegion(activeRegionIndex, { center: { lat, lng } });
    } else {
      // Background click on map when nothing is active
      setActiveRegionIndex(-1);
    }
  };

  const onAutocompleteLoad = (autocompleteInstance) => {
    setAutocomplete(autocompleteInstance);
  };

  const formatAddress = (place) => {
    if (!place.address_components) return place.formatted_address || place.name || 'Selected Area';
    
    // Extract tactical components
    const getComp = (type) => place.address_components.find(c => c.types.includes(type))?.long_name;
    const locArr = [
      getComp('locality') || getComp('sublocality_level_1'),
      getComp('administrative_area_level_2') || getComp('administrative_area_level_1')
    ].filter(Boolean);
    
    const pincode = getComp('postal_code');
    const mainStr = locArr.join(', ');
    return pincode ? `${mainStr} - ${pincode}` : mainStr || place.name;
  };

  const onPlaceChanged = () => {
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        addRegion(lat, lng, formatAddress(place));
        setSearchValue(''); 
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header Strategy */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>Tactical Deployment Registry</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Add and configure the operational zones for this mission environment.</p>
         </div>
         <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.25rem', borderRadius: '8px' }}>
            {['City', 'District', 'State'].map(s => (
              <button 
                key={s} 
                onClick={() => update('geography', { scope: s })}
                style={{ 
                  padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                  background: data.scope === s ? 'var(--primary)' : 'transparent',
                  color: data.scope === s ? '#fff' : 'var(--text-dim)', border: 'none', cursor: 'pointer'
                }}
              >
                {s}
              </button>
            ))}
         </div>
      </div>

      <div style={{ 
        height: '600px', 
        background: '#0a0a0a', 
        position: 'relative', 
        overflow: 'hidden', 
        borderRadius: '24px', 
        display: 'flex',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
      }}>
        {/* Accordion List Sidebar */}
        <div 
          ref={sidebarRef}
          style={{ 
            width: '340px', 
            background: 'rgba(5, 10, 15, 0.95)', 
            backdropFilter: 'blur(30px)', 
            borderRight: '1px solid rgba(255,255,255,0.1)', 
            display: 'flex', 
            flexDirection: 'column', 
            zIndex: 5,
            cursor: 'default'
          }}
        >
           <div 
            style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
           >
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--primary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <Autocomplete onLoad={onAutocompleteLoad} onPlaceChanged={onPlaceChanged}>
                  <input 
                    type="text" 
                    placeholder="Search location to add zone..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleManualSearch(searchValue, 'ADD');
                    }}
                    style={{ 
                      width: '100%', padding: '0.75rem 1rem 0.75rem 2.25rem', 
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '10px', color: '#fff', fontSize: '0.8125rem', outline: 'none' 
                    }}
                  />
                </Autocomplete>
              </div>
           </div>
           
           <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }} className="no-scrollbar">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <AnimatePresence initial={false}>
                  {regions.map((region, idx) => {
                    const isActive = activeRegionIndex === idx;
                    return (
                      <motion.div 
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => { e.stopPropagation(); setActiveRegionIndex(idx); }}
                        style={{ 
                          borderRadius: '16px', overflow: 'hidden', cursor: 'pointer',
                          background: isActive ? 'rgba(79, 70, 229, 0.08)' : 'rgba(255,255,255,0.02)',
                          border: '1px solid',
                          borderColor: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        {/* Header Area */}
                        <div style={{ padding: '1rem', borderBottom: isActive ? '1px solid rgba(79, 70, 229, 0.2)' : 'none', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MapPin size={16} color="#fff" />
                          </div>
                          
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            {isActive ? (
                               <input 
                                  autoFocus
                                  value={region.name}
                                  onChange={(e) => updateRegion(idx, { name: e.target.value })}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 700, outline: 'none', width: '100%' }}
                                  placeholder="Name this zone..."
                               />
                            ) : (
                               <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                 {region.name || 'Untitled Area'}
                               </div>
                            )}
                          </div>

                          {!isActive && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800 }}>{region.radius}km</div>
                          )}

                          {regions.length > 1 && (
                            <button 
                              onClick={(e) => removeRegion(e, idx)} 
                              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '0.25rem' }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>

                        {/* Expandable Content Area */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
                                 {/* Relocate Search */}
                                 <div style={{ position: 'relative' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Relocate Area</div>
                                    <Autocomplete 
                                      onLoad={(a) => setRelocateAutocomplete(a)} 
                                      onPlaceChanged={() => {
                                        if (relocateAutocomplete !== null) {
                                          const place = relocateAutocomplete.getPlace();
                                          if (place.geometry) {
                                            updateRegion(idx, { 
                                              center: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() },
                                              name: formatAddress(place)
                                            });
                                          }
                                        }
                                      }}
                                    >
                                      <div style={{ position: 'relative' }}>
                                        <Search size={12} color="var(--primary)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input 
                                          type="text" 
                                          placeholder="Search new location for this zone..." 
                                          value={relocateSearchValue}
                                          onChange={(e) => setRelocateSearchValue(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleManualSearch(relocateSearchValue, 'UPDATE', idx);
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                          style={{ 
                                            width: '100%', padding: '0.65rem 0.75rem 0.65rem 2rem', 
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', 
                                            borderRadius: '8px', color: '#fff', fontSize: '0.75rem', outline: 'none' 
                                          }}
                                        />
                                      </div>
                                    </Autocomplete>
                                 </div>

                                 {/* Location Data - De-emphasized */}
                                 <div style={{ padding: '0.25rem 0', display: 'flex', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                                       Target GPS: <span style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{region.center.lat.toFixed(4)}, {region.center.lng.toFixed(4)}</span>
                                    </div>
                                 </div>

                                 {/* Radius Control */}
                                 <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                       <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operational Radius</label>
                                       <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800 }}>{region.radius}km</span>
                                    </div>
                                    <input 
                                      type="range" min="1" max="500" 
                                      value={Number(region.radius) || 50} 
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        updateRegion(idx, { radius: val });
                                      }}
                                      onInput={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        updateRegion(idx, { radius: val });
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ width: '100%', accentColor: 'var(--primary)', height: '4px' }}
                                    />
                                 </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>


                {regions.length < 5 ? (
                  <button 
                    onClick={() => addRegion()}
                    style={{ 
                      marginTop: '0.5rem', padding: '1rem', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.15)',
                      background: 'rgba(255,255,255,0.02)', color: 'var(--primary)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.85rem', fontWeight: 700,
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79, 70, 229, 0.05)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
                  >
                    <Plus size={16} /> Initialize Operational Area
                  </button>
                ) : (
                  <div style={{ 
                    marginTop: '0.5rem', padding: '1rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)',
                    background: 'rgba(255,255,255,0.01)', color: 'var(--text-dim)', textAlign: 'center', fontSize: '0.75rem', fontStyle: 'italic'
                  }}>
                    Maximum operational zone limit reached (5/5)
                  </div>
                )}
              </div>
           </div>

        </div>

        {/* Tactical Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={activeRegion?.center || { lat: 20.5937, lng: 78.9629 }}
              zoom={7}
              onClick={handleMapClick}
              options={MAP_OPTIONS}
            >
              {regions.map((region, idx) => (
                <React.Fragment key={idx}>
                  <MarkerF 
                    position={region.center} 
                    draggable={activeRegionIndex === idx}
                    onDragEnd={(e) => updateRegion(idx, { center: { lat: e.latLng.lat(), lng: e.latLng.lng() } })}
                    onClick={() => setActiveRegionIndex(idx)}
                    icon={window.google ? {
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 8,
                      fillColor: activeRegionIndex === idx ? "#4F46E5" : "#6366F1",
                      fillOpacity: 1,
                      strokeWeight: 2,
                      strokeColor: "#FFFFFF",
                    } : null}
                  />
                  <CircleF 
                    center={region.center}
                    radius={region.radius * 1000}
                    options={{
                      fillColor: activeRegionIndex === idx ? "rgba(79, 70, 229, 0.1)" : "rgba(255, 255, 255, 0.05)",
                      fillOpacity: 0.3,
                      strokeColor: activeRegionIndex === idx ? "rgba(79, 70, 229, 0.6)" : "rgba(255, 255, 255, 0.15)",
                      strokeWeight: activeRegionIndex === idx ? 2 : 1,
                      clickable: false
                    }}
                  />
                </React.Fragment>
              ))}
            </GoogleMap>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              Calibrating Global Sensors...
            </div>
          )}

          {/* Floating Instructions HUD */}
          <div style={{ position: 'absolute', bottom: '1.5rem', right: '1.5rem', background: 'rgba(5, 10, 15, 0.8)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.75rem', alignItems: 'center', pointerEvents: 'none' }}>
             <Navigation size={16} color="var(--primary)" />
             <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Click map to relocate active target <strong style={{ color: '#fff' }}>{activeRegion?.name || 'Area'}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
