'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'
import { Brand } from '@/lib/types'

interface CategoryFiltersProps {
  brands: Brand[]
  selectedBrand: string
  onBrandChange: (brand: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  showOnlyLeaf: boolean
  onShowOnlyLeafChange: (show: boolean) => void
  selectedLevel?: number
  onLevelChange: (level?: number) => void
}

export function CategoryFilters({
  brands,
  selectedBrand,
  onBrandChange,
  searchQuery,
  onSearchChange,
  showOnlyLeaf,
  onShowOnlyLeafChange,
  selectedLevel,
  onLevelChange,
}: CategoryFiltersProps) {
  const hasActiveFilters =
    selectedBrand || searchQuery || showOnlyLeaf || selectedLevel !== undefined

  const clearAllFilters = () => {
    onBrandChange('')
    onSearchChange('')
    onShowOnlyLeafChange(false)
    onLevelChange(undefined)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filtreler</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              Aktif
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Kategorileri filtrelemek ve aramak için kullanın
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand Filter */}
          <div className="space-y-2">
            <Label htmlFor="brand-filter">Marka</Label>
            <Select value={selectedBrand} onValueChange={onBrandChange}>
              <SelectTrigger id="brand-filter">
                <SelectValue placeholder="Marka seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm Markalar</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.name}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search-input">Kategori Ara</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-input"
                placeholder="Kategori adı ara..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-8"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                  onClick={() => onSearchChange('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Level Filter */}
          <div className="space-y-2">
            <Label htmlFor="level-filter">Seviye</Label>
            <Select
              value={selectedLevel?.toString() || ''}
              onValueChange={(value) =>
                onLevelChange(value ? parseInt(value) : undefined)
              }
            >
              <SelectTrigger id="level-filter">
                <SelectValue placeholder="Seviye seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tüm Seviyeler</SelectItem>
                <SelectItem value="0">Seviye 0 (Ana)</SelectItem>
                <SelectItem value="1">Seviye 1</SelectItem>
                <SelectItem value="2">Seviye 2</SelectItem>
                <SelectItem value="3">Seviye 3</SelectItem>
                <SelectItem value="4">Seviye 4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leaf Categories Only */}
          <div className="space-y-2">
            <Label>Kategori Türü</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="leaf-only"
                checked={showOnlyLeaf}
                onCheckedChange={onShowOnlyLeafChange}
              />
              <Label htmlFor="leaf-only" className="text-sm">
                Sadece yaprak kategoriler
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Alt kategorisi olmayan kategoriler
            </p>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="text-sm text-muted-foreground">
                Aktif filtreler:
              </span>

              {selectedBrand && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>Marka: {selectedBrand}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onBrandChange('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {searchQuery && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>Arama: &quot;{searchQuery}&quot;</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onSearchChange('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {selectedLevel !== undefined && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>Seviye: {selectedLevel}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onLevelChange(undefined)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}

              {showOnlyLeaf && (
                <Badge
                  variant="secondary"
                  className="flex items-center space-x-1"
                >
                  <span>Yaprak kategoriler</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => onShowOnlyLeafChange(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>

            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Tümünü Temizle
            </Button>
          </div>
        )}

        {/* Filter Summary */}
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>
              💡 İpucu: Hiyerarşik yapıyı görmek için kategorileri genişletin
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
