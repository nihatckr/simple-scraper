'use client'

import { useState, useEffect } from 'react'
import { PriceDistributionChart } from '@/components/charts/price-distribution-chart'
import { PriceTrendsChart } from '@/components/charts/price-trends-chart'
import { PriceRangeFilter } from '@/components/dashboard/price-range-filter'
import { usePriceAnalytics } from '@/hooks/use-price-analytics'
import { brandApi, categoryApi } from '@/lib/api'
import { SubCategory } from '@/lib/types'

interface PriceAnalyticsProps {
  initialBrand?: string
  initialCategoryId?: number
}

export function PriceAnalytics({
  initialBrand,
  initialCategoryId,
}: PriceAnalyticsProps) {
  const [filters, setFilters] = useState({
    brand: initialBrand,
    categoryId: initialCategoryId,
    period: '30d' as '7d' | '30d' | '90d',
  })

  const [brands, setBrands] = useState<string[]>([])
  const [categories, setCategories] = useState<SubCategory[]>([])

  const [brandsLoading, setBrandsLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Use the price analytics hook
  const {
    priceDistribution,
    priceTrends,
    distributionLoading,
    trendsLoading,
    distributionError,
    trendsError,
  } = usePriceAnalytics(filters)

  // Load brands
  useEffect(() => {
    const loadBrands = async () => {
      setBrandsLoading(true)
      try {
        const brandsData = await brandApi.list()
        setBrands(brandsData.map((brand) => brand.name))
      } catch (error) {
        console.error('Markalar yüklenemedi:', error)
      } finally {
        setBrandsLoading(false)
      }
    }

    loadBrands()
  }, [])

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      setCategoriesLoading(true)
      try {
        const categoriesData = await categoryApi.list({
          brand: filters.brand,
          leaf: true,
        })
        setCategories(categoriesData)
      } catch (error) {
        console.error('Kategoriler yüklenemedi:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    loadCategories()
  }, [filters.brand])

  const handleFiltersChange = (newFilters: {
    brand?: string
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    period?: '7d' | '30d' | '90d'
  }) => {
    setFilters({
      brand: newFilters.brand,
      categoryId: newFilters.categoryId,
      period: newFilters.period || '30d',
    })
  }

  const isLoading =
    distributionLoading || trendsLoading || brandsLoading || categoriesLoading

  return (
    <div className="space-y-6">
      <PriceRangeFilter
        brands={brands}
        categories={categories.map((cat) => ({
          categoryId: cat.categoryId,
          categoryName: cat.categoryName,
          brand: cat.brand,
        }))}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={isLoading}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <PriceDistributionChart
          data={priceDistribution}
          loading={distributionLoading}
          error={distributionError}
        />

        <PriceTrendsChart
          data={priceTrends}
          loading={trendsLoading}
          error={trendsError}
        />
      </div>
    </div>
  )
}
