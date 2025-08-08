'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
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

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: 'Genel Bakış', href: '/dashboard', icon: BarChart3 },
    { name: 'Marka Analizi', href: '/dashboard/brands', icon: Building2 },
    {
      name: 'Kategori Analizi',
      href: '/dashboard/categories',
      icon: FolderTree,
    },
    { name: 'Ürün Analizi', href: '/dashboard/products', icon: Package },
    {
      name: 'Fiyat Trendleri',
      href: '/dashboard/analytics/price-trends',
      icon: LineChart,
    },
    {
      name: 'Stok Analizi',
      href: '/dashboard/analytics/stock-analysis',
      icon: Activity,
    },
    {
      name: 'Performans',
      href: '/dashboard/analytics/performance',
      icon: TrendingUp,
    },
    {
      name: 'Karşılaştırma',
      href: '/dashboard/analytics/comparison',
      icon: PieChart,
    },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <Link
            href="/dashboard"
            className="flex items-center"
            onClick={() => setOpen(false)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            <span className="font-bold">Analytics Dashboard</span>
          </Link>
        </div>
        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
