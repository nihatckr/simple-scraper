export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: Date;
    checks: {
        database: HealthCheck;
        environment: HealthCheck;
        disk: HealthCheck;
    };
}
export interface HealthCheck {
    status: 'pass' | 'fail' | 'warn';
    responseTime?: number;
    message?: string;
}
export declare function performHealthCheck(): Promise<HealthStatus>;
export declare function startHealthCheckSchedule(intervalMs?: number): void;
//# sourceMappingURL=health.d.ts.map