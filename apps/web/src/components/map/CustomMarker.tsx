import { DivIcon } from 'leaflet';
import { Marker } from 'react-leaflet';
import { POICategory } from '../../types/poi';
import { PIN_COLORS, PIN_ICONS } from '../../constants/mapConfig';
import styles from './CustomMarker.module.css';

interface CustomMarkerProps {
  position: [number, number];
  category: POICategory;
  selected?: boolean;
  onClick?: () => void;
}

export function CustomMarker({ position, category, selected, onClick }: CustomMarkerProps) {
  const color = PIN_COLORS[category];
  const iconText = PIN_ICONS[category];

  const html = `
    <div class="${styles.markerContainer} ${selected ? styles.selected : ''}" style="--marker-color: ${color}">
      <div class="${styles.markerCircle}">
        <span class="${styles.markerIcon}">${iconText}</span>
      </div>
      <div class="${styles.markerArrow}"></div>
    </div>
  `;

  const dynamicIcon = new DivIcon({
    html,
    className: styles.leafletDivIconFix,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
  });

  return (
    <Marker 
      position={position} 
      icon={dynamicIcon} 
      eventHandlers={{
        click: () => onClick?.(),
      }} 
    />
  );
}
