type ShutdownHandler = () => Promise<void> | void;
declare class GracefulShutdown {
    private handlers;
    private isShuttingDown;
    private shutdownTimeoutMs;
    constructor();
    private setupSignalHandlers;
    private handleShutdown;
    addHandler(handler: ShutdownHandler): void;
    removeHandler(handler: ShutdownHandler): void;
}
export declare const gracefulShutdown: GracefulShutdown;
export declare function onShutdown(handler: ShutdownHandler): void;
export {};
//# sourceMappingURL=shutdown.d.ts.map