/** Ana sayfa / seed ile aynı 10 şehir */
export interface HomepageCityRef {
  slug: string;
  nameEn: string;
  nameTr: string;
  lat: number;
  lng: number;
}

export const HOMEPAGE_CITIES: HomepageCityRef[] = [
  { slug: "paris", nameEn: "Paris", nameTr: "Paris", lat: 48.8566, lng: 2.3522 },
  { slug: "tokyo", nameEn: "Tokyo", nameTr: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { slug: "new-york", nameEn: "New York", nameTr: "New York", lat: 40.7128, lng: -74.006 },
  { slug: "londra", nameEn: "London", nameTr: "Londra", lat: 51.5074, lng: -0.1278 },
  { slug: "roma", nameEn: "Rome", nameTr: "Roma", lat: 41.9028, lng: 12.4964 },
  { slug: "barcelona", nameEn: "Barcelona", nameTr: "Barcelona", lat: 41.3874, lng: 2.1686 },
  { slug: "dubai", nameEn: "Dubai", nameTr: "Dubai", lat: 25.2048, lng: 55.2708 },
  { slug: "amsterdam", nameEn: "Amsterdam", nameTr: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  { slug: "sydney", nameEn: "Sydney", nameTr: "Sydney", lat: -33.8688, lng: 151.2093 },
  { slug: "istanbul", nameEn: "Istanbul", nameTr: "İstanbul", lat: 41.0082, lng: 28.9784 },
];

const SLUG_ALIASES: Record<string, string> = {
  london: "londra",
  rome: "roma",
  roma: "roma",
  istanbul: "istanbul",
  ist: "istanbul",
  nyc: "new-york",
  "new york": "new-york",
  newyork: "new-york",
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/İ/g, "i");
}

export function resolveCityFromPrompt(text: string): HomepageCityRef | null {
  const raw = text.trim();
  if (!raw) return null;
  const n = normalizeText(raw);

  for (const city of HOMEPAGE_CITIES) {
    const slug = normalizeText(city.slug);
    const tr = normalizeText(city.nameTr);
    const en = normalizeText(city.nameEn);
    const patterns = [
      new RegExp(`\\b${slug}(?:'?(?:da|de|ta|te|dan|den))?\\b`, "i"),
      new RegExp(`\\b${tr}(?:'?(?:da|de|ta|te|dan|den))?\\b`, "i"),
      new RegExp(`\\b${en}(?:'?(?:da|de|ta|te|dan|den))?\\b`, "i"),
    ];
    if (patterns.some((p) => p.test(n))) return city;
  }

  for (const [alias, slug] of Object.entries(SLUG_ALIASES)) {
    if (n.includes(alias)) {
      return HOMEPAGE_CITIES.find((c) => c.slug === slug) ?? null;
    }
  }

  return null;
}
