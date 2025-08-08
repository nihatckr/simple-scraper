'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { categoryApi, brandApi } from '@/lib/api'
import { SubCategory, Brand, CategoryPerformanceResponse } from '@/lib/types'
import { useDebounce } from '@/hooks/use-debounce'
import { CategoryTreeView } from '@/components/dashboard/category-tree-view'
import { CategoryPerformanceCards } from '@/components/dashboard/category-performance-cards'
import { CategoryFilters } from '@/components/dashboard/category-filters'

export default function CategoriesPage() {
  const [categories, setCategories] = useState<SubCategory[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [performance, setPerformance] =
    useState<CategoryPerformanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter states
  const [selectedBrand, setSelectedBrand] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyLeaf, setShowOnlyLeaf] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<number | undefined>()

  const debouncedSearch = useDebounce(searchQuery, 300)

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true)
        const [brandsData, categoriesData, performanceData] = await Promise.all(
          [brandApi.list(), categoryApi.list(), categoryApi.performance()],
        )

        setBrands(brandsData)
        setCategories(categoriesData)
        setPerformance(performanceData)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Veri yüklenirken hata oluştu',
        )
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [])

  // Load filtered categories when filters change
  useEffect(() => {
    const loadFilteredCategories = async () => {
      try {
        const filters: Record<string, string | boolean | number> = {}
        if (selectedBrand) filters.brand = selectedBrand
        if (showOnlyLeaf) filters.leaf = true
        if (selectedLevel !== undefined) filters.level = selectedLevel

        const categoriesData = await categoryApi.list(filters)
        setCategories(categoriesData)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Kategoriler yüklenirken hata oluştu',
        )
      }
    }

    if (!loading) {
      loadFilteredCategories()
    }
  }, [selectedBrand, showOnlyLeaf, selectedLevel, loading])

  // Load performance data when brand filter changes
  useEffect(() => {
    const loadPerformanceData = async () => {
      try {
        const performanceData = await categoryApi.performance(
          selectedBrand || undefined,
        )
        setPerformance(performanceData)
      } catch (err) {
        console.error('Performance data loading error:', err)
      }
    }

    if (!loading) {
      loadPerformanceData()
    }
  }, [selectedBrand, loading])

  // Filter categories by search query
  const filteredCategories = categories.filter((category) =>
    category.categoryName.toLowerCase().includes(debouncedSearch.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kategori Analizi
            </h1>
            <p className="text-muted-foreground">
              Markalar genelinde kategori performansını analiz edin
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Hata</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} variant="outline">
              Tekrar Dene
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Kategori Analizi
          </h1>
          <p className="text-muted-foreground">
            Markalar genelinde kategori performansını analiz edin
          </p>
        </div>
      </div>

      {/* Performance Cards */}
      {performance && (
        <CategoryPerformanceCards
          performance={performance}
          selectedBrand={selectedBrand}
        />
      )}

      {/* Filters */}
      <CategoryFilters
        brands={brands}
        selectedBrand={selectedBrand}
        onBrandChange={setSelectedBrand}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        showOnlyLeaf={showOnlyLeaf}
        onShowOnlyLeafChange={setShowOnlyLeaf}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
      />

      {/* Category Tree View */}
      <CategoryTreeView
        categories={filteredCategories}
        selectedBrand={selectedBrand}
        searchQuery={debouncedSearch}
      />
    </div>
  )
}
