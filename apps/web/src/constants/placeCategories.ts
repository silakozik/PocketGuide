export type ExplorePlaceCategory =
  | "food"
  | "shopping"
  | "entertainment"
  | "culture"
  | "historic";

export interface PlaceCategoryMeta {
  slug: ExplorePlaceCategory;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
}

export const PLACE_CATEGORIES: PlaceCategoryMeta[] = [
  {
    slug: "food",
    title: "Restoranlar",
    subtitle: "Yemek & kafe",
    emoji: "🍜",
    gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  },
  {
    slug: "shopping",
    title: "Alışveriş",
    subtitle: "AVM & mağazalar",
    emoji: "🛍️",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    slug: "entertainment",
    title: "Eğlence",
    subtitle: "Gece hayatı & etkinlik",
    emoji: "🎭",
    gradient: "linear-gradient(135deg, #f5576c 0%, #c0392b 100%)",
  },
  {
    slug: "culture",
    title: "Kültür",
    subtitle: "Müze & sanat",
    emoji: "🎨",
    gradient: "linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%)",
  },
  {
    slug: "historic",
    title: "Tarihi Yerler",
    subtitle: "Anıt & miras",
    emoji: "🏛️",
    gradient: "linear-gradient(135deg, #c79081 0%, #dfa579 100%)",
  },
];

export function getPlaceCategory(slug: string): PlaceCategoryMeta | undefined {
  return PLACE_CATEGORIES.find((c) => c.slug === slug);
}

export function isExplorePlaceCategory(slug: string): slug is ExplorePlaceCategory {
  return PLACE_CATEGORIES.some((c) => c.slug === slug);
}
