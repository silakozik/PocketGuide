import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { PlacesModule } from './places/places.module';
import { RoutesModule } from './routes/routes.module';
import { AIModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { RedisCacheModule } from './config/redis.module';
import { DatabaseModule } from './config/database.module';
import { TransfersModule } from './transfers/transfers.module';
import { createDb } from '@pocketguide/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '../../../packages/i18n/src/locales/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new HeaderResolver(['x-custom-lang']),
        AcceptLanguageResolver,
      ],
    }),
    RedisCacheModule,
    DatabaseModule,
    PlacesModule,
    RoutesModule,
    AIModule,
    AdminModule,
    TransfersModule,
  ],
})
export class AppModule {}
