import type { POICategory } from "@/src/types/poi";

export const PIN_COLORS: Record<POICategory, string> = {
  restaurant: "#D85A30",
  museum: "#534AB7",
  transport: "#185FA5",
  event: "#1D9E75",
  hotel: "#BA7517",
};

export const PIN_ICONS: Record<POICategory, string> = {
  restaurant: "🍽️",
  museum: "🏛️",
  transport: "🚇",
  event: "🎭",
  hotel: "🏨",
};

export type ClusterSizeBreakpoint = {
  max: number; // inclusive
  size: number; // circle size
  color: string;
};

export const CLUSTER_SIZE_BREAKPOINTS: ClusterSizeBreakpoint[] = [
  { max: 9, size: 36, color: "#1D9E75" },
  { max: 49, size: 46, color: "#185FA5" },
  { max: 99, size: 58, color: "#993C1D" },
  { max: Number.POSITIVE_INFINITY, size: 70, color: "#3C3489" },
];

