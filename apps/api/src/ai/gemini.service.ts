import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService, AIRecommendationContext } from './ai.service';

/**
 * GeminiService
 * 
 * Handles direct communication with Google Gemini (primary: gemini-2.0-flash).
 * Uses AIService to format prompts and parses the structured responses.
 */
@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly logger = new Logger(GeminiService.name);

  private static readonly MODEL_CANDIDATES = [
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
  ] as const;

  constructor(
    private configService: ConfigService,
    private aiService: AIService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
  }

  private isModelUnavailableError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    return /404|not found|not supported for generateContent/i.test(msg);
  }

  /**
   * Generates personalized recommendations based on user preferences and nearby places.
   * 
   * @param user User preferences and context
   * @param places List of nearby POIs
   * @returns Parsed recommendation object
   */
  async getRecommendations(user: any, places: any[]) {
    try {
      this.logger.log(`Generating recommendations for user ${user.id || 'anonymous'} with ${places.length} places.`);

      // 1. Prepare the context for the prompt
      const context: AIRecommendationContext = {
        userLocation: user.location || { lat: 0, lng: 0 },
        timeOfDay: this.aiService.getTimeOfDay(),
        nearbyPois: places,
        userInterests: user.interests || [],
        budget: user.budget || 'medium',
      };

      // 2. Build the prompt using the formatting logic in AIService
      const prompt = this.aiService.buildRecommendationPrompt(context);

      // 3. Call Gemini API (try primary model, then fallback if API rejects the model id)
      const override = this.configService.get<string>('GEMINI_MODEL')?.trim();
      const candidates = override
        ? [override, ...GeminiService.MODEL_CANDIDATES.filter((m) => m !== override)]
        : [...GeminiService.MODEL_CANDIDATES];

      let lastError: unknown;
      for (const modelName of candidates) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: 'application/json',
            },
          });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();

          // 4. Parse the structured JSON response
          try {
            return JSON.parse(text);
          } catch (parseError) {
            this.logger.error('Failed to parse Gemini response as JSON', parseError);
            this.logger.debug('Raw response:', text);
            return [];
          }
        } catch (err) {
          lastError = err;
          if (this.isModelUnavailableError(err) && modelName !== candidates[candidates.length - 1]) {
            this.logger.warn(`Gemini model "${modelName}" unavailable; retrying with next candidate.`);
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    } catch (error) {
      this.logger.error('Error calling Gemini API', error);
      throw error;
    }
  }
}
