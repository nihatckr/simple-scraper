import {
  ApiError,
  StatsResponse,
  DashboardStatsResponse,
  Brand,
  SubCategory,
  Product,
  BrandStatsResponse,
  CategoryStatsResponse,
  ProductStatsResponse,
  PriceHistoryResponse,
  StockHistoryResponse,
  PriceTrendsResponse,
  PriceDistributionResponse,
  StockAnalysisResponse,
  BrandComparisonResponse,
  CategoryPerformanceResponse,
  SearchResponse,
  PaginatedResponse,
} from './types'

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002/api'

// Generic API request function with error handling
export async function apiRequest<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  try {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const url = `${API_BASE}${normalizedPath}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('API request failed', {
        url,
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })
      throw new ApiError(
        `API Error: ${response.status} ${response.statusText}`,
        response.status,
        errorText,
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError('Network Error', 0, error)
  }
}

// Health & Status APIs
export const healthApi = {
  check: () => apiRequest<{ status: string; timestamp: string }>('/health'),
}

// Stats APIs
export const statsApi = {
  overview: () => apiRequest<StatsResponse>('/stats/overview'),
  dashboard: (period?: string) =>
    apiRequest<DashboardStatsResponse>(
      `/stats/dashboard${period ? `?period=${period}` : ''}`,
    ),
  system: () => apiRequest<any>('/stats/system'),
}

// Brand APIs
export const brandApi = {
  list: () => apiRequest<Brand[]>('/brands'),
  stats: (brandName: string, period?: string) =>
    apiRequest<BrandStatsResponse>(
      `/brands/${encodeURIComponent(brandName)}/stats${
        period ? `?period=${period}` : ''
      }`,
    ),
  comparison: (metric?: string, period?: string) => {
    const params = new URLSearchParams()
    if (metric) params.append('metric', metric)
    if (period) params.append('period', period)
    return apiRequest<BrandComparisonResponse>(
      `/analytics/brand-comparison${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
}

// Category APIs
export const categoryApi = {
  list: (filters?: { brand?: string; leaf?: boolean; level?: number }) => {
    const params = new URLSearchParams()
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.leaf !== undefined)
      params.append('leaf', filters.leaf.toString())
    if (filters?.level !== undefined)
      params.append('level', filters.level.toString())
    return apiRequest<SubCategory[]>(
      `/categories${params.toString() ? `?${params.toString()}` : ''}`,
    )
  },
  children: (categoryId: number) =>
    apiRequest<{ categoryId: number; children: SubCategory[]; timestamp: string }>(
      `/categories/${categoryId}/children`,
    ),
  breadcrumbs: (categoryId: number) =>
    apiRequest<{ breadcrumbs: Array<{ categoryId: number; categoryName: string; level: number; brand: string }>; timestamp: string }>(
      `/categories/${categoryId}/breadcrumbs`,
    ),
  tree: (brand?: string) => {
    const params = new URLSearchParams()
    if (brand) params.append('brand', brand)
    return apiRequest<{ tree: any[]; count: number; filters: { brand?: string }; timestamp: string }>(
      `/categories/tree${params.toString() ? `?${params.toString()}` : ''}`,
    )
  },
  stats: (categoryId: number, period?: string) =>
    apiRequest<CategoryStatsResponse>(
      `/categories/${categoryId}/stats${period ? `?period=${period}` : ''}`,
    ),
  history: (categoryId: number, start?: string, end?: string) => {
    const params = new URLSearchParams()
    if (start) params.append('start', start)
    if (end) params.append('end', end)
    return apiRequest<any[]>(
      `/categories/${categoryId}/history${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
  performance: (brand?: string, limit?: number) => {
    const params = new URLSearchParams()
    if (brand) params.append('brand', brand)
    if (limit) params.append('limit', limit.toString())
    return apiRequest<CategoryPerformanceResponse>(
      `/analytics/category-performance${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
}

// Product APIs
export const productApi = {
  list: (filters?: {
    brand?: string
    categoryId?: number
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
    return apiRequest<PaginatedResponse<Product>>(
      `/products${params.toString() ? `?${params.toString()}` : ''}`,
    )
  },
  get: (productId: number) => apiRequest<Product>(`/products/${productId}`),
  stats: (productId: number, period?: string) =>
    apiRequest<ProductStatsResponse>(
      `/products/${productId}/stats${period ? `?period=${period}` : ''}`,
    ),
  priceHistory: (
    productId: number,
    filters?: { start?: string; end?: string; colorId?: number },
  ) => {
    const params = new URLSearchParams()
    if (filters?.start) params.append('start', filters.start)
    if (filters?.end) params.append('end', filters.end)
    if (filters?.colorId) params.append('colorId', filters.colorId.toString())
    return apiRequest<PriceHistoryResponse>(
      `/products/${productId}/price-history${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
  stockHistory: (
    productId: number,
    filters?: { start?: string; end?: string; colorId?: number },
  ) => {
    const params = new URLSearchParams()
    if (filters?.start) params.append('start', filters.start)
    if (filters?.end) params.append('end', filters.end)
    if (filters?.colorId) params.append('colorId', filters.colorId.toString())
    return apiRequest<StockHistoryResponse>(
      `/products/${productId}/stock-history${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
}

// Analytics APIs
export const analyticsApi = {
  priceTrends: (filters?: {
    brand?: string
    categoryId?: number
    period?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    if (filters?.period) params.append('period', filters.period)
    return apiRequest<PriceTrendsResponse>(
      `/analytics/price-trends${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
  priceDistribution: (filters?: { brand?: string; categoryId?: number }) => {
    const params = new URLSearchParams()
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    return apiRequest<PriceDistributionResponse>(
      `/analytics/price-distribution${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
  stockAnalysis: (filters?: { brand?: string; categoryId?: number }) => {
    const params = new URLSearchParams()
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    return apiRequest<StockAnalysisResponse>(
      `/analytics/stock-analysis${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
  stockTrends: (filters?: {
    brand?: string
    categoryId?: number
    period?: string
  }) => {
    const params = new URLSearchParams()
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    if (filters?.period) params.append('period', filters.period)
    return apiRequest<any>(
      `/analytics/stock-trends${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
  dataQuality: () => apiRequest<any>(`/analytics/data-quality`),
  categoryHierarchy: (brand?: string) => {
    const params = new URLSearchParams()
    if (brand) params.append('brand', brand)
    return apiRequest<any>(
      `/analytics/category-hierarchy${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
  timeBased: (filters?: { period?: string; groupBy?: 'day' | 'week' | 'month' }) => {
    const params = new URLSearchParams()
    if (filters?.period) params.append('period', filters.period)
    if (filters?.groupBy) params.append('groupBy', filters.groupBy)
    return apiRequest<any>(
      `/analytics/time-based${params.toString() ? `?${params.toString()}` : ''}`,
    )
  },
}

// Search API
export const searchApi = {
  products: (filters?: {
    q?: string
    brand?: string
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    page?: number
    limit?: number
  }) => {
    const params = new URLSearchParams()
    if (filters?.q) params.append('q', filters.q)
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    if (filters?.minPrice)
      params.append('minPrice', filters.minPrice.toString())
    if (filters?.maxPrice)
      params.append('maxPrice', filters.maxPrice.toString())
    if (filters?.inStock !== undefined)
      params.append('inStock', filters.inStock.toString())
    if (filters?.page) params.append('page', filters.page.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    return apiRequest<SearchResponse>(
      `/search${params.toString() ? `?${params.toString()}` : ''}`,
    )
  },
}

// Auth APIs
export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiRequest<any>(`/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    apiRequest<any>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  profile: (token: string) =>
    apiRequest<any>(`/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updateProfile: (token: string, data: { name?: string }) =>
    apiRequest<any>(`/auth/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),
}

// Sync APIs
export const syncApi = {
  status: () => apiRequest<any>(`/sync/status`),
  trigger: (type: 'categories' | 'products') =>
    apiRequest<any>(`/sync/trigger`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
}

// Monitoring APIs
export const monitoringApi = {
  performance: () => apiRequest<any>(`/monitoring/performance`),
  cacheStats: () => apiRequest<any>(`/monitoring/cache-stats`),
  cacheFlush: () =>
    apiRequest<any>(`/monitoring/cache-flush`, {
      method: 'POST',
    }),
}

// Notifications API
export const notificationsApi = {
  list: (filters?: { type?: string; limit?: number }) => {
    const params = new URLSearchParams()
    if (filters?.type) params.append('type', filters.type)
    if (filters?.limit) params.append('limit', filters.limit.toString())
    return apiRequest<any>(
      `/notifications${params.toString() ? `?${params.toString()}` : ''}`,
    )
  },
}

// Preferences API
export const preferencesApi = {
  get: () => apiRequest<any>(`/preferences`),
  update: (preferences: any) =>
    apiRequest<any>(`/preferences`, {
      method: 'PUT',
      body: JSON.stringify({ preferences }),
    }),
}

// Recommendations API
export const recommendationsApi = {
  products: (filters?: { brand?: string; categoryId?: number; limit?: number }) => {
    const params = new URLSearchParams()
    if (filters?.brand) params.append('brand', filters.brand)
    if (filters?.categoryId)
      params.append('categoryId', filters.categoryId.toString())
    if (filters?.limit) params.append('limit', filters.limit.toString())
    return apiRequest<any>(
      `/recommendations/products${
        params.toString() ? `?${params.toString()}` : ''
      }`,
    )
  },
}

// Insights API
export const insightsApi = {
  business: (period?: string) => {
    const params = new URLSearchParams()
    if (period) params.append('period', period)
    return apiRequest<any>(
      `/insights/business${params.toString() ? `?${params.toString()}` : ''}`,
    )
  },
}

// Reports API
export const reportsApi = {
  generate: (data: {
    type: 'products' | 'categories' | 'analytics' | 'quality'
    filters?: any
    format?: 'json' | 'csv'
  }) =>
    apiRequest<any>(`/reports/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Utility functions
export const formatPrice = (price: number): string => {
  return `₺${(price / 100).toFixed(2)}`
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('tr-TR')
}

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('tr-TR')
}
