import { useEffect, useRef } from 'react';
import { Polyline, useMap, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useRoute } from '../../context/RouteContext';
import './RoutePolyline.css';

// Tailwind / CSS class animasyonlarını kullanmak için Leaflet pathOptions:
const routeOptions = { 
  color: '#3B82F6', // Tailwind blue-500
  weight: 5,
  opacity: 0.8,
  dashArray: '10, 10',
  className: 'route-polyline-animated' // We will add this to index.css
};

// Start and End Icons
const createNumberedIcon = (num: number, type: 'start' | 'end' | 'mid') => {
  let bgColor = '#3B82F6';
  if (type === 'start') bgColor = '#10B981'; // green-500
  if (type === 'end') bgColor = '#EF4444'; // red-500

  return L.divIcon({
    className: 'custom-route-marker',
    html: `
      <div style="
        background-color: ${bgColor}; 
        color: white; 
        border-radius: 50%; 
        width: 24px; 
        height: 24px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-weight: bold; 
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${num}
      </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export function RoutePolyline() {
  const { isActive, routeData, activeLegIndex, activeStepIndex } = useRoute();
  const map = useMap();
  const polylineRef = useRef<L.Polyline>(null);

  // Genel fitBounds
  useEffect(() => {
    if (isActive && routeData?.geometry.length) {
      const bounds = L.latLngBounds(routeData.geometry);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [isActive, routeData, map]);

  // Adim bazli flyTo
  useEffect(() => {
    if (isActive && routeData) {
       const activeLeg = routeData.legs[activeLegIndex];
       const activeStep = activeLeg?.steps[activeStepIndex];
       if (activeStep && activeStep.way_points?.length) {
         const pointIndex = activeStep.way_points[0];
         const point = routeData.geometry[pointIndex];
         if (point) {
            map.flyTo(point, 16, { animate: true, duration: 1.5 });
         }
       }
    }
  }, [isActive, map, routeData, activeLegIndex, activeStepIndex]);

  if (!isActive || !routeData) {
    return null;
  }

  return (
    <>
      <Polyline 
        ref={polylineRef}
        positions={routeData.geometry} 
        pathOptions={routeOptions} 
      />

      {routeData.ordered_pois.map((poi, index) => {
        const isStart = index === 0;
        const isEnd = index === routeData.ordered_pois.length - 1;
        const type = isStart ? 'start' : isEnd ? 'end' : 'mid';
        const num = index + 1;
        
        return (
          <Marker 
            key={`route-poi-${poi.id}`} 
            position={[poi.coordinate.lat, poi.coordinate.lng]}
            icon={createNumberedIcon(num, type)}
          >
            <Popup>
              <strong>{num}. {poi.name}</strong>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
