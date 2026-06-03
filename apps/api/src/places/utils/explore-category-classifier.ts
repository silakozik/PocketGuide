import type { ExplorePlaceCategory } from '../constants/explore-categories';

/** Foursquare / OSM alt tip metninden explore kategorisi çıkarır. */
export function classifyExploreCategoryFromLabels(
  labels: string[],
): ExplorePlaceCategory | null {
  const text = labels
    .map((l) => l.toLowerCase())
    .join(' ');

  if (!text.trim()) return null;

  const has = (...needles: string[]) => needles.some((n) => text.includes(n));

  if (
    has(
      'nightclub',
      'night club',
      'dance club',
      'karaoke',
      'comedy club',
      'bowling',
      'arcade',
      'casino',
      'music venue',
      'concert',
      'stadium',
      'arena',
      'movie theater',
      'movie theatre',
      'cinema',
      'multicines',
      'drive-in',
      'performing arts',
      'theatre',
      'theater',
      'opera',
      'amphitheatre',
      'amphitheater',
      'gece',
    )
  ) {
    return 'entertainment';
  }

  if (
    has(
      'museum',
      'art gallery',
      'gallery',
      'arts centre',
      'arts center',
      'cultural center',
      'cultural centre',
      'exhibition',
      'library',
      'müze',
      'sanat',
    )
  ) {
    return 'culture';
  }

  if (has('historic', 'monument', 'memorial', 'castle', 'palace', 'ruins', 'heritage')) {
    return 'historic';
  }

  return null;
}

export function classifyFoursquareVenueCategory(
  categories: { name?: string }[] = [],
): ExplorePlaceCategory | null {
  return classifyExploreCategoryFromLabels(
    categories.map((c) => c.name ?? '').filter(Boolean),
  );
}
