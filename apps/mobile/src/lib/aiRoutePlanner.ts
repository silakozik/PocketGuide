import type { GeneratedRoute, RouteTheme } from "@pocketguide/core";

import type { SavedTrip } from "./savedTripsApi";

export const ROUTE_PLANNER_CITIES = [
  { nameTr: "İstanbul", nameEn: "Istanbul", slug: "istanbul" },
  { nameTr: "Paris", nameEn: "Paris", slug: "paris" },
  { nameTr: "Tokyo", nameEn: "Tokyo", slug: "tokyo" },
  { nameTr: "Londra", nameEn: "London", slug: "londra" },
  { nameTr: "Roma", nameEn: "Rome", slug: "roma" },
  { nameTr: "Barcelona", nameEn: "Barcelona", slug: "barcelona" },
  { nameTr: "Dubai", nameEn: "Dubai", slug: "dubai" },
  { nameTr: "Amsterdam", nameEn: "Amsterdam", slug: "amsterdam" },
  { nameTr: "Sydney", nameEn: "Sydney", slug: "sydney" },
  { nameTr: "New York", nameEn: "New York", slug: "new-york" },
];

export const ROUTE_THEME_OPTIONS: {
  id: RouteTheme;
  label: string;
  emoji: string;
}[] = [
  { id: "culture", label: "Kültür & Tarih", emoji: "🏛️" },
  { id: "food", label: "Yeme & İçme", emoji: "🍽️" },
  { id: "nature", label: "Doğa", emoji: "🌿" },
  { id: "adventure", label: "Macera", emoji: "🧗" },
  { id: "shopping", label: "Alışveriş", emoji: "🛍️" },
  { id: "relaxation", label: "Dinlenme", emoji: "🧘" },
  { id: "family", label: "Aile", emoji: "👨‍👩‍👧" },
  { id: "budget", label: "Bütçe Dostu", emoji: "💰" },
];

export const ROUTE_CATEGORY_COLORS: Record<string, string> = {
  culture: "#8b5cf6",
  food: "#10b981",
  transport: "#3b82f6",
  other: "#f59e0b",
};

export const ROUTE_CATEGORY_LABELS: Record<string, string> = {
  culture: "🏛️ Kültür",
  food: "🍽️ Yemek",
  transport: "🚇 Ulaşım",
  other: "📍 Diğer",
};

export function formatRouteThemes(route: GeneratedRoute): string {
  const ids = route.themes?.length ? route.themes : route.theme ? [route.theme] : [];
  return ids
    .map((id) => {
      const t = ROUTE_THEME_OPTIONS.find((x) => x.id === id);
      return t ? `${t.emoji} ${t.label}` : id;
    })
    .join(" · ");
}

export function citySlugForRoute(route: GeneratedRoute): string | null {
  const byTr = ROUTE_PLANNER_CITIES.find((c) => c.nameTr === route.city);
  if (byTr) return byTr.slug;
  const byEn = ROUTE_PLANNER_CITIES.find(
    (c) => c.nameEn.toLowerCase() === route.cityNameEn?.toLowerCase(),
  );
  return byEn?.slug ?? null;
}

export function isAiPlannerTrip(trip: SavedTrip): boolean {
  const rd = trip.routeData;
  if (!rd || typeof rd !== "object") return false;
  return (rd as { type?: string }).type === "ai-route-planner";
}

export function parseAiRouteFromSavedTrip(trip: SavedTrip): GeneratedRoute | null {
  const rd = trip.routeData;
  if (!rd || typeof rd !== "object") return null;
  const o = rd as Record<string, unknown>;
  if (o.type !== "ai-route-planner") return null;
  if (!Array.isArray(o.plan)) return null;

  const themes =
    Array.isArray(o.themes) && o.themes.length > 0
      ? (o.themes as RouteTheme[])
      : o.theme
        ? [o.theme as RouteTheme]
        : [];

  return {
    city: String(o.city ?? trip.cityName ?? ""),
    cityNameEn: String(o.cityNameEn ?? ""),
    days: Number(o.days ?? 0),
    themes,
    theme: o.theme as RouteTheme | undefined,
    title: String(o.title ?? trip.title),
    summary: String(o.summary ?? ""),
    plan: o.plan as GeneratedRoute["plan"],
    tips: Array.isArray(o.tips) ? (o.tips as string[]) : [],
  };
}
