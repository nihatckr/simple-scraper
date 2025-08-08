import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { FilterState } from '@/lib/types'

interface FiltersStore extends FilterState {
  // Actions
  setBrand: (brand?: string) => void
  setCategoryId: (categoryId?: number) => void
  setSearch: (search?: string) => void
  setPriceRange: (minPrice?: number, maxPrice?: number) => void
  setInStock: (inStock?: boolean) => void
  setPeriod: (period?: '7d' | '30d' | '90d') => void
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void

  // Computed values
  hasActiveFilters: () => boolean
  getActiveFiltersCount: () => number
}

const initialState: FilterState = {
  brand: undefined,
  categoryId: undefined,
  search: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  inStock: undefined,
  period: '30d',
}

export const useFiltersStore = create<FiltersStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setBrand: (brand) => set((s) => (s.brand === brand ? s : { brand })),

      setCategoryId: (categoryId) =>
        set((s) => (s.categoryId === categoryId ? s : { categoryId })),

      setSearch: (search) => set((s) => (s.search === search ? s : { search })),

      setPriceRange: (minPrice, maxPrice) =>
        set((s) =>
          s.minPrice === minPrice && s.maxPrice === maxPrice
            ? s
            : { minPrice, maxPrice },
        ),

      setInStock: (inStock) =>
        set((s) => (s.inStock === inStock ? s : { inStock })),

      setPeriod: (period) => set((s) => (s.period === period ? s : { period })),

      setFilters: (filters) =>
        set((state) => {
          const next = { ...state, ...filters }
          const keys: (keyof FilterState)[] = [
            'brand',
            'categoryId',
            'search',
            'minPrice',
            'maxPrice',
            'inStock',
            'period',
          ]
          const unchanged = keys.every((k) => state[k] === next[k])
          return unchanged ? state : next
        }),

      resetFilters: () => set(initialState),

      // Computed values
      hasActiveFilters: () => {
        const state = get()
        return !!(
          state.brand ||
          state.categoryId ||
          state.search ||
          state.minPrice ||
          state.maxPrice ||
          state.inStock
        )
      },

      getActiveFiltersCount: () => {
        const state = get()
        let count = 0
        if (state.brand) count++
        if (state.categoryId) count++
        if (state.search) count++
        if (state.minPrice || state.maxPrice) count++
        if (state.inStock) count++
        return count
      },
    }),
    {
      name: 'dashboard-filters',
      partialize: (state) => ({
        brand: state.brand,
        categoryId: state.categoryId,
        period: state.period,
        // Don't persist search and price filters
      }),
    },
  ),
)
