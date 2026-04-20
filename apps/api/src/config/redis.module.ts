import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Using memory store for local development to bypass Redis dependency
        ttl: parseInt(configService.get<string>('CACHE_TTL', '60'), 10),
        max: 100, // maximum number of items in cache
      }),
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
