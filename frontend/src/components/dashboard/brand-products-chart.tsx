import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

interface BrandProductsChartProps {
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
  period: string
}

export function BrandProductsChart({
  brandName,
  stats,
  period,
}: BrandProductsChartProps) {
  // Prepare data for price range visualization
  const priceRangeData = [
    {
      name: 'Min Fiyat',
      value: stats.minPrice / 100,
      color: '#8884d8',
    },
    {
      name: 'Ortalama Fiyat',
      value: stats.avgPrice / 100,
      color: '#82ca9d',
    },
    {
      name: 'Max Fiyat',
      value: stats.maxPrice / 100,
      color: '#ffc658',
    },
  ].filter((item) => item.value > 0)

  // Prepare data for product distribution
  const productDistributionData = [
    {
      name: 'Fiyatlı Ürünler',
      value: stats.productsWithPrice,
      color: '#8884d8',
    },
    {
      name: 'Fiyatsız Ürünler',
      value: stats.totalProducts - stats.productsWithPrice,
      color: '#82ca9d',
    },
  ].filter((item) => item.value > 0)

  // Prepare data for category distribution
  const categoryData = [
    {
      name: 'Toplam Kategori',
      value: stats.totalCategories,
      color: '#8884d8',
    },
    {
      name: 'Yaprak Kategori',
      value: stats.leafCategories,
      color: '#82ca9d',
    },
  ]

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marka Performans Analizi</CardTitle>
        <CardDescription>
          {brandName} markası için {getPeriodLabel(period)} performans
          metrikleri
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* Price Range Chart */}
          {priceRangeData.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-4">
                Fiyat Aralığı Analizi
              </h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priceRangeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₺${value}`} />
                  <Tooltip
                    formatter={(value: number) => [
                      `₺${value.toFixed(2)}`,
                      'Fiyat',
                    ]}
                    labelStyle={{ color: '#000' }}
                  />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Product Distribution */}
          {productDistributionData.length > 1 && (
            <div>
              <h4 className="text-sm font-medium mb-4">Ürün Dağılımı</h4>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={productDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) =>
                        `${name}: ${value?.toLocaleString('tr-TR')} (${(
                          (percent || 0) * 100
                        ).toFixed(1)}%)`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {productDistributionData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        value.toLocaleString('tr-TR'),
                        'Ürün Sayısı',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Category Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-4">Kategori Dağılımı</h4>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value: number) => [
                    value.toLocaleString('tr-TR'),
                    'Kategori Sayısı',
                  ]}
                  labelStyle={{ color: '#000' }}
                />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
