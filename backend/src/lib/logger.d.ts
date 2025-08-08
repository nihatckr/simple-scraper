export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}
export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    data?: any;
    source?: string | undefined;
}
declare class Logger {
    private logLevel;
    private logDir;
    constructor();
    private writeLog;
    private log;
    debug(message: string, data?: any, source?: string): void;
    info(message: string, data?: any, source?: string): void;
    warn(message: string, data?: any, source?: string): void;
    error(message: string, data?: any, source?: string): void;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map