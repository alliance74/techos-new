import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private enabled = true;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const disabled = this.configService.get<string>('REDIS_ENABLED') === 'false';
    if (disabled) {
      this.enabled = false;
      this.logger.warn('Redis disabled via REDIS_ENABLED=false');
      return;
    }

    const redisHost = this.configService.get<string>('REDIS_HOST');
    
    // If no Redis host is configured, disable Redis silently
    if (!redisHost || redisHost === 'localhost' || redisHost === '127.0.0.1') {
      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      if (isProduction) {
        this.enabled = false;
        this.logger.log('Redis not configured (production mode) - running without cache');
        return;
      }
    }

    try {
      this.client = new Redis({
        host: redisHost || 'localhost',
        port: Number(this.configService.get<string>('REDIS_PORT') || 6379),
        password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: false,
        connectTimeout: 5000, // 5 second timeout
        retryStrategy: (times) => {
          // Only retry 3 times, then give up
          if (times > 3) {
            this.logger.warn('Redis unavailable - running without cache');
            this.client = null;
            this.enabled = false;
            return null; // Stop retrying
          }
          return Math.min(times * 500, 2000);
        },
      });

      this.client.on('error', (err) => {
        // Only log error once, not repeatedly
        if (this.enabled) {
          this.logger.warn(`Redis connection failed - continuing without cache: ${err.message}`);
          this.enabled = false;
        }
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected');
        this.enabled = true;
      });
    } catch (error) {
      this.logger.warn('Redis initialization failed - running without cache');
      this.client = null;
      this.enabled = false;
    }
  }

  onModuleDestroy() {
    void this.client?.quit();
  }

  private requireClient(): Redis {
    if (!this.client) {
      throw new Error('Redis is not available');
    }
    return this.client;
  }

  isReady(): boolean {
    return Boolean(this.client && this.client.status === 'ready');
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) return;
    if (ttl) {
      await this.client.setex(key, ttl, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client) return false;
    const result = await this.client.exists(key);
    return result === 1;
  }

  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.client) return;
    await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.client) return {};
    return this.client.hgetall(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (!this.client) return;
    await this.client.expire(key, seconds);
  }

  async incr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.incr(key);
  }

  async decr(key: string): Promise<number> {
    if (!this.client) return 0;
    return this.client.decr(key);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    if (!this.client) return 0;
    return this.client.lpush(key, ...values);
  }

  async rpop(key: string): Promise<string | null> {
    if (!this.client) return null;
    return this.client.rpop(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.client) return [];
    return this.client.lrange(key, start, stop);
  }

  getClient(): Redis {
    return this.requireClient();
  }
}
