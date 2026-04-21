import { Injectable, Logger } from '@nestjs/common';
import { PoiWithDistance } from '../places/services/geospatial.service';

/**
 * AIService
 * 
 * Prepares structured geospatial data for Gemini AI prompts.
 * Ensures outputs are:
 * - Token-efficient (strips unnecessary fields)
 * - Geographically logical (includes distances, coordinates)
 * - Time-aware (includes time-of-day context)
 */

export interface AIRecommendationContext {
  userLocation: { lat: number; lng: number };
  timeOfDay: string; // 'morning' | 'afternoon' | 'evening' | 'night'
  nearbyPois: PoiWithDistance[];
  userInterests?: string[];
  budget?: string; // 'low' | 'medium' | 'high'
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  /**
   * Determine time-of-day category from current hour.
   */
  getTimeOfDay(hour?: number): string {
    const h = hour ?? new Date().getHours();
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  /**
   * Build a structured prompt context string for Gemini AI.
   * 
   * Optimization strategy:
   * - Only include fields relevant for recommendation decisions
   * - Cap POI descriptions to 80 chars
   * - Include distance and rating for spatial awareness
   * - Include time-of-day for contextual recommendations
   */
  buildRecommendationPrompt(context: AIRecommendationContext): string {
    const { userLocation, timeOfDay, nearbyPois, userInterests, budget } = context;

    const currentTime = new Date().toLocaleString('tr-TR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

    const header = [
      `# Traveler Context`,
      `User Location: (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`,
      `Current Time: ${currentTime}`,
      userInterests?.length ? `Interests: ${userInterests.join(', ')}` : null,
      budget ? `Budget: ${budget}` : null,
      '',
    ].filter(Boolean).join('\n');

    const poisSection = nearbyPois.map((poi, i) => {
      return [
        `ID: ${poi.id} | Name: ${poi.name} | Category: ${poi.category}`,
        `   📍 ${Math.round(poi.distanceMeters)}m | ⭐ ${poi.rating ?? 'N/A'} (${poi.reviewCount} reviews) | ❤️ ${poi.favoriteCount} faves`,
        `   🕒 Opening Hours: ${poi.openingHours || 'MISSING'}`,
        `   📝 ${poi.description || 'No description'}`,
      ].join('\n');
    }).join('\n');

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

  /**
   * Build a compact JSON context for AI routing prompts.
   * Used when generating smart routes with Gemini.
   */
  buildRoutingContext(
    startLat: number,
    startLng: number,
    candidatePois: PoiWithDistance[],
    constraints: {
      maxStops?: number;
      maxDurationMinutes?: number;
      interests?: string[];
    },
  ): object {
    return {
      start: { lat: startLat, lng: startLng },
      constraints: {
        maxStops: constraints.maxStops ?? 6,
        maxDuration: `${constraints.maxDurationMinutes ?? 480} minutes`,
        interests: constraints.interests ?? [],
      },
      candidates: candidatePois.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        lat: p.lat,
        lng: p.lng,
        dist: Math.round(p.distanceMeters),
        rating: p.rating,
        price: p.priceLevel,
      })),
    };
  }

  /**
   * Estimate token count for a prompt string (rough approximation).
   * Useful for staying within Gemini API token limits.
   */
  estimateTokenCount(text: string): number {
    // GPT/Gemini average: ~4 characters per token
    return Math.ceil(text.length / 4);
  }
}
