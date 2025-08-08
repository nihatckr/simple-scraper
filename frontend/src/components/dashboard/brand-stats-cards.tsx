import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPrice } from '@/lib/api'
import { Building2, Package, DollarSign, FolderTree } from 'lucide-react'

interface BrandStatsCardsProps {
  brandName: string
  stats: {
    totalProducts: number
    productsWithPrice: number
    avgPrice: number
    minPrice: number
    maxPrice: number
    totalCategories: number
    leafCategories: number
    priceHistory: number
    stockHistory: number
  }
}

export function BrandStatsCards({ brandName, stats }: BrandStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Ürün</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalProducts.toLocaleString('tr-TR')}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.productsWithPrice.toLocaleString('tr-TR')} ürünün fiyatı
            mevcut
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ortalama Fiyat</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.avgPrice > 0 ? formatPrice(stats.avgPrice) : '-'}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.minPrice > 0 && stats.maxPrice > 0
              ? `${formatPrice(stats.minPrice)} - ${formatPrice(
                  stats.maxPrice,
                )}`
              : 'Fiyat aralığı mevcut değil'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Toplam Kategori</CardTitle>
          <FolderTree className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalCategories.toLocaleString('tr-TR')}
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.leafCategories.toLocaleString('tr-TR')} yaprak kategori
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Marka</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{brandName}</div>
          <p className="text-xs text-muted-foreground">Analiz edilen marka</p>
        </CardContent>
      </Card>
    </div>
  )
}
