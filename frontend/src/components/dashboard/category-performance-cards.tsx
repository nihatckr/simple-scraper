'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FolderTree,
  Package,
  TrendingUp,
  BarChart3,
  Palette,
  Image as ImageIcon,
  Target,
} from 'lucide-react'
import { CategoryPerformanceResponse } from '@/lib/types'
import { formatPrice } from '@/lib/api'

interface CategoryPerformanceCardsProps {
  performance: CategoryPerformanceResponse
  selectedBrand?: string
}

export function CategoryPerformanceCards({
  performance,
  selectedBrand,
}: CategoryPerformanceCardsProps) {
  const { performance: categoryData } = performance

  // Calculate aggregate statistics
  const totalCategories = categoryData.length
  const totalProducts = categoryData.reduce(
    (sum, cat) => sum + cat.productCount,
    0,
  )
  const avgPrice =
    categoryData.reduce((sum, cat) => sum + (cat.avgPrice || 0), 0) /
    Math.max(totalCategories, 1)
  const totalColors = categoryData.reduce(
    (sum, cat) => sum + (cat.totalColors || 0),
    0,
  )
  const totalImages = categoryData.reduce(
    (sum, cat) => sum + (cat.totalImages || 0),
    0,
  )

  // Find top performing categories
  const topCategoryByProducts = categoryData.reduce(
    (max, cat) => (cat.productCount > (max?.productCount || 0) ? cat : max),
    categoryData[0],
  )

  const topCategoryByPrice = categoryData.reduce(
    (max, cat) => ((cat.avgPrice || 0) > (max?.avgPrice || 0) ? cat : max),
    categoryData[0],
  )

  // Brand-specific statistics
  const brandStats = selectedBrand
    ? categoryData.filter((cat) => cat.brand === selectedBrand)
    : categoryData

  const brandCategories = brandStats.length
  const brandProducts = brandStats.reduce(
    (sum, cat) => sum + cat.productCount,
    0,
  )
  const brandAvgPrice =
    brandStats.reduce((sum, cat) => sum + (cat.avgPrice || 0), 0) /
    Math.max(brandStats.length, 1)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {selectedBrand
              ? `${selectedBrand} Kategorileri`
              : 'Toplam Kategori'}
          </CardTitle>
          <FolderTree className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {selectedBrand ? brandCategories : totalCategories}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedBrand ? 'Marka kategorileri' : 'Tüm markalar'}
          </p>
          {!selectedBrand && (
            <div className="flex space-x-1 mt-2">
              {performance.performance
                .reduce((brands: string[], cat) => {
                  if (!brands.includes(cat.brand)) brands.push(cat.brand)
                  return brands
                }, [])
                .map((brand) => (
                  <Badge key={brand} variant="outline" className="text-xs">
                    {brand}
                  </Badge>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Total Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {selectedBrand ? `${selectedBrand} Ürünleri` : 'Toplam Ürün'}
          </CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {selectedBrand ? brandProducts : totalProducts}
          </div>
          <p className="text-xs text-muted-foreground">
            Kategorilerdeki ürünler
          </p>
          {topCategoryByProducts && (
            <p className="text-xs text-muted-foreground mt-1">
              En çok: {topCategoryByProducts.categoryName} (
              {topCategoryByProducts.productCount})
            </p>
          )}
        </CardContent>
      </Card>

      {/* Average Price */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ortalama Fiyat</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPrice(selectedBrand ? brandAvgPrice : avgPrice)}
          </div>
          <p className="text-xs text-muted-foreground">Kategori ortalaması</p>
          {topCategoryByPrice && (
            <p className="text-xs text-muted-foreground mt-1">
              En yüksek: {topCategoryByPrice.categoryName}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Content Richness */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            İçerik Zenginliği
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Palette className="h-3 w-3" />
                <span className="text-sm">Renkler</span>
              </div>
              <span className="text-sm font-medium">{totalColors}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <ImageIcon className="h-3 w-3" />
                <span className="text-sm">Resimler</span>
              </div>
              <span className="text-sm font-medium">{totalImages}</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Toplam içerik sayısı
          </p>
        </CardContent>
      </Card>

      {/* Top Performing Categories */}
      {!selectedBrand && categoryData.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>En Performanslı Kategoriler</span>
            </CardTitle>
            <CardDescription>
              Ürün sayısı ve ortalama fiyata göre öne çıkan kategoriler
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Top by Product Count */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Ürün Sayısına Göre</h4>
                {categoryData
                  .sort((a, b) => b.productCount - a.productCount)
                  .slice(0, 5)
                  .map((category, index) => (
                    <div
                      key={category.categoryId}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm font-medium">
                          {category.categoryName}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {category.brand}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Package className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {category.productCount}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Top by Average Price */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Ortalama Fiyata Göre</h4>
                {categoryData
                  .filter((cat) => cat.avgPrice > 0)
                  .sort((a, b) => (b.avgPrice || 0) - (a.avgPrice || 0))
                  .slice(0, 5)
                  .map((category, index) => (
                    <div
                      key={category.categoryId}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="text-sm font-medium">
                          {category.categoryName}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {category.brand}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-sm font-medium">
                          {formatPrice(category.avgPrice || 0)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
