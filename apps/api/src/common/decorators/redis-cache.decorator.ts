import { applyDecorators, SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'redis_cache_ttl';
export const CACHE_PREFIX_KEY = 'redis_cache_prefix';

export interface RedisCacheOptions {
  ttl: number;       // TTL in seconds
  keyPrefix: string; // Prefix like "pois", "route", "recommendations"
}

export const UseRedisCache = (options: RedisCacheOptions) => {
  return applyDecorators(
    SetMetadata(CACHE_TTL_KEY, options.ttl),
    SetMetadata(CACHE_PREFIX_KEY, options.keyPrefix)
  );
};
