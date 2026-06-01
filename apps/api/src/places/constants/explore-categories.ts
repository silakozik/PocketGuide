/** Mekanları Keşfet — UI kategori slug'ları ve Foursquare category ID'leri */
export type ExplorePlaceCategory =
  | 'food'
  | 'shopping'
  | 'entertainment'
  | 'culture'
  | 'historic';

export interface ExploreCategoryMeta {
  slug: ExplorePlaceCategory;
  titleTr: string;
  subtitleTr: string;
  emoji: string;
  gradient: string;
  /** DB `pois.category` değeri (ingest sırasında yazılır) */
  dbCategory: ExplorePlaceCategory;
  /** Foursquare Places API (2025) fsq_category_ids — hex taxonomy, not legacy 130xx */
  foursquareCategoryIds: string[];
}

export const EXPLORE_CATEGORIES: ExploreCategoryMeta[] = [
  {
    slug: 'food',
    titleTr: 'Restoranlar',
    subtitleTr: 'Yemek & kafe',
    emoji: '🍜',
    gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
    dbCategory: 'food',
    foursquareCategoryIds: ['4d4b7105d754a06374d81259'],
  },
  {
    slug: 'shopping',
    titleTr: 'Alışveriş',
    subtitleTr: 'AVM & mağazalar',
    emoji: '🛍️',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    dbCategory: 'shopping',
    foursquareCategoryIds: ['4d4b7105d754a06378d81259'],
  },
  {
    slug: 'entertainment',
    titleTr: 'Eğlence',
    subtitleTr: 'Gece hayatı & etkinlik',
    emoji: '🎭',
    gradient: 'linear-gradient(135deg, #f5576c 0%, #c0392b 100%)',
    dbCategory: 'entertainment',
    foursquareCategoryIds: ['4d4b7104d754a06370d81259'],
  },
  {
    slug: 'culture',
    titleTr: 'Kültür',
    subtitleTr: 'Müze & sanat',
    emoji: '🎨',
    gradient: 'linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)',
    dbCategory: 'culture',
    foursquareCategoryIds: ['4d4b7104d754a06370d81259'],
  },
  {
    slug: 'historic',
    titleTr: 'Tarihi Yerler',
    subtitleTr: 'Anıt & miras',
    emoji: '🏛️',
    gradient: 'linear-gradient(135deg, #c79081 0%, #dfa579 100%)',
    dbCategory: 'historic',
    foursquareCategoryIds: ['4d4b7105d754a06377d81259'],
  },
];

export function getExploreCategory(slug: string): ExploreCategoryMeta | undefined {
  return EXPLORE_CATEGORIES.find((c) => c.slug === slug);
}

export function isExplorePlaceCategory(slug: string): slug is ExplorePlaceCategory {
  return EXPLORE_CATEGORIES.some((c) => c.slug === slug);
}
