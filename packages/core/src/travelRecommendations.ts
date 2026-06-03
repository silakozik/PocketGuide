import Groq from "groq-sdk";
import { resolveCityFromPrompt } from "./homepageCities";

export const GROQ_TRAVEL_MODEL = "llama-3.1-8b-instant";

/** Row shape returned by `GET /api/pois/nearby` (matches backend `PoiWithDistance`). */
export type NearbyPoiRow = {
  id: string;
  name: string;
  category: string;
  address: string | null;
  description: string | null;
  rating: number | null;
  priceLevel: number | null;
  openingHours: string | null;
  reviewCount: number;
  favoriteCount: number;
  lat: number;
  lng: number;
  distanceMeters: number;
};

export type TravelRecommendation = {
  placeId: string;
  name: string;
  category: string;
  badge: string;
  reason: string;
  estimatedVisitMinutes: number;
  walkingDistanceMeters: number;
  lat?: number;
  lng?: number;
};

export type FetchTravelRecommendationsOptions = {
  lat: number;
  lng: number;
  /** Empty string = same-origin relative `/api/...` (Vite web). Otherwise full API origin, no trailing slash. */
  apiBaseUrl: string;
  groqApiKey: string;
  /** Web (Vite) must pass `true` when calling Groq from the browser. */
  dangerouslyAllowBrowser?: boolean;
  userInterests?: string[];
  budget?: string;
  userPrompt?: string;
  /** Örn. soruda "Romada" geçince `roma` — yakın POI boşsa explore listesine düşer */
  citySlug?: string;
};

export type AskGroqTravelAssistantOptions = {
  groqApiKey: string;
  userPrompt: string;
  userLocation?: { lat: number; lng: number };
  candidates?: TravelRecommendation[];
  dangerouslyAllowBrowser?: boolean;
};

export function getTimeOfDay(hour = new Date().getHours()): string {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Mirrors `AIService.buildRecommendationPrompt` (apps/api) so Groq receives the same task spec.
 */
export function buildRecommendationPrompt(context: {
  userLocation: { lat: number; lng: number };
  timeOfDay: string;
  nearbyPois: NearbyPoiRow[];
  userInterests?: string[];
  budget?: string;
  userPrompt?: string;
  /** Şehir geneli liste (explore); mesafe/açılış kuralları gevşetilir */
  cityWideMode?: boolean;
}): string {
  const { userLocation, timeOfDay, nearbyPois, userInterests, budget, userPrompt, cityWideMode } =
    context;

  const currentTime = new Date().toLocaleString("tr-TR", {
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const header = [
    `# Traveler Context`,
    `User Location: (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`,
    `Time of day bucket: ${timeOfDay}`,
    `Current Time: ${currentTime}`,
    userInterests?.length ? `Interests: ${userInterests.join(", ")}` : null,
    budget ? `Budget: ${budget}` : null,
    userPrompt?.trim() ? `User Request: ${userPrompt.trim()}` : null,
    "",
  ]
    .filter(Boolean)
    .join("\n");

  const poisSection = nearbyPois
    .map((poi) => {
      const desc = (poi.description || "No description").slice(0, 80);
      return [
        `ID: ${poi.id} | Name: ${poi.name} | Category: ${poi.category}`,
        `   📍 ${Math.round(poi.distanceMeters)}m | ⭐ ${poi.rating ?? "N/A"} (${poi.reviewCount} reviews) | ❤️ ${poi.favoriteCount} faves`,
        `   🕒 Opening Hours: ${poi.openingHours || "MISSING"}`,
        `   📝 ${desc}`,
      ].join("\n");
    })
    .join("\n");

  const distanceRules = cityWideMode
    ? [
        "1. User is asking about a whole city. Recommend MAX 5-8 standout places from the candidate list (mix categories).",
        "2. openingHours MISSING is OK — still include the place.",
        "3. Ignore strict walking-distance limits; use logical grouping by neighborhood if possible.",
        "4. Apply categorical diversity: culture, food, and sights spread.",
        "5. Match User Request themes (e.g. must-see, food, family).",
      ]
    : [
        "1. Start from userLocation. Recommend MAX 5 places within 1km walking distance.",
        "2. EXCLUDE any place where openingHours is MISSING or invalid.",
        "3. EXCLUDE any place that is closed during the estimated visit window (Current Time + Travel Time).",
        "4. Sort places using nearest-neighbor logic to form an efficient walking route. MINIMIZE total walking distance and avoid zigzagging.",
        "5. Apply categorical diversity: do not repeat the same category more than twice.",
        "6. If User Request exists, prioritize matching venues and reasons to that request while still following distance/opening constraints.",
      ];

  const instructions = [
    "",
    "# LOGISTICAL ENGINE RULES (STRICT)",
    ...distanceRules,
    "",
    "# SCORING & BADGING RULES",
    'Assign exactly one "badge" string to each recommendation based on these priorities:',
    '- "Senin İçin İdeal": Highest priority if the place category strongly matches userInterests.',
    '- "Çok Popüler": High rating (>4.5) and significant review count (>10).',
    '- "Gezginlerin Favorisi": High favorite count (>5).',
    '- "Gizli Cevher": Good rating (>4.2) but low review count (<5).',
    '- "Fiyat/Performans": Price level 1 or 2 with good rating.',
    '- "Yeni Keşif": Default badge if no other criteria met.',
    "",
    "# LOGISTICAL REASONING GUIDELINES",
    "- Spatial Awareness: Group nearby places (<800m) sequentially.",
    "- Temporal Logic: Account for visit durations: cafe/restaurant (30-45m), park (20-40m), museum (60-90m), others (30m).",
    "- Contextual Logic: If it is meal time (Lunch: 12:00-14:00, Dinner: 19:00-21:00), prioritize a food anchor.",
    "- Fatigue Management: Do not suggest more than 2 high-intensity activities in a row.",
    "",
    "# OUTPUT FORMAT (STRICT)",
    "Return ONLY a valid JSON array of objects with these fields and NO other text:",
    '[{ "placeId": string, "name": string, "category": string, "badge": string, "reason": string, "estimatedVisitMinutes": number, "walkingDistanceMeters": number }]',
  ].join("\n");

  return `${header}\n# Candidate Places\n${poisSection}\n${instructions}`;
}

export function parseRecommendationsJson(text: string): TravelRecommendation[] {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  const arrayMatch = raw.match(/\[[\s\S]*\]/);
  const jsonStr = arrayMatch ? arrayMatch[0] : raw;
  const parsed = JSON.parse(jsonStr) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isValidRecommendation);
}

function isValidRecommendation(x: unknown): x is TravelRecommendation {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.placeId === "string" &&
    typeof o.name === "string" &&
    typeof o.category === "string" &&
    typeof o.badge === "string" &&
    typeof o.reason === "string" &&
    typeof o.estimatedVisitMinutes === "number" &&
    typeof o.walkingDistanceMeters === "number"
  );
}

const EXPLORE_CATEGORIES = ["culture", "food", "entertainment", "hotel", "park"] as const;

async function fetchCityExplorePois(
  apiBaseUrl: string,
  citySlug: string,
): Promise<NearbyPoiRow[]> {
  const seen = new Set<string>();
  const merged: NearbyPoiRow[] = [];

  for (const placeCategory of EXPLORE_CATEGORIES) {
    const qs = new URLSearchParams({
      city: citySlug,
      placeCategory,
      limit: "12",
      offset: "0",
    });
    const path = `/api/pois/explore?${qs.toString()}`;
    const url = apiBaseUrl ? `${apiBaseUrl.replace(/\/$/, "")}${path}` : path;

    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const body = (await res.json()) as { data?: NearbyPoiRow[] };
      for (const poi of body.data ?? []) {
        if (seen.has(poi.id)) continue;
        seen.add(poi.id);
        merged.push({ ...poi, distanceMeters: poi.distanceMeters ?? 0 });
      }
    } catch {
      continue;
    }
  }

  return merged.slice(0, 24);
}

