import {
  fetchTravelRecommendationsFromGroq as fetchTravelRecommendationsFromGroqCore,
  askGroqTravelAssistant as askGroqTravelAssistantCore,
  type NearbyPoiRow,
  type TravelRecommendation,
} from "@pocketguide/core";

export type { NearbyPoiRow, TravelRecommendation };

/**
 * Yakındaki POI + şehir sorusunda explore yedeklemesi; Groq ile yapılandırılmış öneriler.
 */
export async function fetchTravelRecommendationsFromGroq(
  lat: number,
  lng: number,
  userPrompt?: string,
  citySlug?: string,
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
    userPrompt,
    citySlug,
    apiBaseUrl: "",
    groqApiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export async function askGroqTravelAssistant(
  userPrompt: string,
  coords?: { lat: number; lng: number },
  candidates?: TravelRecommendation[],
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "VITE_GROQ_API_KEY tanımlı değil. Groq anahtarını `apps/web/.env` içine `VITE_GROQ_API_KEY=...` olarak yazın.",
    );
  }

  return askGroqTravelAssistantCore({
    groqApiKey: apiKey,
    userPrompt,
    userLocation: coords,
    candidates,
    dangerouslyAllowBrowser: true,
  });
}
