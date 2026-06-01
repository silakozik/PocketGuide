export interface HomepageCityOption {
  slug: string;
  nameTr: string;
  nameEn: string;
}

/** Ana sayfa şehirleri — explore şehir seçici ile uyumlu */
export const HOMEPAGE_CITIES: HomepageCityOption[] = [
  { slug: "paris", nameTr: "Paris", nameEn: "Paris" },
  { slug: "tokyo", nameTr: "Tokyo", nameEn: "Tokyo" },
  { slug: "new-york", nameTr: "New York", nameEn: "New York" },
  { slug: "londra", nameTr: "Londra", nameEn: "London" },
  { slug: "roma", nameTr: "Roma", nameEn: "Rome" },
  { slug: "barcelona", nameTr: "Barcelona", nameEn: "Barcelona" },
  { slug: "dubai", nameTr: "Dubai", nameEn: "Dubai" },
  { slug: "amsterdam", nameTr: "Amsterdam", nameEn: "Amsterdam" },
  { slug: "sydney", nameTr: "Sydney", nameEn: "Sydney" },
  { slug: "istanbul", nameTr: "İstanbul", nameEn: "Istanbul" },
];

export const DEFAULT_EXPLORE_CITY = "istanbul";

export const LAST_CITY_STORAGE_KEY = "pg_last_city";

export function getHomepageCity(slug: string): HomepageCityOption | undefined {
  return HOMEPAGE_CITIES.find((c) => c.slug === slug);
}

export function resolveExploreCitySlug(input: string | null | undefined): string {
  if (!input) return DEFAULT_EXPLORE_CITY;
  const found = HOMEPAGE_CITIES.find((c) => c.slug === input);
  return found?.slug ?? DEFAULT_EXPLORE_CITY;
}
