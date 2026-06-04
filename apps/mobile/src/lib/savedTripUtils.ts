import type { SavedTrip } from "./savedTripsApi";

export function isAiPlannerTrip(trip: SavedTrip): boolean {
  const rd = trip.routeData;
  if (!rd || typeof rd !== "object") return false;
  return (rd as { type?: string }).type === "ai-route-planner";
}

export function formatTripDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}
