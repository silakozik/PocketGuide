import { DivIcon } from 'leaflet';
import { Marker } from 'react-leaflet';
import { CLUSTER_SIZE_BREAKPOINTS } from '../../constants/mapConfig';
import styles from './ClusterMarker.module.css';

interface ClusterMarkerProps {
  position: [number, number];
  count: number;
  onClick?: () => void;
}

export function ClusterMarker({ position, count, onClick }: ClusterMarkerProps) {
  const breakpoint = CLUSTER_SIZE_BREAKPOINTS.find((bp) => count <= bp.max) || CLUSTER_SIZE_BREAKPOINTS[CLUSTER_SIZE_BREAKPOINTS.length - 1];
  
  const size = breakpoint.size;
  const color = breakpoint.color;
  const displayCount = count >= 100 ? '99+' : count.toString();

  const html = `
    <div 
      class="${styles.clusterMarker}" 
      style="
        --cluster-color: ${color}; 
        --cluster-size: ${size}px;
      "
    >
      <div class="${styles.clusterInner}">
        ${displayCount}
      </div>
    </div>
  `;

  const clusterIcon = new DivIcon({
    html,
    className: styles.leafletDivIconFix,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  return (
    <Marker 
      position={position} 
      icon={clusterIcon} 
      eventHandlers={{
        click: () => onClick?.(),
      }} 
    />
  );
}
