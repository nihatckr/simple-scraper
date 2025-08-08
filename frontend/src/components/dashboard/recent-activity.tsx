'use client'

import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Package, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Product } from '@/lib/types'
import { formatPrice } from '@/lib/api'

interface RecentActivityProps {
  activities?: Product[]
  loading?: boolean
}

function ActivitySkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="ml-4 space-y-1 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[150px]" />
          </div>
          <Skeleton className="h-4 w-[80px]" />
        </div>
      ))}
    </div>
  )
}

function ActivityItem({ product }: { product: Product }) {
  const brandInitials = product.brandName
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const timeAgo = formatDistanceToNow(new Date(product.updatedAt), {
    addSuffix: true,
    locale: tr,
  })

  const hasPrice = product.price && product.price > 0
  const colorCount = product._count?.colors || 0
  const imageCount = product._count?.images || 0

  return (
    <div className="flex items-center space-x-4 animate-slide-up">
      <Avatar className="h-9 w-9">
        <AvatarFallback className="text-xs font-medium">
          {brandInitials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 space-y-1">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium leading-none line-clamp-1">
            {product.name}
          </p>
          <Badge variant="outline" className="text-xs">
            {product.brandName}
          </Badge>
        </div>

        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
          {colorCount > 0 && (
            <>
              <span>•</span>
              <span>{colorCount} renk</span>
            </>
          )}
          {imageCount > 0 && (
            <>
              <span>•</span>
              <span>{imageCount} resim</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {hasPrice ? (
          <div className="text-right">
            <div className="text-sm font-medium">
              {formatPrice(product.price!)}
            </div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Güncellendi</span>
            </div>
          </div>
        ) : (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Fiyat yok</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <Package className="h-3 w-3 mr-1" />
              <span>Yeni</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function RecentActivity({ activities, loading }: RecentActivityProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
          <CardDescription>En son güncellenen ürünler</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivitySkeleton />
        </CardContent>
      </Card>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
          <CardDescription>En son güncellenen ürünler</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <div className="text-center">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Henüz aktivite yok</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>
              En son güncellenen {activities.length} ürün
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-xs">
            Canlı
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          {activities.map((product) => (
            <ActivityItem key={product.id} product={product} />
          ))}
        </div>

        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Toplam {activities.length} aktivite</span>
              <span>
                Son güncelleme:{' '}
                {formatDistanceToNow(new Date(), { locale: tr })}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
