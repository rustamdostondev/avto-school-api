import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as IORedis from 'ioredis';
import { isArray, isObject } from 'class-validator';
import { REDIS_DURATION_MONTH } from './durations';
import { REDIS_HOST, REDIS_PASS, REDIS_PORT } from '@env';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: IORedis.Redis;

  constructor(@Inject(CACHE_MANAGER) private inMemoryCache: Cache) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect() {
    this.client = new IORedis.Redis({
      host: REDIS_HOST,
      port: Number(REDIS_PORT),
      password: REDIS_PASS,
      lazyConnect: true, // Prevent automatic connection
    });

    try {
      await this.client.connect();
      console.log('🕹  Redis - Connection successful');
      console.log(`🕹  Redis is running on: ${REDIS_HOST}:${REDIS_PORT}`);
    } catch (error) {
      console.warn(`🕹  Redis - Client connection error ${error}`);
    }

    this.client.on('connect', () => {
      console.log(`🕹  Redis - Connected to ${REDIS_HOST}:${REDIS_PORT}`);
    });

    this.client.on('error', (error) => {
      console.warn(`🕹  Redis - Error ${error}`);
    });
  }

  disconnect() {
    if (this.client) {
      this.client.disconnect();
      console.log('🕹 Redis - Client disconnected');
    }
  }

  async get(key: string) {
    try {
      const data = await this.client.get(key);
      return this.outputFormat(data);
    } catch (error) {
      console.log('inMemory get called', key);
      const data = await this.inMemoryCache.get<string>(key);
      return this.outputFormat(data);
    }
  }

  async del(key: string) {
    try {
      await this.inMemoryCache.del(key);
      return await this.client.del(key);
    } catch (error) {
      console.log('inMemory del called', key);
      return this.inMemoryCache.del(key);
    }
  }

  async set(key: string, value: any, ttl = REDIS_DURATION_MONTH) {
    const formattedValue = this.inputFormat(value);
    try {
      return await this.client.set(key, formattedValue, 'EX', ttl / 1000);
    } catch (error) {
      console.log('inMemory set called', key);
      return this.inMemoryCache.set(key, formattedValue, ttl);
    }
  }

  async cache(key: string, executablePromise, ttl = REDIS_DURATION_MONTH) {
    const data = await this.get(key);
    if (!data) {
      const data_callback = await executablePromise;

      if (!data_callback) {
        return data_callback;
      }

      await this.set(key, data_callback, ttl);
      return data_callback;
    }

    return data;
  }

  inputFormat(value: any) {
    if (isObject(value) || isArray(value)) {
      return JSON.stringify(value);
    }

    return value;
  }

  outputFormat(value: string) {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
}
