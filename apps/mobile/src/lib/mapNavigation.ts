import type { Router } from "expo-router";

/** Haritaya nereden gelindiğini belirtir; geri tuşu işlem sırasına göre döner. */
export type MapFrom =
  | "city"
  | "explore"
  | "first-day"
  | "saved-route"
  | "profile";

export type MapNavParams = {
  city?: string;
  lat?: string;
  lng?: string;
  name?: string;
  mapFrom?: MapFrom;
  /** explore geri dönüşü için */
  placeCategory?: string;
  /** saved-route / profile için */
  tripId?: string;
};

export function buildMapNavParams(
  base: Omit<MapNavParams, "mapFrom"> & { mapFrom?: MapFrom },
): MapNavParams {
  const out: MapNavParams = {};
  if (base.city) out.city = base.city;
  if (base.lat != null) out.lat = String(base.lat);
  if (base.lng != null) out.lng = String(base.lng);
  if (base.name) out.name = base.name;
  if (base.mapFrom) out.mapFrom = base.mapFrom;
  if (base.placeCategory) out.placeCategory = base.placeCategory;
  if (base.tripId) out.tripId = base.tripId;
  return out;
}

export function navigateMapBack(
  router: Router,
  params: {
    mapFrom?: string;
    city?: string;
    placeCategory?: string;
    tripId?: string;
  },
): void {
  const mapFrom = params.mapFrom as MapFrom | undefined;
  const city = params.city?.trim();

  switch (mapFrom) {
    case "city":
      if (city) {
        router.push(`/${city}` as never);
        return;
      }
      break;
    case "explore": {
      const cat = params.placeCategory?.trim();
      if (cat) {
        router.push({
          pathname: "/explore/[placeCategory]",
          params: { placeCategory: cat, city: city ?? "istanbul" },
        } as never);
        return;
      }
      break;
    }
    case "first-day":
      if (city) {
        router.push({
          pathname: "/[citySlug]/first-day",
          params: { citySlug: city },
        } as never);
        return;
      }
      break;
    case "saved-route":
      if (params.tripId?.trim()) {
        router.push(`/plan/saved/${params.tripId}` as never);
        return;
      }
      break;
    case "profile":
      router.push("/profile" as never);
      return;
    default:
      break;
  }

  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.push("/(tabs)" as never);
}
