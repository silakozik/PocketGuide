import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PlacesModule } from './places/places.module';
import { RoutesModule } from './routes/routes.module';
import { AIModule } from './ai/ai.module';
import { AdminModule } from './admin/admin.module';
import { RedisCacheModule } from './config/redis.module';
import { createDb } from '@pocketguide/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisCacheModule,
    PlacesModule,
    RoutesModule,
    AIModule,
    AdminModule,
  ],
  providers: [
    {
      provide: 'DB_CONNECTION',
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>(
          'DATABASE_URL',
          'postgresql://postgres:postgres@localhost:5432/pocketguide',
        );
        return createDb(connectionString);
      },
      inject: [ConfigService],
    },
  ],
  exports: ['DB_CONNECTION'],
})
export class AppModule {}
