import { NormalizedPOI, PoiCategory, RawFoursquareVenue, RawGooglePlace, RawGTFSStop } from '@pocketguide/types';

function mapGoogleCategory(types: string[] = []): PoiCategory {
    const typeStr = types.join(' ');
    if (typeStr.includes('restaurant') || typeStr.includes('food')) return PoiCategory.RESTAURANT;
    if (typeStr.includes('cafe') || typeStr.includes('bakery')) return PoiCategory.CAFE;
    if (typeStr.includes('transit') || typeStr.includes('station')) return PoiCategory.TRANSPORT_STOP;
    if (typeStr.includes('museum') || typeStr.includes('tourist_attraction')) return PoiCategory.ATTRACTION;
    if (typeStr.includes('lodging')) return PoiCategory.ACCOMMODATION;
    if (typeStr.includes('store') || typeStr.includes('shopping')) return PoiCategory.SHOPPING;
    return PoiCategory.OTHER;
}

function mapFoursquareCategory(categories: { name: string }[] = []): PoiCategory {
    const names = categories.map(c => c.name.toLowerCase()).join(' ');
    if (names.includes('restaurant') || names.includes('diner')) return PoiCategory.RESTAURANT;
    if (names.includes('cafe') || names.includes('coffee')) return PoiCategory.CAFE;
    if (names.includes('transit') || names.includes('station') || names.includes('bus')) return PoiCategory.TRANSPORT_STOP;
    if (names.includes('museum') || names.includes('historic') || names.includes('attraction')) return PoiCategory.ATTRACTION;
    if (names.includes('hotel') || names.includes('hostel')) return PoiCategory.ACCOMMODATION;
    if (names.includes('shop') || names.includes('mall')) return PoiCategory.SHOPPING;
    return PoiCategory.OTHER;
}

export function mapGoogleToPOI(raw: RawGooglePlace): NormalizedPOI {
    return {
        sourceId: raw.place_id,
        provider: 'google',
        name: raw.name || 'Unknown',
        category: mapGoogleCategory(raw.types),
        address: raw.vicinity || null,
        lat: raw.geometry?.location?.lat || 0,
        lng: raw.geometry?.location?.lng || 0,
    };
}

export function mapFoursquareToPOI(raw: RawFoursquareVenue): NormalizedPOI {
    return {
        sourceId: raw.fsq_id,
        provider: 'foursquare',
        name: raw.name || 'Unknown',
        category: mapFoursquareCategory(raw.categories),
        address: raw.location?.address || null,
        lat: raw.geocodes?.main?.latitude || 0,
        lng: raw.geocodes?.main?.longitude || 0,
    };
}

export function mapGtfsToPOI(raw: RawGTFSStop): NormalizedPOI {
    return {
        sourceId: raw.stop_id,
        provider: 'gtfs',
        name: raw.stop_name || 'Unknown',
        category: PoiCategory.TRANSPORT_STOP,
        address: null, // GTFS usually doesn't have a reliable street address string
        lat: Number(raw.stop_lat) || 0,
        lng: Number(raw.stop_lon) || 0,
    };
}
