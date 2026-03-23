export type POICategory = "restaurant" | "museum" | "transport" | "event" | "hotel";

export interface POI {
  id: string;
  name: string;
  category: POICategory;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  distance?: number;
  isOpen?: boolean;
  description?: string;
}

