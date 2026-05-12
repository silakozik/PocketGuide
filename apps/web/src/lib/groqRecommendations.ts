import Groq from 'groq-sdk';

const GROQ_MODEL = 'llama-3.1-8b-instant';

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
};

function getTimeOfDay(hour = new Date().getHours()): string {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Mirrors `AIService.buildRecommendationPrompt` (apps/api) so Groq receives the same task spec.
 */
function buildRecommendationPrompt(context: {
  userLocation: { lat: number; lng: number };
  timeOfDay: string;
  nearbyPois: NearbyPoiRow[];
  userInterests?: string[];
  budget?: string;
}): string {
  const { userLocation, timeOfDay, nearbyPois, userInterests, budget } = context;

  const currentTime = new Date().toLocaleString('tr-TR', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  const header = [
    `# Traveler Context`,
    `User Location: (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`,
    `Time of day bucket: ${timeOfDay}`,
    `Current Time: ${currentTime}`,
    userInterests?.length ? `Interests: ${userInterests.join(', ')}` : null,
    budget ? `Budget: ${budget}` : null,
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const poisSection = nearbyPois
    .map((poi) => {
      const desc = (poi.description || 'No description').slice(0, 80);
      return [
        `ID: ${poi.id} | Name: ${poi.name} | Category: ${poi.category}`,
        `   📍 ${Math.round(poi.distanceMeters)}m | ⭐ ${poi.rating ?? 'N/A'} (${poi.reviewCount} reviews) | ❤️ ${poi.favoriteCount} faves`,
        `   🕒 Opening Hours: ${poi.openingHours || 'MISSING'}`,
        `   📝 ${desc}`,
      ].join('\n');
    })
    .join('\n');

  const instructions = [
    '',
    '# LOGISTICAL ENGINE RULES (STRICT)',
    '1. Start from userLocation. Recommend MAX 5 places within 1km walking distance.',
    '2. EXCLUDE any place where openingHours is MISSING or invalid.',
    '3. EXCLUDE any place that is closed during the estimated visit window (Current Time + Travel Time).',
    '4. Sort places using nearest-neighbor logic to form an efficient walking route. MINIMIZE total walking distance and avoid zigzagging.',
    '5. Apply categorical diversity: do not repeat the same category more than twice.',
    '',
    '# SCORING & BADGING RULES',
    'Assign exactly one "badge" string to each recommendation based on these priorities:',
    '- "Senin İçin İdeal": Highest priority if the place category strongly matches userInterests.',
    '- "Çok Popüler": High rating (>4.5) and significant review count (>10).',
    '- "Gezginlerin Favorisi": High favorite count (>5).',
    '- "Gizli Cevher": Good rating (>4.2) but low review count (<5).',
    '- "Fiyat/Performans": Price level 1 or 2 with good rating.',
    '- "Yeni Keşif": Default badge if no other criteria met.',
    '',
    '# LOGISTICAL REASONING GUIDELINES',
    '- Spatial Awareness: Group nearby places (<800m) sequentially.',
    '- Temporal Logic: Account for visit durations: cafe/restaurant (30-45m), park (20-40m), museum (60-90m), others (30m).',
    '- Contextual Logic: If it is meal time (Lunch: 12:00-14:00, Dinner: 19:00-21:00), prioritize a food anchor.',
    '- Fatigue Management: Do not suggest more than 2 high-intensity activities in a row.',
    '',
    '# OUTPUT FORMAT (STRICT)',
    'Return ONLY a valid JSON array of objects with these fields and NO other text:',
    '[{ "placeId": string, "name": string, "category": string, "badge": string, "reason": string, "estimatedVisitMinutes": number, "walkingDistanceMeters": number }]',
  ].join('\n');

  return `${header}\n# Candidate Places\n${poisSection}\n${instructions}`;
}

function parseRecommendationsJson(text: string): TravelRecommendation[] {
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
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.placeId === 'string' &&
    typeof o.name === 'string' &&
    typeof o.category === 'string' &&
    typeof o.badge === 'string' &&
    typeof o.reason === 'string' &&
    typeof o.estimatedVisitMinutes === 'number' &&
    typeof o.walkingDistanceMeters === 'number'
  );
}

/**
 * Loads nearby POIs from the existing Nest API (Vite proxy → `/api`), then asks Groq for structured recommendations.
 */
export async function fetchTravelRecommendationsFromGroq(
  lat: number,
  lng: number,
): Promise<TravelRecommendation[]> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'VITE_GROQ_API_KEY tanımlı değil. Groq anahtarını `apps/web/.env` içine `VITE_GROQ_API_KEY=...` olarak yazın (sadece `apps/api/.env` yeterli değildir). Kaydettikten sonra `pnpm dev` / Vite sunucusunu yeniden başlatın.',
    );
  }

  const qs = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: '2000',
    limit: '15',
  });
  const poiRes = await fetch(`/api/pois/nearby?${qs.toString()}`);
  if (!poiRes.ok) {
    throw new Error(`Yakındaki yerler alınamadı (HTTP ${poiRes.status}).`);
  }

  const poiBody = (await poiRes.json()) as { data?: NearbyPoiRow[] };
  const nearbyPois = poiBody.data ?? [];
  if (!nearbyPois.length) {
    return [];
  }

  const prompt = buildRecommendationPrompt({
    userLocation: { lat, lng },
    timeOfDay: getTimeOfDay(),
    nearbyPois,
    userInterests: ['Culture', 'History', 'Gastronomy', 'Walking'],
    budget: 'medium',
  });

  const groq = new Groq({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    temperature: 0.45,
    messages: [
      {
        role: 'system',
        content:
          'You are PocketGuide travel assistant. Follow user instructions exactly. Output must be only the JSON array requested, no markdown, no prose.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? '';
  try {
    const recs = parseRecommendationsJson(text);
    const allowed = new Set(nearbyPois.map((p) => p.id));
    return recs.filter((r) => allowed.has(r.placeId));
  } catch {
    console.error('Groq raw response:', text);
    throw new Error('Groq yanıtı beklenen JSON dizi formatında değil.');
  }
}
