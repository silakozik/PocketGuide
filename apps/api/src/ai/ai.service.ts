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

    const header = [
      `# Traveler Context`,
      `Location: (${userLocation.lat.toFixed(5)}, ${userLocation.lng.toFixed(5)})`,
      `Time: ${timeOfDay}`,
      userInterests?.length ? `Interests: ${userInterests.join(', ')}` : null,
      budget ? `Budget: ${budget}` : null,
      '',
    ].filter(Boolean).join('\n');

    const poisSection = nearbyPois.map((poi, i) => {
      const desc = poi.description
        ? poi.description.slice(0, 80) + (poi.description.length > 80 ? '…' : '')
        : 'No description';
      
      return [
        `${i + 1}. **${poi.name}** [${poi.category}]`,
        `   📍 ${Math.round(poi.distanceMeters)}m away | ⭐ ${poi.rating ?? 'N/A'} | 💰 ${poi.priceLevel ?? 'N/A'}`,
        `   ${desc}`,
      ].join('\n');
    }).join('\n');

    const instructions = [
      '',
      '# Instructions',
      'Based on the traveler context and nearby places above:',
      '1. Recommend the top 3-5 places to visit right now, considering time of day and distance.',
      '2. For each recommendation, explain WHY it fits the current context.',
      '3. Suggest an optimal visiting order to minimize walking.',
      '4. If it\'s a meal time, prioritize food options.',
      '5. Return response as structured JSON with fields: recommendations[], suggestedOrder[], tips[].',
    ].join('\n');

    return `${header}\n# Nearby Places (${nearbyPois.length} found)\n${poisSection}\n${instructions}`;
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
