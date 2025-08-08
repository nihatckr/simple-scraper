// Export all stores
export { useFiltersStore } from './filters'
export {
  useDashboardStore,
  selectStats,
  selectDashboardStats,
  selectBrands,
  selectCategories,
  selectProducts,
  selectPagination,
  selectLoading,
  selectError,
} from './dashboard'
export { usePreferencesStore, useThemeEffect } from './preferences'

// Combined store hook for common operations
import { useFiltersStore } from './filters'
import { useDashboardStore } from './dashboard'
import { usePreferencesStore } from './preferences'

export const useAppStore = () => {
  const filters = useFiltersStore()
  const dashboard = useDashboardStore()
  const preferences = usePreferencesStore()

  return {
    filters,
    dashboard,
    preferences,
  }
}

// Utility hooks
export const useCurrentFilters = () => {
  return useFiltersStore((state) => ({
    brand: state.brand,
    categoryId: state.categoryId,
    search: state.search,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
    inStock: state.inStock,
    period: state.period,
  }))
}

export const useFilterActions = () => {
  return useFiltersStore((state) => ({
    setBrand: state.setBrand,
    setCategoryId: state.setCategoryId,
    setSearch: state.setSearch,
    setPriceRange: state.setPriceRange,
    setInStock: state.setInStock,
    setPeriod: state.setPeriod,
    setFilters: state.setFilters,
    resetFilters: state.resetFilters,
  }))
}

export const useDashboardActions = () => {
  return useDashboardStore((state) => ({
    setStats: state.setStats,
    setDashboardStats: state.setDashboardStats,
    setBrands: state.setBrands,
    setCategories: state.setCategories,
    setProducts: state.setProducts,
    setPagination: state.setPagination,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    reset: state.reset,
  }))
}
