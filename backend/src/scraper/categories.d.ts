export declare function clearOutputDirectory(): void;
export declare function fetchBrandData(brandName: string, url: string, headers: Record<string, string>): Promise<any>;
export declare function fetchZaraProductIds(categoryId: number, headers: Record<string, string>): Promise<number[]>;
export declare function fetchPullBearProductIds(categoryId: number, headers: Record<string, string>): Promise<number[]>;
export declare function processAllCategories(categories: any[], brandName: string, genderName: string, level?: number, maxLevel?: number, brandConfig?: any, parentMatchingId?: any): Promise<any[]>;
export declare function structureBrandData(brandName: string, brandConfig: any, rawData: any): Promise<any>;
export declare function saveCategoryData(): Promise<void>;
//# sourceMappingURL=categories.d.ts.map