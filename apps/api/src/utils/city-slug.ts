/** URL slug → DB slug eşlemesi (london → londra gibi) */
const SLUG_ALIASES: Record<string, string> = {
  london: 'londra',
  rome: 'roma',
};

export function resolveCitySlug(slug: string): string {
  return SLUG_ALIASES[slug.toLowerCase()] ?? slug;
}
