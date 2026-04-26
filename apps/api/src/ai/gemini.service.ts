import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIService, AIRecommendationContext } from './ai.service';

/**
 * GeminiService
 * 
 * Handles direct communication with Google Gemini 1.5 Flash.
 * Uses AIService to format prompts and parses the structured responses.
 */
@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;
  private readonly logger = new Logger(GeminiService.name);

  constructor(
    private configService: ConfigService,
    private aiService: AIService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || '');
    
    // Using gemini-1.5-flash as requested
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
      }
    });
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

      // 3. Call Gemini API
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // 4. Parse the structured JSON response
      try {
        return JSON.parse(text);
      } catch (parseError) {
        this.logger.error('Failed to parse Gemini response as JSON', parseError);
        this.logger.debug('Raw response:', text);
        // Return empty array instead of error object to keep frontend stable
        return [];
      }
    } catch (error) {
      this.logger.error('Error calling Gemini API', error);
      throw error;
    }
  }
}
