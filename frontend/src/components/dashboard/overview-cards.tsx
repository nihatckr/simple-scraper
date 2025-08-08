'use client'

import { Building2, FolderTree, Package, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsResponse } from '@/lib/types'
import { OverviewCardSkeleton } from '@/components/ui/loading-skeleton'

interface OverviewCardsProps {
  stats?: StatsResponse | null
  loading?: boolean
}

interface StatCardProps {
  title: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toLocaleString('tr-TR')}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {trend && (
          <div
            className={`text-xs mt-1 ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.isPositive ? '+' : ''}
            {trend.value}% önceki döneme göre
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OverviewCards({ stats, loading }: OverviewCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <OverviewCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: 'Toplam Marka',
      value: stats.brands,
      description: 'Aktif markalar',
      icon: Building2,
    },
    {
      title: 'Ana Kategoriler',
      value: stats.mainCategories,
      description: 'Erkek/Kadın kategorileri',
      icon: FolderTree,
    },
    {
      title: 'Alt Kategoriler',
      value: stats.subCategories,
      description: `${stats.leafCategories} yaprak kategori`,
      icon: Activity,
    },
    {
      title: 'Toplam Ürün',
      value: stats.products,
      description: 'Tüm markalardan',
      icon: Package,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <StatCard
          key={card.title}
          title={card.title}
          value={card.value}
          description={card.description}
          icon={card.icon}
        />
      ))}
    </div>
  )
}
