export interface JwtPayload {
    sub: number;
    email: string;
    role: string;
}
export declare function signToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
export declare function hashPassword(plain: string): Promise<string>;
export declare function comparePassword(plain: string, hash: string): Promise<boolean>;
export declare function authMiddleware(requiredRole?: 'admin' | 'user'): (req: any, res: any, next: any) => any;
//# sourceMappingURL=auth.d.ts.map