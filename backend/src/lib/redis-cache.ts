import { createClient, RedisClientType } from 'redis'
import { logger } from './logger'

// Redis client instance
let redisClient: RedisClientType | null = null

// Redis bağlantısını başlat
export async function initRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        connectTimeout: 10000,
        // lazyConnect is not part of RedisSocketOptions in v5
      },
    })

    // Error handling
    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected')
    })

    redisClient.on('ready', () => {
      logger.info('Redis Client Ready')
    })

    redisClient.on('end', () => {
      logger.info('Redis Client Disconnected')
    })

    await redisClient.connect()
    return redisClient
  } catch (error) {
    logger.error('Redis connection failed:', error)
    throw error
  }
}

// Cache key'leri oluştur
export const cacheKeys = {
  productDetails: (productId: number, brand: string) => `product_details_${brand}_${productId}`,
  categoryProducts: (categoryId: number, brand: string) => `category_products_${brand}_${categoryId}`,
  brandData: (brand: string) => `brand_data_${brand}`,
  productIds: (categoryId: number, brand: string) => `product_ids_${brand}_${categoryId}`,
}

// Cache TTL (Time To Live) - 1 saat
export const CACHE_TTL = 3600

// Cache interface
export interface CacheInterface {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  exists(key: string): Promise<boolean>
  flush(): Promise<void>
  getStats(): Promise<{ keys: number; memory: string }>
}

// Redis cache implementation
export class RedisCache implements CacheInterface {
  private client: RedisClientType

  constructor(client: RedisClientType) {
    this.client = client
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key)
      if (!value) return null
      
      return JSON.parse(value) as T
    } catch (error) {
      logger.error(`Redis get error for key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_TTL): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value)
      await this.client.setEx(key, ttl, serializedValue)
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`)
    } catch (error) {
      logger.error(`Redis set error for key ${key}:`, error)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
      logger.debug(`Cache deleted: ${key}`)
    } catch (error) {
      logger.error(`Redis delete error for key ${key}:`, error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      logger.error(`Redis exists error for key ${key}:`, error)
      return false
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushDb()
      logger.info('Redis cache flushed')
    } catch (error) {
      logger.error('Redis flush error:', error)
    }
  }

  async getStats(): Promise<{ keys: number; memory: string }> {
    try {
      const info = await this.client.info({ section: 'memory' } as any)
      const keys = await this.client.dbSize()
      
      // Memory usage'ı parse et
      const memoryMatch = info?.match(/used_memory_human:(\S+)/)
      const memory: string = memoryMatch && memoryMatch[1] ? memoryMatch[1] : 'Unknown'
      
      return { keys, memory }
    } catch (error) {
      logger.error('Redis stats error:', error)
      return { keys: 0, memory: 'Unknown' }
    }
  }
}

// Global cache instance
let cacheInstance: RedisCache | null = null

// Cache instance'ını al
export async function getCache(): Promise<RedisCache> {
  if (!cacheInstance) {
    const client = await initRedis()
    cacheInstance = new RedisCache(client)
  }
  return cacheInstance
}

// Cache'i kapat
export async function closeCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
    cacheInstance = null
    logger.info('Redis cache closed')
  }
}

// Graceful shutdown için
process.on('SIGINT', async () => {
  await closeCache()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closeCache()
  process.exit(0)
})