function nearbyPoisUrl(apiBaseUrl: string, lat: number, lng: number, radiusMeters = 2000): string {
  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radiusMeters),
    limit: "15",
  });
  const path = `/api/pois/nearby?${qs.toString()}`;
  if (!apiBaseUrl) return path;
  return `${apiBaseUrl.replace(/\/$/, "")}${path}`;
}

/**
 * Loads nearby POIs from the Nest API, then asks Groq for structured recommendations.
 * Apps supply env-derived `apiBaseUrl` / `groqApiKey` and any Groq client flags (e.g. browser mode on web).
 */
export async function fetchTravelRecommendationsFromGroq(
  options: FetchTravelRecommendationsOptions,
): Promise<TravelRecommendation[]> {
  const {
    lat,
    lng,
    apiBaseUrl,
    groqApiKey,
    dangerouslyAllowBrowser,
    userInterests,
    budget,
    userPrompt,
    citySlug: citySlugOption,
  } = options;
  const resolvedCitySlug =
    citySlugOption ?? (userPrompt?.trim() ? resolveCityFromPrompt(userPrompt) : null)?.slug;
  const candidateRadiiMeters = userPrompt?.trim()
    ? [2000, 5000, 10000, 25000, 50000]
    : [2000, 5000, 10000];
  let nearbyPois: NearbyPoiRow[] = [];
  for (const radiusMeters of candidateRadiiMeters) {
    const url = nearbyPoisUrl(apiBaseUrl, lat, lng, radiusMeters);
    let poiRes: Response;
    try {
      poiRes = await fetch(url);
    } catch {
      throw new Error(
        apiBaseUrl
          ? `Network error calling ${url}. Is the API running and EXPO_PUBLIC_API_BASE_URL correct? (Android emulator often uses http://10.0.2.2:3000)`
          : "Network error: `/api` request failed. Start the Nest API (e.g. port 3000) and ensure the Vite dev proxy targets it.",
      );
    }

    if (!poiRes.ok) {
      let backendDetail = "";
      try {
        const raw = await poiRes.text();
        if (raw) {
          try {
            const j = JSON.parse(raw) as { message?: string; error?: string };
            backendDetail = (j.message || j.error || "").trim();
          } catch {
            backendDetail = raw.slice(0, 240).trim();
          }
        }
      } catch {
        /* ignore */
      }

      const hints: string[] = [];
      if (!apiBaseUrl && poiRes.status >= 502 && poiRes.status <= 504) {
        hints.push("The dev proxy cannot reach localhost:3000 (API off or wrong port).");
      }
      if (!apiBaseUrl && poiRes.status === 500) {
        hints.push(
          "Server error: is PostgreSQL/PostGIS up? Restart the API after code changes; keep a single Nest instance on port 3000.",
        );
      }

      const msg = [
        `Could not load nearby places (HTTP ${poiRes.status}).`,
        backendDetail && `Detail: ${backendDetail}`,
        ...hints,
      ]
        .filter(Boolean)
        .join(" ");
      throw new Error(msg);
    }

    const poiBody = (await poiRes.json()) as { data?: NearbyPoiRow[] };
    nearbyPois = poiBody.data ?? [];
    if (nearbyPois.length > 0) {
      break;
    }
  }
  let cityWideMode = false;
  if (!nearbyPois.length && resolvedCitySlug) {
    nearbyPois = await fetchCityExplorePois(apiBaseUrl, resolvedCitySlug);
    cityWideMode = nearbyPois.length > 0;
  }

  if (!nearbyPois.length) {
    return [];
  }

  const prompt = buildRecommendationPrompt({
    userLocation: { lat, lng },
    timeOfDay: getTimeOfDay(),
    nearbyPois,
    userInterests: userInterests ?? ["Culture", "History", "Gastronomy", "Walking"],
    budget: budget ?? "medium",
    userPrompt,
    cityWideMode,
  });

  const groq = new Groq({
    apiKey: groqApiKey,
    ...(dangerouslyAllowBrowser ? { dangerouslyAllowBrowser: true } : {}),
  });

  const completion = await groq.chat.completions.create({
    model: GROQ_TRAVEL_MODEL,
    temperature: 0.45,
    messages: [
      {
        role: "system",
        content:
          "You are PocketGuide travel assistant. Follow user instructions exactly. Output must be only the JSON array requested, no markdown, no prose.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";
  try {
    const recs = parseRecommendationsJson(text);
    const poiById = new Map(nearbyPois.map((p) => [p.id, p]));
    return recs
      .filter((r) => poiById.has(r.placeId))
      .map((r) => {
        const poi = poiById.get(r.placeId)!;
        return {
          ...r,
          lat: poi.lat,
          lng: poi.lng,
        };
      });
  } catch {
    console.error("Groq raw response:", text);
    throw new Error("Groq response was not valid JSON array format.");
  }
}

/**
 * Free-form assistant reply for conversational Q&A style.
 */
export async function askGroqTravelAssistant(
  options: AskGroqTravelAssistantOptions,
): Promise<string> {
  const { groqApiKey, userPrompt, userLocation, candidates, dangerouslyAllowBrowser } = options;
  const prompt = userPrompt.trim();
  if (!prompt) return "";

  const locationText = userLocation
    ? `Kullanici konumu: (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`
    : "Kullanici konumu bilinmiyor.";

  const cityRef = resolveCityFromPrompt(prompt);
  const cityLine = cityRef ? `Hedef sehir: ${cityRef.nameTr} (${cityRef.nameEn})` : "";

  const candidateLines =
    candidates && candidates.length > 0
      ? candidates
          .slice(0, 10)
          .map(
            (c, idx) =>
              `${idx + 1}) ${c.name} | ${c.category} | ${c.reason}`,
          )
          .join("\n")
      : "";

  const groq = new Groq({
    apiKey: groqApiKey,
    ...(dangerouslyAllowBrowser ? { dangerouslyAllowBrowser: true } : {}),
  });

  const hasCandidates = candidateLines.length > 0;

  const completion = await groq.chat.completions.create({
    model: GROQ_TRAVEL_MODEL,
    temperature: 0.55,
    messages: [
      {
        role: "system",
        content: hasCandidates
          ? "Sen PocketGuide gezi asistansin. Sadece ADAY MEKANLAR listesindeki isimleri kullan; listede olmayan mekan UYDURMA. Cevaplari Turkce, samimi ve net ver."
          : "Sen PocketGuide gezi asistansin. Cevaplari Turkce, kisa ve net ver. Aday mekan listesi bos; genel seyahat tavsiyesi ver ama hayali isletme adi uydurma.",
      },
      {
        role: "user",
        content: hasCandidates
          ? `${locationText}\n${cityLine}\nSoru: ${prompt}\n\nADAY MEKANLAR:\n${candidateLines}\n\nGorev: Soruya uygun 4-6 mekani sec, her biri icin 1 cumle neden yaz.`
          : `${locationText}\n${cityLine}\nSoru: ${prompt}\n\nGorev: Sehirde gezilecek yer turleri ve bolgeler hakkinda genel rehberlik ver (4-6 madde).`,
      },
    ],
  });

  return (completion.choices[0]?.message?.content ?? "").trim();
}
