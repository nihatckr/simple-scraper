'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Search, Settings, User } from 'lucide-react'
import { MobileNav } from './mobile-nav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { usePreferencesStore } from '@/store/preferences'

export function DashboardHeader() {
  const pathname = usePathname()
  const { theme, setTheme } = usePreferencesStore()

  const navigation = [
    {
      name: 'Genel Bakış',
      href: '/dashboard',
      current: pathname === '/dashboard',
    },
    {
      name: 'Markalar',
      href: '/dashboard/brands',
      current: pathname.startsWith('/dashboard/brands'),
    },
    {
      name: 'Kategoriler',
      href: '/dashboard/categories',
      current: pathname.startsWith('/dashboard/categories'),
    },
    {
      name: 'Ürünler',
      href: '/dashboard/products',
      current: pathname.startsWith('/dashboard/products'),
    },
    {
      name: 'Analizler',
      href: '/dashboard/analytics',
      current: pathname.startsWith('/dashboard/analytics'),
    },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile nav */}
        <div className="mr-4 flex md:hidden">
          <MobileNav />
        </div>

        {/* Logo */}
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <BarChart3 className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Analytics Dashboard
            </span>
          </Link>
        </div>

        {/* Navigation - Hidden on mobile */}
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`transition-colors hover:text-foreground/80 ${
                item.current ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Search */}
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ürün ara..."
                className="w-full md:w-[300px] lg:w-[400px] pl-8"
              />
            </div>
          </div>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>DA</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    Data Analyst
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    analyst@company.com
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Tema: {theme === 'dark' ? 'Açık' : 'Koyu'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
