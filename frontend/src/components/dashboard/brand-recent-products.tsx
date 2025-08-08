import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatPrice, formatDateTime } from '@/lib/api'
import { Product } from '@/lib/types'
import { Package, Clock, Image as ImageIcon } from 'lucide-react'

interface BrandRecentProductsProps {
  products: Product[]
  brandName: string
}

export function BrandRecentProducts({
  products,
  brandName,
}: BrandRecentProductsProps) {
  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Son Güncellenen Ürünler</CardTitle>
          <CardDescription>
            {brandName} markasının son güncellenen ürünleri
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Henüz güncellenmiş ürün bulunmuyor
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Son Güncellenen Ürünler</CardTitle>
        <CardDescription>
          {brandName} markasının son güncellenen {products.length} ürünü
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center space-x-3 p-3 rounded-lg border"
            >
              <Avatar className="h-12 w-12">
                {product.images && product.images.length > 0 ? (
                  <AvatarImage
                    src={product.images[0].url}
                    alt={product.name}
                    className="object-cover"
                  />
                ) : (
                  <AvatarFallback>
                    <ImageIcon className="h-6 w-6" />
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium leading-none line-clamp-1">
                    {product.name}
                  </p>
                  <div className="flex items-center space-x-2">
                    {product.price && (
                      <Badge variant="secondary">
                        {formatPrice(product.price)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Package className="h-3 w-3" />
                    <span>ID: {product.productId}</span>
                  </div>

                  {product._count && (
                    <>
                      <div className="flex items-center space-x-1">
                        <span>{product._count.colors} renk</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span>{product._count.sizes} beden</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ImageIcon className="h-3 w-3" />
                        <span>{product._count.images}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Güncelleme: {formatDateTime(product.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              Bu periyotta güncellenmiş ürün bulunmuyor
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
