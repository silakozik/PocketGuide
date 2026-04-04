/**
 * Bu dosya, farklı dış kaynaklardan (OpenStreetMap, Foursquare, GTFS vb.) gelen
 * ham "Point of Interest" (İlgi Çekici Nokta) verilerinin tip tanımlamalarını içerir.
 */

export interface RawOSMPlace {
    id: number;
    lat: string;
    lon: string;
    tags: {
        name?: string;
        amenity?: string;
        cuisine?: string;
    };
}

export interface RawFoursquareVenue {
    fsq_id: string;
    name: string;
    geocodes: { main: { latitude: number; longitude: number } };
    location: { address?: string };
    categories: { name: string }[];
}

export interface RawGTFSStop {
    stop_id: string;
    stop_name: string;
    stop_lat: number;
    stop_lon: number;
}

export interface RawGooglePlace {
    place_id: string;
    name: string;
    geometry: {
        location: {
            lat: number;
            lng: number;
        }
    };
    vicinity?: string;
    types?: string[];
}

export enum PoiCategory {
    RESTAURANT = 'restaurant',
    CAFE = 'cafe',
    TRANSPORT_STOP = 'transport_stop',
    ATTRACTION = 'attraction',
    ACCOMMODATION = 'accommodation',
    SHOPPING = 'shopping',
    OTHER = 'other'
}

export interface NormalizedPOI {
    id?: string;
    sourceId: string;
    provider: 'google' | 'foursquare' | 'gtfs' | 'osm';
    name: string;
    category: PoiCategory;
    address: string | null;
    lat: number;
    lng: number;
}