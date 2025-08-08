'use client'

import { useState, useEffect } from 'react'
import { analyticsApi } from '@/lib/api'
import { PriceDistributionResponse, PriceTrendsResponse } from '@/lib/types'
import { useDebounce } from './use-debounce'

interface PriceAnalyticsFilters {
  brand?: string
  categoryId?: number
  period?: '7d' | '30d' | '90d'
}

interface UsePriceAnalyticsReturn {
  priceDistribution?: PriceDistributionResponse
  priceTrends?: PriceTrendsResponse
  distributionLoading: boolean
  trendsLoading: boolean
  distributionError?: string
  trendsError?: string
  refetch: () => void
}

export function usePriceAnalytics(
  filters: PriceAnalyticsFilters,
  debounceMs = 300,
): UsePriceAnalyticsReturn {
  const [priceDistribution, setPriceDistribution] =
    useState<PriceDistributionResponse>()
  const [priceTrends, setPriceTrends] = useState<PriceTrendsResponse>()

  const [distributionLoading, setDistributionLoading] = useState(false)
  const [trendsLoading, setTrendsLoading] = useState(false)

  const [distributionError, setDistributionError] = useState<string>()
  const [trendsError, setTrendsError] = useState<string>()

  const debouncedFilters = useDebounce(filters, debounceMs)

  const fetchPriceDistribution = async () => {
    setDistributionLoading(true)
    setDistributionError(undefined)
    try {
      const data = await analyticsApi.priceDistribution({
        brand: debouncedFilters.brand,
        categoryId: debouncedFilters.categoryId,
      })
      setPriceDistribution(data)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Fiyat dağılımı yüklenemedi'
      setDistributionError(errorMessage)
    } finally {
      setDistributionLoading(false)
    }
  }

  const fetchPriceTrends = async () => {
    setTrendsLoading(true)
    setTrendsError(undefined)
    try {
      const data = await analyticsApi.priceTrends({
        brand: debouncedFilters.brand,
        categoryId: debouncedFilters.categoryId,
        period: debouncedFilters.period,
      })
      setPriceTrends(data)
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Fiyat trendleri yüklenemedi'
      setTrendsError(errorMessage)
    } finally {
      setTrendsLoading(false)
    }
  }

  const refetch = () => {
    fetchPriceDistribution()
    fetchPriceTrends()
  }

  // Load price distribution when filters change
  useEffect(() => {
    fetchPriceDistribution()
  }, [debouncedFilters.brand, debouncedFilters.categoryId])

  // Load price trends when filters change
  useEffect(() => {
    fetchPriceTrends()
  }, [
    debouncedFilters.brand,
    debouncedFilters.categoryId,
    debouncedFilters.period,
  ])

  return {
    priceDistribution,
    priceTrends,
    distributionLoading,
    trendsLoading,
    distributionError,
    trendsError,
    refetch,
  }
}
