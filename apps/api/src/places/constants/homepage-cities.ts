/** Ana sayfadaki 10 şehir — seed ve explore için ortak kaynak */
export interface HomepageCity {
  slug: string;
  nameEn: string;
  nameTr: string;
  countryCode: string;
  lat: number;
  lng: number;
}

export const HOMEPAGE_CITIES: HomepageCity[] = [
  { slug: 'paris', nameEn: 'Paris', nameTr: 'Paris', countryCode: 'FR', lat: 48.8566, lng: 2.3522 },
  { slug: 'tokyo', nameEn: 'Tokyo', nameTr: 'Tokyo', countryCode: 'JP', lat: 35.6762, lng: 139.6503 },
  { slug: 'new-york', nameEn: 'New York', nameTr: 'New York', countryCode: 'US', lat: 40.7128, lng: -74.006 },
  { slug: 'londra', nameEn: 'London', nameTr: 'Londra', countryCode: 'GB', lat: 51.5074, lng: -0.1278 },
  { slug: 'roma', nameEn: 'Rome', nameTr: 'Roma', countryCode: 'IT', lat: 41.9028, lng: 12.4964 },
  { slug: 'barcelona', nameEn: 'Barcelona', nameTr: 'Barcelona', countryCode: 'ES', lat: 41.3874, lng: 2.1686 },
  { slug: 'dubai', nameEn: 'Dubai', nameTr: 'Dubai', countryCode: 'AE', lat: 25.2048, lng: 55.2708 },
  { slug: 'amsterdam', nameEn: 'Amsterdam', nameTr: 'Amsterdam', countryCode: 'NL', lat: 52.3676, lng: 4.9041 },
  { slug: 'sydney', nameEn: 'Sydney', nameTr: 'Sydney', countryCode: 'AU', lat: -33.8688, lng: 151.2093 },
  { slug: 'istanbul', nameEn: 'Istanbul', nameTr: 'İstanbul', countryCode: 'TR', lat: 41.0082, lng: 28.9784 },
];

export function getHomepageCity(slug: string): HomepageCity | undefined {
  return HOMEPAGE_CITIES.find((c) => c.slug === slug);
}
