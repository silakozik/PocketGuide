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