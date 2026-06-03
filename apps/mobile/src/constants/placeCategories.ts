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
  color: string;
}

export const PLACE_CATEGORIES: PlaceCategoryMeta[] = [
  {
    slug: "food",
    title: "Restoranlar",
    subtitle: "Yemek & kafe",
    emoji: "🍜",
    color: "#f7971e",
  },
  {
    slug: "shopping",
    title: "Alışveriş",
    subtitle: "AVM & mağazalar",
    emoji: "🛍️",
    color: "#667eea",
  },
  {
    slug: "entertainment",
    title: "Eğlence",
    subtitle: "Gece hayatı & etkinlik",
    emoji: "🎭",
    color: "#f5576c",
  },
  {
    slug: "culture",
    title: "Kültür",
    subtitle: "Müze & sanat",
    emoji: "🎨",
    color: "#2193b0",
  },
  {
    slug: "historic",
    title: "Tarihi Yerler",
    subtitle: "Anıt & miras",
    emoji: "🏛️",
    color: "#c79081",
  },
];

export function getPlaceCategory(slug: string): PlaceCategoryMeta | undefined {
  return PLACE_CATEGORIES.find((c) => c.slug === slug);
}

export function isExplorePlaceCategory(slug: string): slug is ExplorePlaceCategory {
  return PLACE_CATEGORIES.some((c) => c.slug === slug);
}
