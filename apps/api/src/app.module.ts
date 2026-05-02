import { ExecutionContext, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
import { BullmqRootModule } from './routes/queue/bullmq-root.module';
import { RouteQueueModule } from './routes/queue/route-queue.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'globalMinute',
        ttl: 60_000,
        limit: 60,
      },
      {
        name: 'routeGeneratePerUser',
        ttl: 60_000,
        limit: 3,
        skipIf: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            method?: string;
            originalUrl?: string;
            url?: string;
          }>();
          if (!req?.method) return true;
          const path = `${req.originalUrl ?? req.url ?? ''}`;
          return !(req.method === 'POST' && path.includes('routes/generate'));
        },
        getTracker: (req): Promise<string> => {
          const uid = req?.body?.userId;
          const key =
            typeof uid === 'string' && uid.trim().length > 0
              ? `route-job:${uid.trim()}`
              : `ip:${(req.ip as string) || 'anonymous'}`;
          return Promise.resolve(key);
        },
      },
    ]),
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
    BullmqRootModule,
    RedisCacheModule,
    DatabaseModule,
    PlacesModule,
    RoutesModule,
    RouteQueueModule,
    AIModule,
    AdminModule,
    TransfersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
