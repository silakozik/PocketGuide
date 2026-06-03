export type HomeCity = {
  name: string;
  country: string;
  slug: string;
  emoji: string;
  color: string;
};

/** Web CitiesExplore ile aynı şehir listesi */
export const HOME_CITIES: HomeCity[] = [
  { name: "Paris", country: "Fransa", slug: "paris", emoji: "🗼", color: "#667eea" },
  { name: "Tokyo", country: "Japonya", slug: "tokyo", emoji: "🏯", color: "#f5576c" },
  { name: "New York", country: "ABD", slug: "new-york", emoji: "🗽", color: "#2193b0" },
  { name: "Londra", country: "İngiltere", slug: "londra", emoji: "🎡", color: "#536976" },
  { name: "Roma", country: "İtalya", slug: "roma", emoji: "🏛️", color: "#c79081" },
  { name: "Barcelona", country: "İspanya", slug: "barcelona", emoji: "🌊", color: "#f7971e" },
  { name: "Dubai", country: "BAE", slug: "dubai", emoji: "🏙️", color: "#d4a574" },
  { name: "Amsterdam", country: "Hollanda", slug: "amsterdam", emoji: "🚲", color: "#f46b45" },
  { name: "Sydney", country: "Avustralya", slug: "sydney", emoji: "🦘", color: "#11998e" },
  { name: "İstanbul", country: "Türkiye", slug: "istanbul", emoji: "🕌", color: "#4facfe" },
];

export const TICKER_CITIES = [
  { flag: "🇹🇷", name: "İstanbul" },
  { flag: "🇫🇷", name: "Paris" },
  { flag: "🇯🇵", name: "Tokyo" },
  { flag: "🇬🇧", name: "Londra" },
  { flag: "🇮🇹", name: "Roma" },
  { flag: "🇪🇸", name: "Barselona" },
  { flag: "🇩🇪", name: "Berlin" },
  { flag: "🇺🇸", name: "New York" },
  { flag: "🇳🇱", name: "Amsterdam" },
  { flag: "🇬🇷", name: "Atina" },
  { flag: "🇵🇹", name: "Lizbon" },
  { flag: "🇸🇬", name: "Singapur" },
] as const;

export const DEFAULT_EXPLORE_CITY = "istanbul";
export const LAST_CITY_STORAGE_KEY = "pg_last_city";

export function resolveExploreCitySlug(input: string | null | undefined): string {
  if (!input) return DEFAULT_EXPLORE_CITY;
  return HOME_CITIES.some((c) => c.slug === input) ? input : DEFAULT_EXPLORE_CITY;
}
