'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartSkeleton } from '@/components/ui/loading-skeleton'
import { formatPrice } from '@/lib/api'
import { useResponsiveChart } from '@/hooks/use-responsive-chart'

interface BrandComparisonChartProps {
  data?: Array<{
    brand: string
    productCount: number
    avgPrice: number
  }>
  loading?: boolean
}

const BRAND_COLORS = {
  ZARA: '#8884d8',
  'PULL&BEAR': '#82ca9d',
} as const

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.dataKey === 'productCount'
              ? `Ürün Sayısı: ${entry.value.toLocaleString('tr-TR')}`
              : `Ortalama Fiyat: ${formatPrice(entry.value)}`}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function BrandComparisonChart({
  data,
  loading,
}: BrandComparisonChartProps) {
  const { config, isMobile } = useResponsiveChart()
  if (loading || !data) {
    return <ChartSkeleton />
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marka Karşılaştırması</CardTitle>
          <CardDescription>
            Ürün sayısı ve ortalama fiyat karşılaştırması
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

  // Prepare data for dual-axis chart
  const chartData = data.map((item) => ({
    brand: item.brand,
    productCount: item.productCount,
    avgPrice: item.avgPrice,
  }))

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Marka Karşılaştırması</CardTitle>
        <CardDescription>
          Ürün sayısı ve ortalama fiyat karşılaştırması
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={config.height}>
          <BarChart data={chartData} margin={config.margin}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="brand"
              tick={{ fontSize: config.fontSize }}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: config.fontSize }}
              className="text-muted-foreground"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: config.fontSize }}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            {config.showLegend && <Legend />}

            <Bar
              yAxisId="left"
              dataKey="productCount"
              name="Ürün Sayısı"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    BRAND_COLORS[entry.brand as keyof typeof BRAND_COLORS] ||
                    '#8884d8'
                  }
                />
              ))}
            </Bar>

            <Bar
              yAxisId="right"
              dataKey="avgPrice"
              name="Ortalama Fiyat (kuruş)"
              radius={[4, 4, 0, 0]}
              opacity={0.7}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    BRAND_COLORS[entry.brand as keyof typeof BRAND_COLORS] ||
                    '#82ca9d'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          {data.map((brand) => (
            <div key={brand.brand} className="space-y-1">
              <div className="font-medium flex items-center">
                <div
                  className="w-3 h-3 rounded mr-2"
                  style={{
                    backgroundColor:
                      BRAND_COLORS[brand.brand as keyof typeof BRAND_COLORS] ||
                      '#8884d8',
                  }}
                />
                {brand.brand}
              </div>
              <div className="text-muted-foreground">
                {brand.productCount.toLocaleString('tr-TR')} ürün
              </div>
              <div className="text-muted-foreground">
                Ort. {formatPrice(brand.avgPrice)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
