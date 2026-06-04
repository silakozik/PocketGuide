import type { ExplorePlaceCategory } from "@/src/constants/placeCategories";
import { apiUrl } from "./api";

export interface ExplorePlaceItem {
  id: string;
  name: string;
  category: string;
  address: string | null;
  description: string | null;
  rating: number | null;
  priceLevel: number | null;
  lat: number;
  lng: number;
}

export interface ExplorePlacesResponse {
  data: ExplorePlaceItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    city: string;
    cityName: string;
    placeCategory: string;
    categoryTitle: string;
  };
}

export async function fetchExplorePlaces(
  city: string,
  placeCategory: ExplorePlaceCategory,
  options?: { limit?: number; offset?: number },
): Promise<ExplorePlacesResponse> {
  const params = new URLSearchParams({
    city,
    placeCategory,
    limit: String(options?.limit ?? 30),
    offset: String(options?.offset ?? 0),
  });

  const res = await fetch(`${apiUrl("/pois/explore")}?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Explore fetch failed (${res.status})`);
  }

  return res.json() as Promise<ExplorePlacesResponse>;
}
