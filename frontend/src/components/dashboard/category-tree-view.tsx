'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Folder,
  FolderOpen,
  Package,
  TrendingUp,
} from 'lucide-react'
import { SubCategory } from '@/lib/types'
import { formatPrice } from '@/lib/api'

interface CategoryTreeViewProps {
  categories: SubCategory[]
  selectedBrand?: string
  searchQuery?: string
}

interface CategoryNodeProps {
  category: SubCategory
  level: number
  isExpanded: boolean
  onToggle: () => void
  searchQuery?: string
}

function CategoryNode({
  category,
  level,
  isExpanded,
  onToggle,
  searchQuery,
}: CategoryNodeProps) {
  const hasChildren =
    category.subcategories && category.subcategories.length > 0
  const isLeaf = category.isLeaf
  const productCount = category._count?.products || category.productCount || 0

  // Calculate average price if available
  const totalPrice = (category.products ?? []).reduce((sum, product) => {
    return sum + (product.price || 0)
  }, 0)
  const avgPrice = totalPrice / Math.max((category.products ?? []).length || 1, 1)

  // Highlight search matches
  const highlightText = (text: string, query?: string) => {
    if (!query) return text

    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    )
  }

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors ${
          level > 0 ? 'ml-' + level * 4 : ''
        }`}
        style={{ marginLeft: level * 16 }}
      >
        {hasChildren ? (
          <Collapsible open={isExpanded} onOpenChange={onToggle}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        ) : (
          <div className="w-6" />
        )}

        <div className="flex items-center space-x-2 flex-1">
          {isLeaf ? (
            <Package className="h-4 w-4 text-blue-500" />
          ) : hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-amber-500" />
            ) : (
              <Folder className="h-4 w-4 text-amber-500" />
            )
          ) : (
            <FolderTree className="h-4 w-4 text-gray-500" />
          )}

          <span className="font-medium text-sm">
            {highlightText(category.categoryName, searchQuery)}
          </span>

          <Badge variant="secondary" className="text-xs">
            {category.brand}
          </Badge>

          {category.gender && (
            <Badge variant="outline" className="text-xs">
              {category.gender}
            </Badge>
          )}

          <Badge variant="outline" className="text-xs">
            L{category.level}
          </Badge>

          {isLeaf && (
            <Badge variant="default" className="text-xs">
              Yaprak
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Package className="h-3 w-3" />
            <span>{productCount}</span>
          </div>

          {avgPrice > 0 && (
            <div className="flex items-center space-x-1">
              <TrendingUp className="h-3 w-3" />
              <span>{formatPrice(avgPrice)}</span>
            </div>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {category.subcategories?.map((subCategory) => (
            <CategoryNodeContainer
              key={subCategory.categoryId}
              category={subCategory}
              level={level + 1}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryNodeContainer({
  category,
  level,
  searchQuery,
}: {
  category: SubCategory
  level: number
  searchQuery?: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <CategoryNode
      category={category}
      level={level}
      isExpanded={isExpanded}
      onToggle={() => setIsExpanded(!isExpanded)}
      searchQuery={searchQuery}
    />
  )
}

export function CategoryTreeView({
  categories,
  selectedBrand,
  searchQuery,
}: CategoryTreeViewProps) {
  // Group categories by brand and level to create a proper hierarchy
  const groupedCategories = categories.reduce((acc, category) => {
    const brand = category.brand
    if (!acc[brand]) {
      acc[brand] = {}
    }

    const level = category.level
    if (!acc[brand][level]) {
      acc[brand][level] = []
    }

    acc[brand][level].push(category)
    return acc
  }, {} as Record<string, Record<number, SubCategory[]>>)

  // Build hierarchy for each brand
  const buildHierarchy = (brandCategories: Record<number, SubCategory[]>) => {
    const levels = Object.keys(brandCategories).map(Number).sort()
    const rootLevel = Math.min(...levels)
    const rootCategories = brandCategories[rootLevel] || []

    // For each root category, find and attach its children
    const attachChildren = (
      category: SubCategory,
      currentLevel: number,
    ): SubCategory => {
      const nextLevel = currentLevel + 1
      const nextLevelCategories = brandCategories[nextLevel] || []

      const children = nextLevelCategories.filter(
        (child) =>
          child.parentCategoryId === category.categoryId ||
          child.parentSubCategoryId === category.categoryId,
      )

      return {
        ...category,
        subcategories: children.map((child) =>
          attachChildren(child, nextLevel),
        ),
      }
    }

    return rootCategories.map((category) => attachChildren(category, rootLevel))
  }

  const hierarchicalCategories = Object.entries(groupedCategories).map(
    ([brand, brandCategories]) => ({
      brand,
      categories: buildHierarchy(brandCategories),
    }),
  )

  // Filter brands if selectedBrand is specified
  const filteredHierarchy = selectedBrand
    ? hierarchicalCategories.filter((item) => item.brand === selectedBrand)
    : hierarchicalCategories

  if (categories.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <FolderTree className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Kategori bulunamadı</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {filteredHierarchy.map(({ brand, categories: brandCategories }) => (
        <Card key={brand}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FolderTree className="h-5 w-5" />
              <span>{brand} Kategorileri</span>
              <Badge variant="outline">
                {brandCategories.length} ana kategori
              </Badge>
            </CardTitle>
            <CardDescription>
              Hiyerarşik kategori yapısı ve performans metrikleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brandCategories.map((category) => (
                <CategoryNodeContainer
                  key={category.categoryId}
                  category={category}
                  level={0}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
