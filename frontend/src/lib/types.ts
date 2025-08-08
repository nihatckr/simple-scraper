// API Response Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// Brand Types
export interface Brand {
  id: string
  name: string
  timestamp: string
  mainCategories: MainCategory[]
  _count: {
    products: number
  }
}

// Category Types
export interface MainCategory {
  id: number
  name: string
  brand: Brand
  brandId: string
  gender: string
  level: number
  subcategories: SubCategory[]
  createdAt: string
  updatedAt: string
}

export interface SubCategory {
  categoryId: number
  categoryName: string
  brand: string
  gender: string
  level: number
  isLeaf: boolean
  matchingId?: number
  productCount?: number
  parentCategoryId?: number
  parentSubCategoryId?: number
  subcategories?: SubCategory[]
  products?: Product[]
  _count: {
    products: number
  }
  createdAt: string
  updatedAt: string
}

// Product Types
export interface Product {
  id: number
  productId: number
  name: string
  brandName: string
  price?: number
  description?: string
  colors: ProductColor[]
  images: ProductImage[]
  sizes: ProductSize[]
  stock: ProductStock[]
  subCategories: SubCategory[]
  _count: {
    colors: number
    images: number
    sizes: number
  }
  createdAt: string
  updatedAt: string
}

export interface ProductColor {
  id: number
  colorId: string
  name: string
  hexCode?: string
  price?: number
  description?: string
  productId: number
  images: ProductImage[]
  sizes: ProductSize[]
  stock: ProductStock[]
  priceHistory: PriceHistory[]
  stockHistory: StockHistory[]
}

export interface ProductImage {
  id: number
  url: string
  type: string
  kind: string
  order: number
  productId: number
  colorId?: number
  colorName?: string
  colorIndex?: number
}

export interface ProductSize {
  id: number
  sizeId: number
  name: string
  availability: string
  price?: number
  sku?: number
  productId: number
  colorId?: number
  colorName?: string
}

export interface ProductStock {
  id: number
  sizeId: number
  name: string
  availability: string
  price?: number
  sku?: number
  productId: number
  colorId?: number
  colorName?: string
}

// History Types
export interface PriceHistory {
  id: number
  productId: number
  price: number
  colorId?: number
  color?: ProductColor
  timestamp: string
}

export interface StockHistory {
  id: number
  productId: number
  sizeId: number
  colorId?: number
  color?: ProductColor
  available: boolean
  timestamp: string
}

export interface CategoryHistory {
  id: number
  categoryId: number
  category: SubCategory
  action: string
  changes?: any
  timestamp: string
}

// Stats Types
export interface StatsResponse {
  brands: number
  mainCategories: number
  subCategories: number
  leafCategories: number
  products: number
  timestamp: string
}

export interface DashboardStatsResponse {
  overview: {
    totalProducts: number
    productsWithPrice: number
    productsInStock: number
    avgPrice: number
    priceChanges: number
    stockChanges: number
  }
  brandStats: Array<{
    brand: string
    productCount: number
    avgPrice: number
  }>
  categoryStats: Array<{
    brand: string
    categoryCount: number
  }>
  recentActivity: Product[]
  period: string
  timestamp: string
}

export interface BrandStatsResponse {
  brandName: string
  stats: {
    totalProducts: number
    productsWithPrice: number
    avgPrice: number
    minPrice: number
    maxPrice: number
    totalCategories: number
    leafCategories: number
    priceHistory: number
    stockHistory: number
  }
  recentProducts: Product[]
  period: string
  timestamp: string
}

export interface CategoryStatsResponse {
  category: SubCategory
  stats: {
    avgPrice: number
    minPrice: number
    maxPrice: number
    productsWithPrice: number
    productsInStock: number
    priceHistory: number
    stockHistory: number
  }
  period: string
  timestamp: string
}

export interface ProductStatsResponse {
  product: Product
  stats: {
    colorCount: number
    imageCount: number
    sizeCount: number
    priceAnalysis?: {
      firstPrice: number
      lastPrice: number
      lowestPrice: number
      highestPrice: number
      priceChange: number
      dataPoints: number
    }
    stockAnalysis?: {
      currentlyInStock: boolean
      stockChanges: Array<{
        from: boolean
        to: boolean
        timestamp: string
      }>
      outOfStockCount: number
      restockCount: number
      dataPoints: number
    }
  }
  period: string
  timestamp: string
}

export interface PriceHistoryResponse {
  history: PriceHistory[]
  analysis?: {
    firstPrice: number
    lastPrice: number
    priceChange: number
    lowestPrice: number
    highestPrice: number
    dataPoints: number
  }
}

export interface StockHistoryResponse {
  history: StockHistory[]
  analysis?: {
    stockChanges: Array<{
      from: boolean
      to: boolean
      timestamp: string
    }>
    currentlyInStock: boolean
    outOfStockCount: number
    restockCount: number
    dataPoints: number
  }
}

export interface PriceTrendsResponse {
  trends: Array<{
    date: string
    avgPrice: number
    count: number
  }>
  period: string
  filters: {
    brand?: string
    categoryId?: number
  }
  timestamp: string
}

export interface PriceDistributionResponse {
  distribution: Array<{
    range: string
    min: number
    max: number
    count: number
    percentage: number
  }>
  stats: {
    min: number
    max: number
    avg: number
    median: number
    total: number
  }
  filters: {
    brand?: string
    categoryId?: number
  }
  timestamp: string
}

export interface StockAnalysisResponse {
  inStock: number
  outOfStock: number
  totalProducts: number
  stockRatio: number
  filters: {
    brand?: string
    categoryId?: number
  }
  timestamp: string
}

export interface BrandComparisonResponse {
  metric: string
  period: string
  data: any[]
  timestamp: string
}

export interface CategoryPerformanceResponse {
  performance: Array<{
    categoryId: number
    categoryName: string
    brand: string
    productCount: number
    avgPrice: number
    totalColors: number
    totalImages: number
  }>
  filters: {
    brand?: string
    limit?: string
  }
  timestamp: string
}

export interface SearchResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  filters: {
    q?: string
    brand?: string
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }
  timestamp: string
}

// Filter Types
export interface FilterState {
  brand?: string
  categoryId?: number
  search?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  period?: '7d' | '30d' | '90d'
}

// Store Types
export interface DashboardState {
  stats?: StatsResponse
  dashboardStats?: DashboardStatsResponse
  brands: Brand[]
  categories: SubCategory[]
  products: Product[]
  pagination?: {
    page: number
    limit: number
    total: number
    pages: number
  }
  loading: boolean
  error?: string
}

export interface PreferencesState {
  theme: 'light' | 'dark' | 'system'
  chartType: 'bar' | 'line' | 'pie'
  defaultPeriod: '7d' | '30d' | '90d'
  itemsPerPage: number
}

// Chart Data Types
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: any
}

export interface TimeSeriesDataPoint {
  date: string
  value: number
  [key: string]: any
}

// Error Types
export class ApiError extends Error {
  constructor(message: string, public status: number, public response?: any) {
    super(message)
    this.name = 'ApiError'
  }
}
