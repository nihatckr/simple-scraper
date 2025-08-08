export type RouteKey = string;
export interface RouteMetric {
    method: string;
    path: string;
    count: number;
    totalMs: number;
    minMs: number;
    maxMs: number;
    p95Ms: number;
    avgMs: number;
    lastStatus?: number;
}
export interface ErrorRecord {
    message: string;
    path?: string;
    status?: number;
    timestamp: Date;
}
declare class MetricsStore {
    private routeDurations;
    private routeMeta;
    private errors;
    recordRequest(method: string, path: string, status: number, durationMs: number): void;
    recordError(err: any, path?: string, status?: number): void;
    private percentile;
    getRoutes(): RouteMetric[];
    getErrors(limit?: number): ErrorRecord[];
    getSnapshot(): {
        totalRequests: number;
        routeCount: number;
        avgLatency: number;
        topRoutes: RouteMetric[];
        errors: ErrorRecord[];
        timestamp: Date;
    };
}
export declare const metrics: MetricsStore;
export declare function time<T>(label: string, fn: () => Promise<T>): Promise<T>;
export {};
//# sourceMappingURL=metrics.d.ts.map