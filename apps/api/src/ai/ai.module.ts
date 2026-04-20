import { Module, forwardRef } from '@nestjs/common';
import { AIService } from './ai.service';
import { GeminiService } from './gemini.service';
import { PlacesModule } from '../places/places.module';
import { AIController } from './ai.controller';

@Module({
  imports: [forwardRef(() => PlacesModule)],
  controllers: [AIController],
  providers: [AIService, GeminiService],
  exports: [AIService, GeminiService],
})
export class AIModule { }
