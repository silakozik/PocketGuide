import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

export const ROUTE_GENERATION_QUEUE = 'route-generation';

/**
 * Parses REDIS_URL for BullMQ/ioredis. Workers require maxRetriesPerRequest: null.
 */
export function getBullmqRedisOptions(
  config: ConfigService,
): RedisOptions | { url: string; options?: RedisOptions } {
  const redisUrl = config.get<string>('REDIS_URL');
  if (!redisUrl) {
    throw new Error(
      'REDIS_URL must be defined for BullMQ (route generation queue).',
    );
  }

  try {
    const u = new URL(redisUrl);
    const opts: RedisOptions = {
      host: u.hostname,
      port: parseInt(u.port || '6379', 10),
      username: u.username ? decodeURIComponent(u.username) : undefined,
      password: u.password ? decodeURIComponent(u.password) : undefined,
      ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
      maxRetriesPerRequest: null,
    };
    return opts;
  } catch {
    return {
      url: redisUrl,
      options: { maxRetriesPerRequest: null },
    };
  }
}

/** Raw client for QueueEvents (separate from RedisService cache timeouts). */
export function createRawBullMqRedis(config: ConfigService): Redis | null {
  const redisUrl = config.get<string>('REDIS_URL');
  if (!redisUrl) return null;
  try {
    return new Redis(redisUrl, { maxRetriesPerRequest: null });
  } catch {
    return null;
  }
}
