import {
  fetchTravelRecommendationsFromGroq as fetchTravelRecommendationsFromGroqCore,
  askGroqTravelAssistant as askGroqTravelAssistantCore,
  type NearbyPoiRow,
  type TravelRecommendation,
} from "@pocketguide/core";

import { apiBaseUrl } from "./api";

export type { NearbyPoiRow, TravelRecommendation };

/**
 * Yakındaki POI + şehir sorusunda explore yedeklemesi; Groq ile yapılandırılmış öneriler (web ile aynı).
 */
export async function fetchTravelRecommendationsFromGroq(
  lat: number,
  lng: number,
  userPrompt?: string,
  citySlug?: string,
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
    userPrompt,
    citySlug,
    apiBaseUrl: apiBaseUrl(),
    groqApiKey: apiKey,
  });
}

export async function askGroqTravelAssistant(
  userPrompt: string,
  coords?: { lat: number; lng: number },
  candidates?: TravelRecommendation[],
): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "EXPO_PUBLIC_GROQ_API_KEY tanımlı değil. `apps/mobile/.env` içine web’deki Groq anahtarını aynı değerle yazın.",
    );
  }

  return askGroqTravelAssistantCore({
    groqApiKey: apiKey,
    userPrompt,
    userLocation: coords,
    candidates,
  });
}
