'use client'

import { ResponsiveContainer } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ChartSkeleton } from '@/components/ui/loading-skeleton'

interface ChartContainerProps {
  title: string
  description?: string
  loading?: boolean
  error?: string
  children: React.ReactElement
  height?: number
  className?: string
}

export function ChartContainer({
  title,
  description,
  loading,
  error,
  children,
  height = 350,
  className,
}: ChartContainerProps) {
  if (loading) {
    return <ChartSkeleton />
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[350px] text-destructive">
            Hata: {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`animate-fade-in ${className}`}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function EmptyChart({
  message = 'Veri bulunamadı',
}: {
  message?: string
}) {
  return (
    <div className="flex items-center justify-center h-[350px] text-muted-foreground">
      {message}
    </div>
  )
}
