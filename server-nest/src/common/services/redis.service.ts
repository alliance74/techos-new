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

    this.client = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: Number(this.configService.get<string>('REDIS_PORT') || 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > 20) {
          this.logger.error('Redis reconnect gave up after repeated failures');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    this.client.on('error', (err) => {
      this.logger.error(`Redis error: ${err.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected');
    });
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
