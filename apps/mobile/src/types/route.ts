import type { POI } from "@/src/types/poi";

export interface RouteStep {
  distance: number;
  duration: number;
  type: number;
  instruction: string;
  name: string;
  way_points: [number, number];
}

export interface RouteLeg {
  distance: number;
  duration: number;
  steps: RouteStep[];
}

export interface RouteData {
  ordered_pois: POI[];
  total_duration_min: number;
  total_distance_km: number;
  geometry: [number, number][]; // [latitude, longitude]
  legs: RouteLeg[];
  summary: {
    distance: number;
    duration: number;
  };
}

export interface RouteState {
  isActive: boolean;
  isFetching: boolean;
  routeData: RouteData | null;
  activeStepIndex: number;
  activeLegIndex: number;
  error: string | null;
  draftPOIs: POI[];
}

