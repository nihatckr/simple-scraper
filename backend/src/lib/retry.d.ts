export interface RetryOptions {
    maxRetries?: number;
    delay?: number;
    backoffFactor?: number;
    timeout?: number;
    retryCondition?: (error: any) => boolean;
}
export declare class RetryableError extends Error {
    readonly originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare class NonRetryableError extends Error {
    readonly originalError?: Error | undefined;
    constructor(message: string, originalError?: Error | undefined);
}
export declare function withRetry<T>(operation: () => Promise<T>, options?: RetryOptions, operationName?: string): Promise<T>;
export declare function fetchWithRetry(url: string, options?: RequestInit, retryOptions?: RetryOptions): Promise<Response>;
//# sourceMappingURL=retry.d.ts.map