import { POICategory } from '../types/poi';

export const PIN_COLORS: Record<POICategory, string> = {
  restaurant: '#D85A30',
  museum: '#534AB7',
  transport: '#185FA5',
  event: '#1D9E75',
  hotel: '#BA7517',
  park: '#15803d',
};

export const PIN_ICONS: Record<POICategory, string> = {
  restaurant: '🍽️',
  museum: '🏛️',
  transport: '🚌',
  event: '🎭',
  hotel: '🏨',
  park: '🌳',
};
