import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { PreferencesState } from '@/lib/types'

interface PreferencesStore extends PreferencesState {
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setChartType: (chartType: 'bar' | 'line' | 'pie') => void
  setDefaultPeriod: (period: '7d' | '30d' | '90d') => void
  setItemsPerPage: (itemsPerPage: number) => void
  resetPreferences: () => void

  // Computed values
  getEffectiveTheme: () => 'light' | 'dark'
}

const initialState: PreferencesState = {
  theme: 'system',
  chartType: 'bar',
  defaultPeriod: '30d',
  itemsPerPage: 20,
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setTheme: (theme) => set({ theme }),

      setChartType: (chartType) => set({ chartType }),

      setDefaultPeriod: (defaultPeriod) => set({ defaultPeriod }),

      setItemsPerPage: (itemsPerPage) => set({ itemsPerPage }),

      resetPreferences: () => set(initialState),

      // Computed values
      getEffectiveTheme: () => {
        const { theme } = get()
        if (theme === 'system') {
          // Check system preference
          if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches
              ? 'dark'
              : 'light'
          }
          return 'light'
        }
        return theme
      },
    }),
    {
      name: 'dashboard-preferences',
    },
  ),
)

// Theme effect hook
export const useThemeEffect = () => {
  const { theme, getEffectiveTheme } = usePreferencesStore()

  if (typeof window !== 'undefined') {
    const effectiveTheme = getEffectiveTheme()
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')
    root.classList.add(effectiveTheme)
  }
}
