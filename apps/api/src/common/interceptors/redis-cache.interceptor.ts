import { CallHandler, ExecutionContext, Injectable, NestInterceptor, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as crypto from 'crypto';
import { RedisService } from '../../config/redis.service';
import { CACHE_PREFIX_KEY, CACHE_TTL_KEY } from '../decorators/redis-cache.decorator';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RedisCacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const ttl = this.reflector.getAllAndOverride<number>(CACHE_TTL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const prefix = this.reflector.getAllAndOverride<string>(CACHE_PREFIX_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no TTL is defined, bypass cache
    if (!ttl || !prefix) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(request, prefix);

    // Try to get from Redis
    const cachedData = await this.redisService.get(cacheKey);

    if (cachedData) {
      // Cache Hit
      response.setHeader('X-Cache', 'HIT');
      // For monitoring purposes:
      this.logger.debug(`Cache HIT for key: ${cacheKey}`);
      return of(cachedData); // Return immediately without computing
    }

    // Cache Miss
    response.setHeader('X-Cache', 'MISS');
    this.logger.debug(`Cache MISS for key: ${cacheKey}`);

    // Wait for the route handler to finish, then save to Redis
    return next.handle().pipe(
      tap((data) => {
        // Fire and forget caching logic
        this.redisService.set(cacheKey, data, ttl);
      }),
    );
  }

  private generateCacheKey(request: any, prefix: string): string {
    const { method, originalUrl, body, query, user } = request;

    if (method === 'GET') {
      if (prefix === 'recommendations' && user?.id) {
         return `${prefix}:${user.id}:${originalUrl}`;
      }
      // URL contains query strings. It replaces page, limit, category parameters nicely.
      return `${prefix}:${originalUrl}`;
    }

    if (method === 'POST') {
      // E.g., for routing POST /api/route/optimize, hash the body
      const bodyString = JSON.stringify(body || {});
      const hash = crypto.createHash('md5').update(bodyString).digest('hex');
      return `${prefix}:${hash}`;
    }

    // Fallback key
    return `${prefix}:${method}:${originalUrl}`;
  }
}
