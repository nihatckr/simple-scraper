'use client'

import { useEffect } from 'react'
import { useApi, useApiWithRefresh } from './use-api'
import { statsApi, brandApi, categoryApi } from '@/lib/api'
import { useDashboardStore } from '@/store/dashboard'
import { useFiltersStore } from '@/store/filters'

export function useDashboardData() {
  const {
    setStats,
    setDashboardStats,
    setBrands,
    setCategories,
    setLoading,
    setError,
  } = useDashboardStore()
  const { period } = useFiltersStore()

  // Fetch overview stats with refresh
  const statsQuery = useApiWithRefresh(
    () => statsApi.overview(),
    30000, // Refresh every 30 seconds
    [],
  )

  // Fetch dashboard stats
  const dashboardStatsQuery = useApiWithRefresh(
    () => statsApi.dashboard(period),
    60000, // Refresh every minute
    [period],
  )

  // Fetch brands
  const brandsQuery = useApi(() => brandApi.list(), [])

  // Fetch categories
  const categoriesQuery = useApi(() => categoryApi.list(), [])

  // Update store when data changes
  useEffect(() => {
    if (statsQuery.data) setStats(statsQuery.data)
  }, [statsQuery.data])

  useEffect(() => {
    if (dashboardStatsQuery.data) setDashboardStats(dashboardStatsQuery.data)
  }, [dashboardStatsQuery.data])

  useEffect(() => {
    if (brandsQuery.data) setBrands(brandsQuery.data)
  }, [brandsQuery.data])

  useEffect(() => {
    if (categoriesQuery.data) setCategories(categoriesQuery.data)
  }, [categoriesQuery.data])

  // Update loading state
  useEffect(() => {
    const loading =
      statsQuery.loading ||
      dashboardStatsQuery.loading ||
      brandsQuery.loading ||
      categoriesQuery.loading
    setLoading(loading)
  }, [
    statsQuery.loading,
    dashboardStatsQuery.loading,
    brandsQuery.loading,
    categoriesQuery.loading,
  ])

  // Update error state
  useEffect(() => {
    const error =
      statsQuery.error ||
      dashboardStatsQuery.error ||
      brandsQuery.error ||
      categoriesQuery.error
    setError(error || undefined)
  }, [
    statsQuery.error,
    dashboardStatsQuery.error,
    brandsQuery.error,
    categoriesQuery.error,
  ])

  return {
    stats: statsQuery.data,
    dashboardStats: dashboardStatsQuery.data,
    brands: brandsQuery.data,
    categories: categoriesQuery.data,
    loading:
      statsQuery.loading ||
      dashboardStatsQuery.loading ||
      brandsQuery.loading ||
      categoriesQuery.loading,
    error:
      statsQuery.error ||
      dashboardStatsQuery.error ||
      brandsQuery.error ||
      categoriesQuery.error,
    refetch: {
      stats: statsQuery.refetch,
      dashboardStats: dashboardStatsQuery.refetch,
      brands: brandsQuery.refetch,
      categories: categoriesQuery.refetch,
    },
  }
}

export function useStatsData(period?: string) {
  return useApiWithRefresh(() => statsApi.dashboard(period), 30000, [period])
}

export function useBrandData() {
  return useApi(() => brandApi.list(), [])
}

export function useCategoryData(filters?: {
  brand?: string
  leaf?: boolean
  level?: number
}) {
  return useApi(() => categoryApi.list(filters), [filters])
}
