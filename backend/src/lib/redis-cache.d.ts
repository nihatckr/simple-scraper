import { RedisClientType } from 'redis';
export declare function initRedis(): Promise<RedisClientType>;
export declare const cacheKeys: {
    productDetails: (productId: number, brand: string) => string;
    categoryProducts: (categoryId: number, brand: string) => string;
    brandData: (brand: string) => string;
    productIds: (categoryId: number, brand: string) => string;
};
export declare const CACHE_TTL = 3600;
export interface CacheInterface {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    flush(): Promise<void>;
    getStats(): Promise<{
        keys: number;
        memory: string;
    }>;
}
export declare class RedisCache implements CacheInterface {
    private client;
    constructor(client: RedisClientType);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    flush(): Promise<void>;
    getStats(): Promise<{
        keys: number;
        memory: string;
    }>;
}
export declare function getCache(): Promise<RedisCache>;
export declare function closeCache(): Promise<void>;
//# sourceMappingURL=redis-cache.d.ts.map