import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Custom Redis Service providing graceful fallback
 * and production-safe invalidation using SCAN.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis | null = null;
  private isConnected = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      this.logger.warn('REDIS_URL is not set. Caching will be gracefully disabled (Dev mode).');
      return;
    }

    try {
      this.redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1, // Fail fast on request to avoid blocking
        retryStrategy(times) {
          if (times > 3) {
            return null; // Stop retrying entirely, fallback to DB
          }
          return Math.min(times * 100, 3000); 
        },
      });

      this.redisClient.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to Redis.');
      });

      this.redisClient.on('error', (err) => {
        this.isConnected = false;
        this.logger.error(`Redis connection error: ${err.message}`);
      });

      this.redisClient.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed.');
      });

      this.redisClient.connect().catch((err) => {
        this.isConnected = false;
        this.logger.error(`Initial Redis connection failed: ${err.message}. Caching gracefully disabled.`);
      });
    } catch (err) {
      this.logger.error('Failed to initialize Redis client', err);
    }
  }

  onModuleDestroy() {
    if (this.redisClient) {
      this.redisClient.disconnect();
    }
  }

  get isConfiguredAndConnected(): boolean {
    return this.isConnected && this.redisClient !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConfiguredAndConnected) return null;
    try {
      const result = await Promise.race([
        this.redisClient!.get(key),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis GET timeout')), 500))
      ]);
      
      if (!result) return null;
      return JSON.parse(result as string) as T;
    } catch (error) {
      this.logger.warn(`Redis GET failed for key ${key}: ${error.message}. Bypassing cache.`);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!this.isConfiguredAndConnected) return;
    try {
      const stringValue = JSON.stringify(value);
      await Promise.race([
        this.redisClient!.set(key, stringValue, 'EX', ttlSeconds),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Redis SET timeout')), 500))
      ]);
    } catch (error) {
      this.logger.warn(`Redis SET failed for key ${key}: ${error.message}.`);
    }
  }

  /**
   * Clears cache keys matching a pattern using SCAN instead of KEYS
   */
  /**
   * INCR counter and set TTL on first hit (minute-based rate buckets).
   * Returns null if Redis is unavailable.
   */
  async incrCounterWithTtl(key: string, ttlSeconds: number): Promise<number | null> {
    if (!this.isConfiguredAndConnected || !this.redisClient) return null;

    try {
      const pipe = this.redisClient.multi();
      pipe.incr(key);
      pipe.ttl(key);
      const res = await pipe.exec();
      if (!res?.[0] || !res?.[1]) return null;

      const count = res[0][1] as number;
      const ttl = res[1][1] as number;

      if (ttl === -1) {
        await this.redisClient.expire(key, ttlSeconds);
      }
      return count;
    } catch (error) {
      this.logger.warn(
        `Redis INCR/TTL failed for key ${key}: ${(error as Error).message}`,
      );
      return null;
    }
  }

  /**
   * Exposes Redis for queue internals when cache semantics are inadequate.
   * Prefer higher-level helpers when possible.
   */
  getClient(): Redis | null {
    return this.redisClient;
  }

  async clearCacheByPattern(pattern: string): Promise<number> {
    if (!this.isConfiguredAndConnected) return 0;
    
    let cursor = '0';
    let deletedCount = 0;
    
    try {
      do {
        const [nextCursor, keys] = await this.redisClient!.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        
        if (keys.length > 0) {
          deletedCount += await this.redisClient!.del(...keys);
        }
      } while (cursor !== '0');
      
      this.logger.log(`Cleared ${deletedCount} cache keys for pattern: ${pattern}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Failed to clear cache for pattern ${pattern}: ${error.message}`);
      return 0;
    }
  }
}
