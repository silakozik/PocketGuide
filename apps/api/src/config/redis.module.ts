import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [CacheModule.register()],
  providers: [RedisService],
  exports: [RedisService, CacheModule],
})
export class RedisCacheModule {}
