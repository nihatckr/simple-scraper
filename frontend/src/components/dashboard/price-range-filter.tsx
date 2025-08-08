'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from 'lucide-react'
import { formatPrice } from '@/lib/api'
import { useDebounce } from '@/hooks/use-debounce'

interface PriceRangeFilterProps {
  brands: string[]
  categories: Array<{ categoryId: number; categoryName: string; brand: string }>
  filters: {
    brand?: string
    categoryId?: number
    minPrice?: number
    maxPrice?: number
    period?: '7d' | '30d' | '90d'
  }
  onFiltersChange: (filters: PriceRangeFilterProps['filters']) => void
  loading?: boolean
}

export function PriceRangeFilter({
  brands,
  categories,
  filters,
  onFiltersChange,
  loading,
}: PriceRangeFilterProps) {
  const [localMinPrice, setLocalMinPrice] = useState(
    filters.minPrice?.toString() || '',
  )
  const [localMaxPrice, setLocalMaxPrice] = useState(
    filters.maxPrice?.toString() || '',
  )

  const debouncedMinPrice = useDebounce(localMinPrice, 500)
  const debouncedMaxPrice = useDebounce(localMaxPrice, 500)

  // Update filters when debounced values change
  useEffect(() => {
    const minPrice = debouncedMinPrice
      ? parseFloat(debouncedMinPrice) * 100
      : undefined
    const maxPrice = debouncedMaxPrice
      ? parseFloat(debouncedMaxPrice) * 100
      : undefined

    if (minPrice !== filters.minPrice || maxPrice !== filters.maxPrice) {
      onFiltersChange({
        ...filters,
        minPrice,
        maxPrice,
      })
    }
  }, [debouncedMinPrice, debouncedMaxPrice, filters, onFiltersChange])

  // Sync local state with external filter changes
  useEffect(() => {
    setLocalMinPrice(
      filters.minPrice ? (filters.minPrice / 100).toString() : '',
    )
    setLocalMaxPrice(
      filters.maxPrice ? (filters.maxPrice / 100).toString() : '',
    )
  }, [filters.minPrice, filters.maxPrice])

  const handleBrandChange = (value: string) => {
    onFiltersChange({
      ...filters,
      brand: value === 'all' ? undefined : value,
    })
  }

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      categoryId: value === 'all' ? undefined : parseInt(value),
    })
  }

  const handlePeriodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      period: value as '7d' | '30d' | '90d',
    })
  }

  const clearFilters = () => {
    setLocalMinPrice('')
    setLocalMaxPrice('')
    onFiltersChange({})
  }

  const hasActiveFilters =
    filters.brand ||
    filters.categoryId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.period

  // Filter categories based on selected brand
  const filteredCategories = filters.brand
    ? categories.filter((cat) => cat.brand === filters.brand)
    : categories

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Fiyat Analizi Filtreleri
        </CardTitle>
        <CardDescription>
          Fiyat dağılımı ve trend analizleri için filtreleme seçenekleri
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Filter */}
          <div className="space-y-2">
            <Label htmlFor="brand">Marka</Label>
            <Select
              value={filters.brand || 'all'}
              onValueChange={handleBrandChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Marka seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Markalar</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={filters.categoryId?.toString() || 'all'}
              onValueChange={handleCategoryChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem
                    key={category.categoryId}
                    value={category.categoryId.toString()}
                  >
                    {category.categoryName} ({category.brand})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Filter */}
          <div className="space-y-2">
            <Label htmlFor="period">Zaman Periyodu</Label>
            <Select
              value={filters.period || '30d'}
              onValueChange={handlePeriodChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Periyot seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Son 7 Gün</SelectItem>
                <SelectItem value="30d">Son 30 Gün</SelectItem>
                <SelectItem value="90d">Son 90 Gün</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={loading || !hasActiveFilters}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Filtreleri Temizle
            </Button>
          </div>
        </div>

        {/* Price Range */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minPrice">Minimum Fiyat (₺)</Label>
            <Input
              id="minPrice"
              type="number"
              placeholder="0.00"
              value={localMinPrice}
              onChange={(e) => setLocalMinPrice(e.target.value)}
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxPrice">Maksimum Fiyat (₺)</Label>
            <Input
              id="maxPrice"
              type="number"
              placeholder="999.99"
              value={localMaxPrice}
              onChange={(e) => setLocalMaxPrice(e.target.value)}
              disabled={loading}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              Aktif filtreler:
            </span>
            {filters.brand && (
              <Badge variant="secondary">Marka: {filters.brand}</Badge>
            )}
            {filters.categoryId && (
              <Badge variant="secondary">
                Kategori:{' '}
                {
                  categories.find((c) => c.categoryId === filters.categoryId)
                    ?.categoryName
                }
              </Badge>
            )}
            {filters.minPrice && (
              <Badge variant="secondary">
                Min: {formatPrice(filters.minPrice)}
              </Badge>
            )}
            {filters.maxPrice && (
              <Badge variant="secondary">
                Max: {formatPrice(filters.maxPrice)}
              </Badge>
            )}
            {filters.period && (
              <Badge variant="secondary">
                Periyot:{' '}
                {filters.period === '7d'
                  ? '7 Gün'
                  : filters.period === '30d'
                  ? '30 Gün'
                  : '90 Gün'}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
