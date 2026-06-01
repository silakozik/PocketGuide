/** CitiesExplore + CityHub ile uyumlu şehir listesi */
const CITY_ENTRIES: { slug: string; names: string[] }[] = [
  { slug: "paris", names: ["paris"] },
  { slug: "tokyo", names: ["tokyo", "tokio"] },
  { slug: "new-york", names: ["new-york", "new york", "newyork", "nyc"] },
  { slug: "londra", names: ["londra", "london", "lonra"] },
  { slug: "roma", names: ["roma", "rome"] },
  { slug: "barcelona", names: ["barcelona"] },
  { slug: "dubai", names: ["dubai"] },
  { slug: "amsterdam", names: ["amsterdam"] },
  { slug: "sydney", names: ["sydney", "sidney"] },
  { slug: "istanbul", names: ["istanbul", "ist"] },
];

const SLUG_ALIASES: Record<string, string> = {
  london: "londra",
  rome: "roma",
};

/** Kullanıcı girdisini URL slug'ına çevirir; bilinmeyen şehir için null */
export function resolveCitySlug(input: string): string | null {
  const q = normalizeCityQuery(input);
  if (!q) return null;

  if (SLUG_ALIASES[q]) return SLUG_ALIASES[q];

  for (const entry of CITY_ENTRIES) {
    if (entry.slug === q) return entry.slug;
    if (entry.names.includes(q)) return entry.slug;
    const flat = q.replace(/-/g, "");
    if (entry.names.some((n) => n.replace(/-/g, "") === flat)) return entry.slug;
  }

  return null;
}

function normalizeCityQuery(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, "-");
}
