'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building2,
  FolderTree,
  Package,
  TrendingUp,
  PieChart,
  LineChart,
  Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface SidebarNavItemProps {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  isActive?: boolean
}

function SidebarNavItem({
  href,
  icon: Icon,
  children,
  isActive,
}: SidebarNavItemProps) {
  return (
    <Link href={href}>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'w-full justify-start',
          isActive && 'bg-muted font-medium',
        )}
      >
        <Icon className="mr-2 h-4 w-4" />
        {children}
      </Button>
    </Link>
  )
}

export function DashboardSidebar() {
  const pathname = usePathname()

  const mainNavigation = [
    {
      name: 'Genel Bakış',
      href: '/dashboard',
      icon: BarChart3,
      isActive: pathname === '/dashboard',
    },
    {
      name: 'Marka Analizi',
      href: '/dashboard/brands',
      icon: Building2,
      isActive: pathname.startsWith('/dashboard/brands'),
    },
    {
      name: 'Kategori Analizi',
      href: '/dashboard/categories',
      icon: FolderTree,
      isActive: pathname.startsWith('/dashboard/categories'),
    },
    {
      name: 'Ürün Analizi',
      href: '/dashboard/products',
      icon: Package,
      isActive: pathname.startsWith('/dashboard/products'),
    },
  ]

  const analyticsNavigation = [
    {
      name: 'Fiyat Analitiği',
      href: '/dashboard/analytics',
      icon: LineChart,
      isActive: pathname === '/dashboard/analytics',
    },
    {
      name: 'Stok Analizi',
      href: '/dashboard/analytics/stock-analysis',
      icon: Activity,
      isActive: pathname === '/dashboard/analytics/stock-analysis',
    },
    {
      name: 'Performans',
      href: '/dashboard/analytics/performance',
      icon: TrendingUp,
      isActive: pathname === '/dashboard/analytics/performance',
    },
    {
      name: 'Karşılaştırma',
      href: '/dashboard/analytics/comparison',
      icon: PieChart,
      isActive: pathname === '/dashboard/analytics/comparison',
    },
  ]

  return (
    <div className="hidden md:block pb-12 w-64 border-r bg-muted/10">
      <div className="space-y-4 py-4">
        {/* Main Navigation */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            {mainNavigation.map((item) => (
              <SidebarNavItem
                key={item.name}
                href={item.href}
                icon={item.icon}
                isActive={item.isActive}
              >
                {item.name}
              </SidebarNavItem>
            ))}
          </div>
        </div>

        <Separator />

        {/* Analytics Navigation */}
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Gelişmiş Analizler
          </h2>
          <div className="space-y-1">
            {analyticsNavigation.map((item) => (
              <SidebarNavItem
                key={item.name}
                href={item.href}
                icon={item.icon}
                isActive={item.isActive}
              >
                {item.name}
              </SidebarNavItem>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
