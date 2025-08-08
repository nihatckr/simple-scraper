'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatPrice } from '@/lib/api'
import { PriceTrendsResponse } from '@/lib/types'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface PriceTrendsChartProps {
  data?: PriceTrendsResponse
  loading?: boolean
  error?: string
}

export function PriceTrendsChart({
  data,
  loading,
  error,
}: PriceTrendsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Trendleri</CardTitle>
          <CardDescription>
            Zaman içinde ortalama fiyat değişimleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Trendleri</CardTitle>
          <CardDescription>
            Zaman içinde ortalama fiyat değişimleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Veri yüklenirken hata oluştu: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.trends.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Trendleri</CardTitle>
          <CardDescription>
            Zaman içinde ortalama fiyat değişimleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            Veri bulunamadı
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate trend statistics
  const prices = data.trends.map((t) => t.avgPrice)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length
  const firstPrice = prices[0]
  const lastPrice = prices[prices.length - 1]
  const priceChange = lastPrice - firstPrice
  const priceChangePercent = (priceChange / firstPrice) * 100

  // Format data for chart
  const chartData = data.trends.map((trend) => ({
    ...trend,
    date: new Date(trend.date).toLocaleDateString('tr-TR', {
      month: 'short',
      day: 'numeric',
    }),
    formattedPrice: formatPrice(trend.avgPrice),
  }))

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{
      payload: { avgPrice: number; count: number; formattedPrice: string }
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Ortalama Fiyat:{' '}
            <span className="font-medium text-foreground">
              {data.formattedPrice}
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Ürün Sayısı:{' '}
            <span className="font-medium text-foreground">{data.count}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fiyat Trendleri</CardTitle>
        <CardDescription>
          Zaman içinde ortalama fiyat değişimleri ({data.period})
          {data.filters.brand && (
            <Badge variant="secondary" className="ml-2">
              {data.filters.brand}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Minimum</p>
            <p className="font-medium">{formatPrice(minPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Maksimum</p>
            <p className="font-medium">{formatPrice(maxPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ortalama</p>
            <p className="font-medium">{formatPrice(avgPrice)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Değişim</p>
            <p
              className={`font-medium ${
                priceChange >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {priceChange >= 0 ? '+' : ''}
              {formatPrice(priceChange)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Değişim %</p>
            <p
              className={`font-medium ${
                priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {priceChangePercent >= 0 ? '+' : ''}
              {priceChangePercent.toFixed(1)}%
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
            <YAxis
              className="text-xs"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `₺${(value / 100).toFixed(0)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={avgPrice}
              stroke="#8884d8"
              strokeDasharray="5 5"
              label={{ value: 'Ortalama', position: 'top' }}
            />
            <Line
              type="monotone"
              dataKey="avgPrice"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8884d8', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-muted-foreground">
          Son güncelleme: {new Date(data.timestamp).toLocaleString('tr-TR')}
        </div>
      </CardContent>
    </Card>
  )
}
