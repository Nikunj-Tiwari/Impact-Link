import React, { useMemo, useCallback, useState, useEffect, useRef, memo } from 'react';
import { APIProvider, Map, AdvancedMarker, Circle, Polyline, useMap, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { motion, AnimatePresence } from 'framer-motion';
import { mapStyles } from './mapStyles';
import { Plus, Minus } from 'lucide-react';
import { resolveVolunteerCoords } from '../../services/coordResolver';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

const containerStyle = { width: '100%', height: '500px', position: 'relative' };
const CENTER_LAT = 20.5937;
const CENTER_LNG = 78.9629;
const HUB_POS = { lat: CENTER_LAT, lng: CENTER_LNG };

const MAP_OPTIONS = {
  styles: mapStyles,
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  backgroundColor: '#050505',
  gestureHandling: 'cooperative',
  restriction: { latLngBounds: { north: 38, south: 6, west: 67, east: 98 }, strictBounds: false },
};

const KineticMap = memo(function KineticMap(props) {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""} libraries={['places']}>
      <KineticMapContent {...props} />
    </APIProvider>
  );
});
export default KineticMap;

function KineticMapContent({ 
  isImmersive, incidents, selectedIncident, activeDispatches, 
  clusters = { points: [], hotspots: [] }, projectRegions = [], 
  volunteers = [], mapPanTarget 
}) {
  const mapRef = useMap();
  const [vizMode, setVizMode] = useState('STRATEGIC');
  const [showNoise, setShowNoise] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(5);
  const [hoveredHotspot, setHoveredHotspot] = useState(null);

  const dynamicOptions = useMemo(() => ({
    ...MAP_OPTIONS,
    restriction: { latLngBounds: { north: 35.4, south: 8.0, west: 68.7, east: 97.2 }, strictBounds: true },
    minZoom: isImmersive ? 5.5 : 4.5,
  }), [isImmersive]);

  // Remove adaptiveRadius and maxIntensity entirely to avoid high-frequency 
  // dependency updates during map zooming.

  const groupedVolunteers = useMemo(() => {
    if (!volunteers || volunteers.length === 0) return [];
    const groups = {};
    volunteers.forEach(vol => {
      const coords = resolveVolunteerCoords(vol);
      if (!coords) return;
      const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
      if (!groups[key]) groups[key] = { coords, vols: [] };
      groups[key].vols.push(vol);
    });
    return Object.values(groups);
  }, [volunteers]);

  const heatmapPoints = useMemo(() => {
    return incidents.map(inc => {
      const lat = parseFloat(inc.geo?.lat || inc.lat);
      const lng = parseFloat(inc.geo?.lng || inc.lng);
      if (isNaN(lat) || isNaN(lng)) return null;
      const rawWeight = ((inc.calculatedUrgency || inc.severity || 5) * 0.7 + (inc.impactPotential || 5) * 0.3);
      const urgencyWeight = rawWeight * (1 - (inc.saturationRate || 0));
      return { lat, lng, weight: Math.max(1, urgencyWeight) };
    }).filter(Boolean);
  }, [incidents]);

  const deckOverlayRef = useRef(null);

  useEffect(() => {
    if (!mapRef) return;
    if (!deckOverlayRef.current) {
      deckOverlayRef.current = new GoogleMapsOverlay({ interleaved: false });
      deckOverlayRef.current.setMap(mapRef);
    }
    return () => {
      if (deckOverlayRef.current) {
        deckOverlayRef.current.setMap(null);
        deckOverlayRef.current = null;
      }
    };
  }, [mapRef]);

  useEffect(() => {
    if (!deckOverlayRef.current) return;
    if (vizMode === 'HEATMAP' && heatmapPoints.length > 0) {
      const layer = new HeatmapLayer({
        id: 'heatmapLayer',
        data: heatmapPoints,
        getPosition: d => [d.lng, d.lat],
        getWeight: d => d.weight,
        radiusPixels: 45, // Constant radius is handled smoothly by WebGL natively
        intensity: 1.5,
        threshold: 0.03,
        colorRange: [
          [16, 185, 129],
          [120, 200, 80],
          [250, 204, 21],
          [251, 146, 60],
          [239, 68, 68],
          [155, 20, 20]
        ]
      });
      deckOverlayRef.current.setProps({ layers: [layer] });
    } else {
      deckOverlayRef.current.setProps({ layers: [] });
    }
  }, [vizMode, heatmapPoints]);

  useEffect(() => {
    if (mapRef && (incidents.length > 0 || (volunteers && volunteers.length > 0))) {
      // Create bounds manually to avoid immediate dependency on google object before load
      const bounds = new window.google.maps.LatLngBounds();
      let hasValidPoints = false;
      incidents.forEach(inc => {
        const lat = parseFloat(inc.geo?.lat || inc.lat);
        const lng = parseFloat(inc.geo?.lng || inc.lng);
        if (!isNaN(lat) && !isNaN(lng)) { bounds.extend({ lat, lng }); hasValidPoints = true; }
      });
      if (volunteers && volunteers.length > 0) {
        volunteers.forEach(vol => {
          const coords = resolveVolunteerCoords(vol);
          if (coords) { bounds.extend({ lat: coords.lat, lng: coords.lng }); hasValidPoints = true; }
        });
      }
      if (hasValidPoints) {
        mapRef.fitBounds(bounds);
        if (mapRef.getZoom() > 15) mapRef.setZoom(15);
      }
    }
  }, [incidents, volunteers, mapRef]);

  useEffect(() => {
    if (mapRef && selectedIncident) {
      const lat = parseFloat(selectedIncident.geo?.lat || selectedIncident.lat);
      const lng = parseFloat(selectedIncident.geo?.lng || selectedIncident.lng);
      if (!isNaN(lat) && !isNaN(lng)) { mapRef.panTo({ lat, lng }); mapRef.setZoom(13); }
    }
  }, [selectedIncident, mapRef]);

  useEffect(() => {
    if (mapRef && mapPanTarget) {
      const lat = parseFloat(mapPanTarget.lat);
      const lng = parseFloat(mapPanTarget.lng);
      if (!isNaN(lat) && !isNaN(lng)) { mapRef.panTo({ lat, lng }); mapRef.setZoom(14); }
    }
  }, [mapPanTarget, mapRef]);

  const handleZoomIn = useCallback(() => { if (mapRef) mapRef.setZoom(Math.min(mapRef.getZoom() + 1, 18)); }, [mapRef]);
  const handleZoomOut = useCallback(() => { if (mapRef) mapRef.setZoom(Math.max(mapRef.getZoom() - 1, 4)); }, [mapRef]);

  const getPriorityColor = useCallback((score) => {
    if (score > 8) return '#f43f5e';
    if (score > 6) return '#f59e0b';
    if (score > 4) return '#a855f7';
    return '#10b981';
  }, []);

  // Marker Clusterer Setup
  const clusterer = useRef(null);

  useEffect(() => {
    if (!mapRef) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map: mapRef });
    }
    // Cleanup on unmount
    return () => {
      if (clusterer.current) {
        clusterer.current.clearMarkers();
      }
    };
  }, [mapRef]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '450px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#050505' }}>
      <style>{`
        @keyframes pulse-ring { 0% { transform: scale(0.95); opacity: 0.6; } 50% { transform: scale(1); opacity: 0.2; } 100% { transform: scale(0.95); opacity: 0.6; } }
        .cluster-pulse { animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .map-label-bg { background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; text-shadow: 0 2px 4px rgba(0,0,0,0.9); }
      `}</style>

      <Map
        mapId={import.meta.env.VITE_GOOGLE_MAPS_ID || "DEMO_MAP_ID"}
        defaultCenter={HUB_POS}
        defaultZoom={currentZoom}
        onZoomChanged={(e) => setCurrentZoom(Math.round(e.detail.zoom))}
        options={dynamicOptions}
        disableDefaultUI={true}
        gestureHandling={'cooperative'}
        colorScheme={'DARK'}
      >
        {/* Strategic Regions */}
        {(projectRegions || []).map((region, idx) => (
          <React.Fragment key={`region-${idx}`}>
            <Circle
              center={region.center}
              radius={region.radius * 1000}
              fillColor="rgba(79, 70, 229, 0.05)"
              fillOpacity={0.2}
              strokeColor="rgba(79, 70, 229, 0.4)"
              strokeWeight={1}
              clickable={false}
              zIndex={5}
            />
            {currentZoom > 8 && (
              <AdvancedMarker position={region.center}>
                 <svg width="24" height="24" viewBox="-12 -12 24 24">
                   <circle r="8" fill="rgba(79, 70, 229, 0.8)" stroke="#fff" strokeWidth="1" />
                 </svg>
              </AdvancedMarker>
            )}
          </React.Fragment>
        ))}

        {vizMode === 'STRATEGIC' && (
          <>
            {((clusters && clusters.hotspots) || []).map((h, i) => {
              const baseRadius = Math.sqrt(h.avgSeverity || 5) * 20000;
              const densityRadius = Math.log2((h.count || 1) + 1) * 5000;
              const totalRadius = baseRadius + densityRadius;
              if (isNaN(totalRadius)) return null;
              return (
                <React.Fragment key={`hotspot-${i}`}>
                   <Circle
                    center={{ lat: parseFloat(h.lat), lng: parseFloat(h.lng) }}
                    radius={totalRadius}
                    onMouseOver={() => setHoveredHotspot(h)}
                    onMouseOut={() => setHoveredHotspot(null)}
                    fillColor="rgba(0, 191, 255, 0.12)" fillOpacity={0.25}
                    strokeColor="rgba(0, 191, 255, 0.5)" strokeWeight={1}
                    clickable={true} zIndex={10}
                  />
                  <Circle
                    center={{ lat: parseFloat(h.lat), lng: parseFloat(h.lng) }}
                    radius={totalRadius * 0.7}
                    onMouseOver={() => setHoveredHotspot(h)}
                    onMouseOut={() => setHoveredHotspot(null)}
                    fillColor={(h.avgSeverity || 5) > 8 ? "rgba(244, 63, 94, 0.2)" : "rgba(0, 191, 255, 0.25)"} fillOpacity={0.4}
                    strokeColor={(h.avgSeverity || 5) > 8 ? "rgba(244, 63, 94, 0.8)" : "rgba(0, 191, 255, 0.8)"} strokeWeight={2}
                    clickable={true} zIndex={11}
                  />
                </React.Fragment>
              );
            })}

            {showNoise && ((clusters && clusters.points) || []).filter(p => p.cluster === -1).map((p, i) => (
              <Circle
                key={`noise-${i}`}
                center={{ lat: parseFloat(p.lat), lng: parseFloat(p.lng) }}
                radius={1500}
                fillColor="rgba(255, 255, 255, 0.05)" fillOpacity={0.1}
                strokeColor="rgba(255, 255, 255, 0.15)" strokeWeight={0.5}
                clickable={false}
              />
            ))}
          </>
        )}

        {/* Incidents / Clusters - Only render in STRATEGIC mode to prevent cluttering the Heatmap surface */}
        {vizMode === 'STRATEGIC' && ((clusters && clusters.points) || incidents).map((inc) => {
          const key = `inc-${inc._id || inc.id || Math.random()}`;
          return (
            <ClusteredIncident 
               key={key}
               inc={inc}
               vizMode={vizMode}
               showNoise={showNoise}
               selectedIncident={selectedIncident}
               currentZoom={currentZoom}
               getPriorityColor={getPriorityColor}
               clusterer={clusterer.current}
            />
          );
        })}

        {/* Volunteers — show in active modes so they can be located */}
        {vizMode !== 'OFF' && groupedVolunteers.map((group, gIdx) => {
          const { coords, vols } = group;
          const isGPS = coords.source === 'gps';
          const anyAllocated = vols.some(v => !!v.currentAssignmentId && v.assignmentStatus && v.assignmentStatus !== 'unassigned');
          let baseLabel = vols.length > 1 ? `${vols[0].name?.split(' ')[0]} + ${vols.length - 1}` : `${vols[0].name?.split(' ')[0] || 'Volunteer'}`;
          const labelText = `${baseLabel} · ${anyAllocated ? 'ALLOCATED' : (isGPS ? 'GPS' : 'HUB')}`;
          const hoverTitle = vols.map(v => v.name).join(', ');

          return (
            <React.Fragment key={`vol-group-${gIdx}`}>
              <Circle center={{ lat: coords.lat, lng: coords.lng }} radius={isGPS ? 60 : 40} fillColor={isGPS ? '#ffffff' : '#10b981'} fillOpacity={isGPS ? 0.15 : 0.08} strokeColor={isGPS ? '#ffffff' : '#10b981'} strokeOpacity={0.3} strokeWeight={1} clickable={false} zIndex={2} />
              <AdvancedMarker position={{ lat: coords.lat, lng: coords.lng }} zIndex={3}>
                <div title={hoverTitle} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'help', transform: 'translateY(50%)' }}>
                   <svg width={isGPS ? 20 : 16} height={isGPS ? 20 : 16} viewBox="-10 -10 20 20" style={{ display: 'block' }}>
                     <circle r="6" fill={isGPS ? '#ffffff' : '#10b981'} stroke="#fff" strokeWidth={isGPS ? 2 : 3} />
                   </svg>
                   {currentZoom > 11 && (
                     <div className="map-label-bg" style={{ position: 'absolute', top: '100%', color: isGPS ? '#ffffff' : '#10b981', fontSize: '11px', fontWeight: '700', marginTop: '4px', whiteSpace: 'nowrap' }}>{labelText}</div>
                   )}
                </div>
              </AdvancedMarker>
            </React.Fragment>
          );
        })}

        {/* Dispatch Lines */}
        {vizMode !== 'OFF' && volunteers.map(vol => {
          if (!vol.currentAssignmentId) return null;
          const coords = resolveVolunteerCoords(vol);
          if (!coords) return null;
          const targetMission = incidents.find(m => String(m._id) === String(vol.currentAssignmentId) || String(m.id) === String(vol.currentAssignmentId));
          if (!targetMission) return null;
          const targetLat = parseFloat(targetMission.geo?.lat || targetMission.lat);
          const targetLng = parseFloat(targetMission.geo?.lng || targetMission.lng);
          if (isNaN(targetLat) || isNaN(targetLng)) return null;

          return (
            <Polyline
              key={`dispatch-line-${vol._id}`}
              path={[{ lat: coords.lat, lng: coords.lng }, { lat: targetLat, lng: targetLng }]}
              strokeColor="#38bdf8" strokeOpacity={0.8} strokeWeight={2} geodesic={true}
            />
          );
        })}
      </Map>

      {/* Hover Panel */}
      <AnimatePresence>
        {hoveredHotspot && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} style={{ position: 'absolute', top: isImmersive ? '380px' : '20px', left: '20px', zIndex: 1000, background: 'rgba(5, 10, 15, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(0, 191, 255, 0.4)', padding: '16px', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.9)', minWidth: '220px', pointerEvents: 'none' }}>
            <div style={{ color: '#00bfff', fontSize: '0.625rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00bfff' }} className="cluster-pulse" />Regional Analysis Center</div>
            <div style={{ fontSize: '1.25rem', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{hoveredHotspot.count} Active Cases</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '16px' }}>Cluster Index #{hoveredHotspot.cluster}</div>
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}><span>Urgency Profile</span><span>{hoveredHotspot.avgSeverity?.toFixed(1)}/10</span></div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (hoveredHotspot.avgSeverity || 5) * 10)}%` }} style={{ height: '100%', background: (hoveredHotspot.avgSeverity || 5) > 8 ? '#f43f5e' : '#00bfff' }} /></div>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(0, 191, 255, 0.5)', fontFamily: 'monospace' }}>GEO: {parseFloat(hoveredHotspot.lat).toFixed(4)}N, {parseFloat(hoveredHotspot.lng).toFixed(4)}E</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <button onClick={handleZoomIn} className="btn-map-control" style={{ borderRadius: '4px 4px 0 0' }}><Plus size={14} /></button>
        <button onClick={handleZoomOut} className="btn-map-control" style={{ borderRadius: '0 0 4px 4px' }}><Minus size={14} /></button>
      </div>

      <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 100, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
         <button className="btn-map-mode" style={{ background: vizMode !== 'OFF' ? 'rgba(79, 70, 229, 0.4)' : 'rgba(0,0,0,0.6)' }} onClick={() => { const modes = ['STRATEGIC', 'HEATMAP', 'OFF']; setVizMode(modes[(modes.indexOf(vizMode) + 1) % modes.length]); }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: vizMode === 'HEATMAP' ? 'var(--danger)' : vizMode === 'STRATEGIC' ? 'var(--accent-tertiary)' : 'var(--text-dim)' }} /> Mode: {vizMode}
         </button>
         {vizMode === 'STRATEGIC' && (<label className="btn-map-mode" style={{ cursor: 'pointer' }}><input type="checkbox" checked={showNoise} onChange={(e) => setShowNoise(e.target.checked)} style={{ cursor: 'pointer' }} /> Show Noise</label>)}
      </div>

      {vizMode === 'HEATMAP' && (
        <div className="map-legend">
          <div style={{ fontSize: '0.625rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Urgency Intensity</div>
          <div style={{ width: '120px', height: '8px', borderRadius: '4px', background: 'linear-gradient(90deg, #10b981, #facc15, #f97316, #ef4444, #b91c1c)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.625rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}><span>Low</span><span>Critical</span></div>
        </div>
      )}
      <div className="map-zoom-tag">ZOOM: {currentZoom}</div>
    </div>
  );
}

const ClusteredIncident = memo(function ClusteredIncident({ inc, vizMode, showNoise, selectedIncident, currentZoom, getPriorityColor, clusterer }) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  useEffect(() => {
    if (!marker || !clusterer) return;
    clusterer.addMarker(marker);
    return () => clusterer.removeMarker(marker);
  }, [marker, clusterer]);

  const lat = parseFloat(inc.geo?.lat || inc.lat);
  const lng = parseFloat(inc.geo?.lng || inc.lng);
  if (isNaN(lat) || isNaN(lng)) return null;

  const pos = useMemo(() => ({ lat, lng }), [lat, lng]);

  const isStrategic = vizMode === 'STRATEGIC';
  const isNoise = inc.cluster === -1;
  if (isStrategic && isNoise && !showNoise) return null;

  const score = (inc.severity * 0.4 + inc.frequency * 0.2 + inc.resourceGap * 0.3 + inc.timeSensitivity * 0.1).toFixed(1);
  const isSelected = selectedIncident?.id === inc.id || selectedIncident?._id === inc._id;
  const color = getPriorityColor(score);
  const isMitigated = score <= 5;
  const showLabel = currentZoom > 11 || isSelected;

  return (
    <AdvancedMarker
      position={pos}
      ref={markerRef}
      zIndex={isSelected ? 100 : 1}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: isStrategic ? 'translateY(50%)' : 'none' }}>
         <svg 
           width={isStrategic ? 24 : (isSelected ? 16 : 12)} 
           height={isStrategic ? 24 : (isSelected ? 16 : 12)} 
           viewBox="-12 -12 24 24"
           style={{ opacity: isStrategic ? 1 : (isSelected ? 1 : 0.8) }}
         >
           {isStrategic ? (
             <circle r="8" fill={isNoise ? "#ffffff" : color} stroke="#000" strokeWidth="1" />
           ) : (
             <path d="M 0, 0 m -3, 0 a 3,3 0 1,0 6,0 a 3,3 0 1,0 -6,0" fill={isMitigated ? "#94a3b8" : color} stroke="#fff" strokeWidth={isSelected ? 3 : 1} />
           )}
         </svg>
         {showLabel && (
            <div style={{ position: 'absolute', top: '15px', textAlign: 'center', pointerEvents: 'none' }}>
              <div className="map-label-bg" style={{ fontSize: '10px', color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)', fontWeight: isSelected ? 600 : 400, background: isSelected ? 'rgba(0,0,0,0.6)' : 'transparent', padding: isSelected ? '2px 6px' : '0' }}>
                {inc.location || inc.title}
              </div>
            </div>
         )}
      </div>
    </AdvancedMarker>
  );
});
