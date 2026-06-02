import Groq from "groq-sdk";
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
  userPrompt?: string,
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
    apiBaseUrl: "",
    groqApiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}

export async function askGroqTravelAssistant(
  userPrompt: string,
  coords?: { lat: number; lng: number },
): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "VITE_GROQ_API_KEY tanımlı değil. Groq anahtarını `apps/web/.env` içine `VITE_GROQ_API_KEY=...` olarak yazın.",
    );
  }

  const prompt = userPrompt.trim();
  if (!prompt) return "";

  const locationText = coords
    ? `Kullanici konumu: (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)})`
    : "Kullanici konumu bilinmiyor.";

  const groq = new Groq({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    temperature: 0.55,
    messages: [
      {
        role: "system",
        content:
          "Sen PocketGuide gezi asistansin. Cevaplari Turkce, kisa ve net ver. Kullanici sorusuna gore sehir/bolge odakli pratik oneriler sun. Gereksiz uzunluk ve markdown kullanma.",
      },
      {
        role: "user",
        content: `${locationText}\nSoru: ${prompt}`,
      },
    ],
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}
