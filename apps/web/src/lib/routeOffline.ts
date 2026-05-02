import type { RouteData } from "../types/route";

export function compositeRouteIdFromRouteData(rd: RouteData): string {
  return rd.ordered_pois.map((p) => p.id).join("__");
}
