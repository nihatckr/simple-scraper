import 'dotenv/config';
export interface Env {
    NODE_ENV: 'development' | 'production' | 'test';
    DATABASE_URL: string;
    PORT: number;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    MAX_RETRIES: number;
    RETRY_DELAY: number;
    REQUEST_TIMEOUT: number;
    DB_CONNECTION_TIMEOUT: number;
    DB_POOL_SIZE: number;
    BATCH_SIZE: number;
    PRODUCT_LIMIT_DEV: number;
    PRODUCT_LIMIT_PROD: number;
}
export declare const env: Env;
export declare const isDevelopment: () => boolean;
export declare const isProduction: () => boolean;
export declare const getProductLimit: () => number;
//# sourceMappingURL=env.d.ts.map