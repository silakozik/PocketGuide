export {
  isAiPlannerTrip,
  parseAiRouteFromSavedTrip,
} from "./aiRoutePlanner";

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
