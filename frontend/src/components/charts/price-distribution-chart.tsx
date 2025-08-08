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
import { PriceDistributionResponse } from '@/lib/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface PriceDistributionChartProps {
  data?: PriceDistributionResponse
  loading?: boolean
  error?: string
}

const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#ff00ff',
  '#00ffff',
  '#ff0000',
]

export function PriceDistributionChart({
  data,
  loading,
  error,
}: PriceDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Dağılımı</CardTitle>
          <CardDescription>
            Ürünlerin fiyat aralıklarına göre dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Dağılımı</CardTitle>
          <CardDescription>
            Ürünlerin fiyat aralıklarına göre dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Veri yüklenirken hata oluştu: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.distribution.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Dağılımı</CardTitle>
          <CardDescription>
            Ürünlerin fiyat aralıklarına göre dağılımı
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Veri bulunamadı
          </div>
        </CardContent>
      </Card>
    )
  }

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean
    payload?: Array<{
      payload: { count: number; percentage: number; min: number; max: number }
    }>
    label?: string
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-muted-foreground">
            Ürün Sayısı:{' '}
            <span className="font-medium text-foreground">{data.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Yüzde:{' '}
            <span className="font-medium text-foreground">
              {data.percentage.toFixed(1)}%
            </span>
          </p>
          <p className="text-sm text-muted-foreground">
            Aralık:{' '}
            <span className="font-medium text-foreground">
              {formatPrice(data.min)} - {formatPrice(data.max)}
            </span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fiyat Dağılımı</CardTitle>
        <CardDescription>
          Ürünlerin fiyat aralıklarına göre dağılımı
          {data.filters.brand && (
            <Badge variant="secondary" className="ml-2">
              {data.filters.brand}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Minimum</p>
            <p className="font-medium">{formatPrice(data.stats.min)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Maksimum</p>
            <p className="font-medium">{formatPrice(data.stats.max)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ortalama</p>
            <p className="font-medium">{formatPrice(data.stats.avg)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Medyan</p>
            <p className="font-medium">{formatPrice(data.stats.median)}</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data.distribution}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="range"
              className="text-xs"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {data.distribution.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 text-xs text-muted-foreground">
          Toplam {data.stats.total} ürün • Son güncelleme:{' '}
          {new Date(data.timestamp).toLocaleString('tr-TR')}
        </div>
      </CardContent>
    </Card>
  )
}
