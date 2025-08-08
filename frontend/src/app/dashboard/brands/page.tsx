'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BrandStatsCards } from '@/components/dashboard/brand-stats-cards'
import { BrandProductsChart } from '@/components/dashboard/brand-products-chart'
import { BrandRecentProducts } from '@/components/dashboard/brand-recent-products'
import { brandApi } from '@/lib/api'
import { BrandStatsResponse, Brand } from '@/lib/types'
import { Building2, TrendingUp, Package, DollarSign } from 'lucide-react'

function BrandsPageContent() {
  const searchParams = useSearchParams()
  const [selectedBrand, setSelectedBrand] = useState<string>(
    searchParams.get('brand') || 'ZARA',
  )
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>(
    '30d',
  )
  const [brandStats, setBrandStats] = useState<BrandStatsResponse | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load available brands
  useEffect(() => {
    const loadBrands = async () => {
      try {
        const brandsData = await brandApi.list()
        setBrands(brandsData)
      } catch (err) {
        console.error('Failed to load brands:', err)
        setError('Markalar yüklenemedi')
      }
    }
    loadBrands()
  }, [])

  // Load brand stats when brand or period changes
  useEffect(() => {
    const loadBrandStats = async () => {
      if (!selectedBrand) return

      setLoading(true)
      setError(null)

      try {
        const stats = await brandApi.stats(selectedBrand, selectedPeriod)
        setBrandStats(stats)
      } catch (err) {
        console.error('Failed to load brand stats:', err)
        setError('Marka istatistikleri yüklenemedi')
      } finally {
        setLoading(false)
      }
    }

    loadBrandStats()
  }, [selectedBrand, selectedPeriod])

  const handleBrandChange = (brand: string) => {
    setSelectedBrand(brand)
    // Update URL without page reload
    const url = new URL(window.location.href)
    url.searchParams.set('brand', brand)
    window.history.replaceState({}, '', url.toString())
  }

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d':
        return 'Son 7 Gün'
      case '30d':
        return 'Son 30 Gün'
      case '90d':
        return 'Son 90 Gün'
      default:
        return period
    }
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive mb-2">Hata</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marka Analizi</h1>
          <p className="text-muted-foreground">
            Marka performansını detaylı olarak analiz edin
          </p>
        </div>

        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
          {/* Brand Selector */}
          <Select value={selectedBrand} onValueChange={handleBrandChange}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Marka seçin" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((brand) => (
                <SelectItem key={brand.id} value={brand.name}>
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4" />
                    <span>{brand.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Period Selector */}
          <Select
            value={selectedPeriod}
            onValueChange={(value: '7d' | '30d' | '90d') =>
              setSelectedPeriod(value)
            }
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 Gün</SelectItem>
              <SelectItem value="30d">Son 30 Gün</SelectItem>
              <SelectItem value="90d">Son 90 Gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Current Selection Info */}
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className="flex items-center space-x-1">
          <Building2 className="h-3 w-3" />
          <span>{selectedBrand}</span>
        </Badge>
        <Badge variant="outline" className="flex items-center space-x-1">
          <TrendingUp className="h-3 w-3" />
          <span>{getPeriodLabel(selectedPeriod)}</span>
        </Badge>
      </div>

      {/* Brand Stats Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : brandStats ? (
        <BrandStatsCards
          brandName={brandStats.brandName}
          stats={brandStats.stats}
        />
      ) : null}

      {/* Charts and Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Brand Products Chart */}
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : brandStats ? (
          <BrandProductsChart
            brandName={brandStats.brandName}
            stats={brandStats.stats}
            period={selectedPeriod}
          />
        ) : null}

        {/* Recent Products */}
        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : brandStats ? (
          <BrandRecentProducts
            products={brandStats.recentProducts}
            brandName={brandStats.brandName}
          />
        ) : null}
      </div>

      {/* Additional Stats */}
      {brandStats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Fiyat Geçmişi
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {brandStats.stats.priceHistory}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam fiyat değişikliği kaydı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Stok Geçmişi
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {brandStats.stats.stockHistory}
              </div>
              <p className="text-xs text-muted-foreground">
                Toplam stok değişikliği kaydı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Veri Periyodu
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getPeriodLabel(brandStats.period)}
              </div>
              <p className="text-xs text-muted-foreground">
                Analiz edilen zaman aralığı
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
export default function BrandsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BrandsPageContent />
    </Suspense>
  )
}
