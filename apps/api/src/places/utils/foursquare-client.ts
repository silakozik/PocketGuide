import axios from 'axios';
import type { RawFoursquareVenue } from '@pocketguide/types';
import { getFoursquareAuthHeaders } from './foursquare-auth';

const DEFAULT_BASE = 'https://places-api.foursquare.com';

export function getFoursquareSearchUrl(): string {
  const base = (process.env.FOURSQUARE_API_BASE_URL ?? DEFAULT_BASE).replace(/\/$/, '');
  return `${base}/places/search`;
}

/** Yeni Places API yanıtını mevcut mapper ile uyumlu forma çevirir */
export function normalizeFoursquareVenue(raw: Record<string, unknown>): RawFoursquareVenue {
  const categories = (raw.categories as { name?: string }[] | undefined) ?? [];
  const location = raw.location as { formatted_address?: string; address?: string } | undefined;

  return {
    fsq_id: String(raw.fsq_place_id ?? raw.fsq_id ?? ''),
    name: String(raw.name ?? 'Unknown'),
    geocodes: {
      main: {
        latitude: Number(raw.latitude ?? (raw.geocodes as { main?: { latitude?: number } })?.main?.latitude ?? 0),
        longitude: Number(raw.longitude ?? (raw.geocodes as { main?: { longitude?: number } })?.main?.longitude ?? 0),
      },
    },
    location: {
      address: location?.address,
      formatted_address: location?.formatted_address,
    },
    categories: categories.map((c) => ({ name: c.name ?? '' })),
    rating: typeof raw.rating === 'number' ? raw.rating : undefined,
    price: typeof raw.price === 'number' ? raw.price : undefined,
  };
}

export async function searchFoursquarePlaces(params: {
  lat: number;
  lng: number;
  radius: number;
  limit: number;
  categoryIds: string[];
}): Promise<RawFoursquareVenue[]> {
  const res = await axios.get(getFoursquareSearchUrl(), {
    params: {
      ll: `${params.lat},${params.lng}`,
      radius: params.radius,
      limit: params.limit,
      fsq_category_ids: params.categoryIds.join(','),
    },
    headers: getFoursquareAuthHeaders(),
    timeout: 20000,
  });

  const results = (res.data?.results ?? []) as Record<string, unknown>[];
  return results
    .map(normalizeFoursquareVenue)
    .filter((v) => v.fsq_id && v.geocodes.main.latitude && v.geocodes.main.longitude);
}

export async function verifyFoursquareApiKey(): Promise<void> {
  try {
    await searchFoursquarePlaces({
      lat: 41.0082,
      lng: 28.9784,
      radius: 1000,
      limit: 1,
      categoryIds: ['13065'],
    });
  } catch (err: unknown) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const msg =
      (axios.isAxiosError(err) && (err.response?.data as { message?: string })?.message) ||
      (err instanceof Error ? err.message : String(err));

    if (status === 401) {
      throw new Error(
        [
          'Foursquare API anahtarı reddedildi (401).',
          '1) developer.foursquare.com → PocketGuide2 (veya PocketGuide) → Settings → Service API Keys',
          '2) "Generate Service API Key" ile YENİ key oluştur (eski key bir kez gösterilir, yanlış kopyalanmış olabilir)',
          '3) apps/api/.env → FOURSQUARE_API_KEY="fsq3..." (tırnak şart)',
          '4) Geçici veri için: pnpm seed:places:osm (OpenStreetMap, Foursquare gerekmez)',
        ].join('\n'),
      );
    }
    throw new Error(`Foursquare bağlantı testi başarısız: ${msg}`);
  }
}
