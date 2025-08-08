import { create } from 'zustand'
import {
  DashboardState,
  StatsResponse,
  DashboardStatsResponse,
  Brand,
  SubCategory,
  Product,
} from '@/lib/types'

interface DashboardStore extends DashboardState {
  // Actions
  setStats: (stats: StatsResponse) => void
  setDashboardStats: (dashboardStats: DashboardStatsResponse) => void
  setBrands: (brands: Brand[]) => void
  setCategories: (categories: SubCategory[]) => void
  setProducts: (products: Product[]) => void
  setPagination: (pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }) => void
  setLoading: (loading: boolean) => void
  setError: (error?: string) => void
  clearError: () => void
  reset: () => void

  // Computed values
  getBrandByName: (name: string) => Brand | undefined
  getCategoryById: (id: number) => SubCategory | undefined
  getProductById: (id: number) => Product | undefined
  getProductsByBrand: (brandName: string) => Product[]
  getProductsByCategory: (categoryId: number) => Product[]
}

const initialState: DashboardState = {
  stats: undefined,
  dashboardStats: undefined,
  brands: [],
  categories: [],
  products: [],
  pagination: undefined,
  loading: false,
  error: undefined,
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  ...initialState,

  // Actions
  setStats: (stats) => set({ stats }),

  setDashboardStats: (dashboardStats) => set({ dashboardStats }),

  setBrands: (brands) => set({ brands }),

  setCategories: (categories) => set({ categories }),

  setProducts: (products) => set({ products }),

  setPagination: (pagination) => set({ pagination }),

  setLoading: (loading) =>
    set((state) => (state.loading === loading ? state : { loading })),

  setError: (error) =>
    set((state) => (state.error === error ? state : { error })),

  clearError: () => set({ error: undefined }),

  reset: () => set(initialState),

  // Computed values
  getBrandByName: (name) => {
    const { brands } = get()
    return brands.find((brand) => brand.name === name)
  },

  getCategoryById: (id) => {
    const { categories } = get()
    return categories.find((category) => category.categoryId === id)
  },

  getProductById: (id) => {
    const { products } = get()
    return products.find((product) => product.productId === id)
  },

  getProductsByBrand: (brandName) => {
    const { products } = get()
    return products.filter((product) => product.brandName === brandName)
  },

  getProductsByCategory: (categoryId) => {
    const { products } = get()
    return products.filter((product) =>
      product.subCategories.some((cat) => cat.categoryId === categoryId),
    )
  },
}))

// Selectors for better performance
export const selectStats = (state: DashboardStore) => state.stats
export const selectDashboardStats = (state: DashboardStore) =>
  state.dashboardStats
export const selectBrands = (state: DashboardStore) => state.brands
export const selectCategories = (state: DashboardStore) => state.categories
export const selectProducts = (state: DashboardStore) => state.products
export const selectPagination = (state: DashboardStore) => state.pagination
export const selectLoading = (state: DashboardStore) => state.loading
export const selectError = (state: DashboardStore) => state.error
