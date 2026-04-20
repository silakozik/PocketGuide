import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { GeminiService } from './gemini.service';

@Module({
  providers: [AIService, GeminiService],
  exports: [AIService, GeminiService],
})
export class AIModule {}
