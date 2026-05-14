import {
  fetchTravelRecommendationsFromGroq as fetchTravelRecommendationsFromGroqCore,
  type NearbyPoiRow,
  type TravelRecommendation,
} from "@pocketguide/core";

export type { NearbyPoiRow, TravelRecommendation };

/**
 * Loads nearby POIs from the Nest API (Vite proxy → `/api`), then asks Groq for structured recommendations.
 */
export async function fetchTravelRecommendationsFromGroq(
  lat: number,
  lng: number,
): Promise<TravelRecommendation[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "VITE_GROQ_API_KEY tanımlı değil. Groq anahtarını `apps/web/.env` içine `VITE_GROQ_API_KEY=...` olarak yazın (sadece `apps/api/.env` yeterli değildir). Kaydettikten sonra `pnpm dev` / Vite sunucusunu yeniden başlatın.",
    );
  }

  return fetchTravelRecommendationsFromGroqCore({
    lat,
    lng,
    apiBaseUrl: "",
    groqApiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}
