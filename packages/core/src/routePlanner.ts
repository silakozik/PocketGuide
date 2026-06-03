import Groq from "groq-sdk";

export const GROQ_ROUTE_MODEL = "llama-3.3-70b-versatile";

export type RouteTheme =
  | "culture"
  | "food"
  | "nature"
  | "adventure"
  | "shopping"
  | "relaxation"
  | "family"
  | "budget";

export interface RouteDayStop {
  order: number;
  time: string;
  name: string;
  type: string;
  description: string;
  duration: string;
  tip: string;
  category: "culture" | "food" | "transport" | "other";
  address?: string;
}

export interface RouteDay {
  day: number;
  title: string;
  theme: string;
  stops: RouteDayStop[];
}

export interface GeneratedRoute {
  city: string;
  cityNameEn: string;
  days: number;
  /** @deprecated use themes — kept for older saved JSON */
  theme?: RouteTheme;
  themes: RouteTheme[];
  title: string;
  summary: string;
  plan: RouteDay[];
  tips: string[];
}

export interface RoutePlannerOptions {
  city: string;
  cityNameEn: string;
  days: number;
  themes: RouteTheme[];
  groqApiKey: string;
  dangerouslyAllowBrowser?: boolean;
}

const THEME_LABELS: Record<RouteTheme, string> = {
  culture: "Kültür & Tarih",
  food: "Yeme & İçme",
  nature: "Doğa & Açık Hava",
  adventure: "Macera",
  shopping: "Alışveriş",
  relaxation: "Dinlenme & Spa",
  family: "Aile",
  budget: "Bütçe Dostu",
};

function buildRoutePlannerPrompt(options: RoutePlannerOptions): string {
  const themeLabels = options.themes.map((t) => THEME_LABELS[t]).join(", ");
  const themesJson = JSON.stringify(options.themes);
  return `
You are an expert travel planner. Create a detailed ${options.days}-day travel itinerary for ${options.cityNameEn} (${options.city}) combining these travel themes: ${themeLabels}.

RULES:
- Balance ALL selected themes across the full trip; each day should emphasize at least one of them.
- When multiple themes are selected, vary daily focus (e.g. culture-heavy day 1, food-heavy day 2).
- Each day must have 4-6 stops (morning, midday, afternoon, evening).
- Include realistic times (09:00, 11:30, 13:00, 15:30, 18:00, 20:00).
- Mix activity types: sightseeing, meals, transport tips, rest.
- Each stop must have a practical tip (avoid crowds, best time, price, etc.)
- Stops must be geographically logical (minimize travel between stops).
- Include 1 meal stop per day minimum.
- Descriptions must be in TURKISH.
- Tips must be in TURKISH.

OUTPUT: Return ONLY a valid JSON object with this exact structure, no markdown, no prose:
{
  "city": "${options.city}",
  "cityNameEn": "${options.cityNameEn}",
  "days": ${options.days},
  "themes": ${themesJson},
  "title": "string (Turkish, max 60 chars)",
  "summary": "string (Turkish, 2-3 sentences)",
  "plan": [
    {
      "day": 1,
      "title": "string (Turkish, max 40 chars)",
      "theme": "string (Turkish)",
      "stops": [
        {
          "order": 1,
          "time": "09:00",
          "name": "string",
          "type": "string",
          "description": "string (Turkish, 1-2 sentences)",
          "duration": "string (e.g. '90 dakika')",
          "tip": "string (Turkish, practical tip)",
          "category": "culture|food|transport|other",
          "address": "string (optional)"
        }
      ]
    }
  ],
  "tips": ["string (Turkish)", "string", "string"]
}
`;
}

export async function generateRoute(
  options: RoutePlannerOptions,
): Promise<GeneratedRoute> {
  const groq = new Groq({
    apiKey: options.groqApiKey,
    ...(options.dangerouslyAllowBrowser ? { dangerouslyAllowBrowser: true } : {}),
  });

  const prompt = buildRoutePlannerPrompt(options);

  const completion = await groq.chat.completions.create({
    model: GROQ_ROUTE_MODEL,
    temperature: 0.6,
    max_tokens: 4000,
    messages: [
      {
        role: "system",
        content:
          "You are an expert travel planner. Output ONLY valid JSON, no markdown fences, no prose. All descriptive text must be in Turkish.",
      },
      { role: "user", content: prompt },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "";

  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const raw = fenced ? fenced[1].trim() : trimmed;
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (!objMatch) throw new Error("Groq response was not valid JSON object");

  const parsed = JSON.parse(objMatch[0]) as GeneratedRoute & { theme?: RouteTheme };
  const themes =
    Array.isArray(parsed.themes) && parsed.themes.length > 0
      ? parsed.themes
      : parsed.theme
        ? [parsed.theme]
        : options.themes;
  return { ...parsed, themes };
}
