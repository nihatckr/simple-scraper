'use client'

import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts'
import { ChartContainer, EmptyChart } from './chart-container'

interface InteractiveBarChartProps {
  title: string
  description?: string
  data: Array<{
    name: string
    value: number
    [key: string]: any
  }>
  dataKey?: string
  nameKey?: string
  colors?: string[]
  loading?: boolean
  error?: string
  height?: number
  onBarClick?: (data: any) => void
  formatValue?: (value: number) => string
}

const DEFAULT_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00']

function CustomTooltip({ active, payload, label, formatValue }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {formatValue
              ? formatValue(entry.value)
              : entry.value.toLocaleString('tr-TR')}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function InteractiveBarChart({
  title,
  description,
  data,
  dataKey = 'value',
  nameKey = 'name',
  colors = DEFAULT_COLORS,
  loading,
  error,
  height = 350,
  onBarClick,
  formatValue,
}: InteractiveBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (!data || data.length === 0) {
    return (
      <ChartContainer
        title={title}
        description={description}
        loading={loading}
        error={error}
      >
        <EmptyChart />
      </ChartContainer>
    )
  }

  const handleBarClick = (data: any, index: number) => {
    setActiveIndex(index)
    onBarClick?.(data)
  }

  const handleBarHover = (index: number) => {
    setActiveIndex(index)
  }

  const handleBarLeave = () => {
    setActiveIndex(null)
  }

  return (
    <ChartContainer
      title={title}
      description={description}
      loading={loading}
      error={error}
      height={height}
    >
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis
          dataKey={nameKey}
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
        <Legend />

        <Bar
          dataKey={dataKey}
          radius={[4, 4, 0, 0]}
          cursor="pointer"
          onClick={handleBarClick}
          onMouseEnter={(_, index) => handleBarHover(index)}
          onMouseLeave={handleBarLeave}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              fillOpacity={
                activeIndex === null || activeIndex === index ? 1 : 0.6
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
