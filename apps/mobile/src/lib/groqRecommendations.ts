import {
  fetchTravelRecommendationsFromGroq as fetchTravelRecommendationsFromGroqCore,
  type NearbyPoiRow,
  type TravelRecommendation,
} from "@pocketguide/core";

export type { NearbyPoiRow, TravelRecommendation };

function apiBaseUrl(): string {
  return (process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Yakındaki POI’ları Nest API’den alır, metni cihazda Groq ile üretir (web’deki `VITE_GROQ_API_KEY` ile aynı değer → `EXPO_PUBLIC_GROQ_API_KEY`).
 */
export async function fetchTravelRecommendationsFromGroq(
  lat: number,
  lng: number,
): Promise<TravelRecommendation[]> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "EXPO_PUBLIC_GROQ_API_KEY tanımlı değil. `apps/mobile/.env` içine web’deki Groq anahtarını aynı değerle yazın; Expo’yu yeniden başlatın.",
    );
  }

  return fetchTravelRecommendationsFromGroqCore({
    lat,
    lng,
    apiBaseUrl: apiBaseUrl(),
    groqApiKey: apiKey,
  });
}
