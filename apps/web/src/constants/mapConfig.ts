import { POICategory } from '../types/poi';

export const PIN_COLORS: Record<POICategory, string> = {
  restaurant: '#D85A30',
  museum: '#534AB7',
  transport: '#185FA5',
  event: '#1D9E75',
  hotel: '#BA7517'
};

export const PIN_ICONS: Record<POICategory, string> = {
  restaurant: '🍽️',
  museum: '🏛️',
  transport: '🚌',
  event: '🎭',
  hotel: '🏨'
};

export const CLUSTER_SIZE_BREAKPOINTS = [
  { max: 9, size: 36, color: '#1D9E75' },
  { max: 49, size: 46, color: '#185FA5' },
  { max: 99, size: 58, color: '#993C1D' },
  { max: Infinity, size: 70, color: '#3C3489' }
];
