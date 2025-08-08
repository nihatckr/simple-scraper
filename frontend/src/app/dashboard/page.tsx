'use client'

import { useEffect } from 'react'
import { OverviewCards } from '@/components/dashboard/overview-cards'
import { BrandComparisonChart } from '@/components/dashboard/brand-comparison-chart'
import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { DashboardSkeleton } from '@/components/ui/loading-skeleton'
import { useApi } from '@/hooks/use-api'
import { statsApi } from '@/lib/api'
import { useDashboardStore } from '@/store/dashboard'

export default function DashboardPage() {
  const { setStats, setDashboardStats, setLoading, setError } =
    useDashboardStore()

  // Fetch overview stats
  const {
    data: stats,
    loading: statsLoading,
    error: statsError,
  } = useApi(() => statsApi.overview(), [])

  // Fetch dashboard stats
  const {
    data: dashboardStats,
    loading: dashboardLoading,
    error: dashboardError,
  } = useApi(() => statsApi.dashboard(), [])

  // Update store when data changes
  useEffect(() => {
    if (stats) setStats(stats)
  }, [stats])

  useEffect(() => {
    if (dashboardStats) setDashboardStats(dashboardStats)
  }, [dashboardStats])

  useEffect(() => {
    const nextLoading = statsLoading || dashboardLoading
    setLoading(nextLoading)
  }, [statsLoading, dashboardLoading])

  useEffect(() => {
    const nextError = statsError || dashboardError
    setError(nextError || undefined)
  }, [statsError, dashboardError])

  const loading = statsLoading || dashboardLoading
  const error = statsError || dashboardError

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            E-ticaret veri analizi genel bakış
          </p>
        </div>
        <ErrorBoundary>
          <div className="text-center py-12">
            <p className="text-destructive">
              Veri yüklenirken bir hata oluştu: {error}
            </p>
          </div>
        </ErrorBoundary>
      </div>
    )
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            E-ticaret veri analizi genel bakış
          </p>
        </div>

        {/* Overview Cards */}
        <OverviewCards stats={stats} loading={loading} />

        {/* Charts and Activity */}
        <div className="grid gap-6 md:grid-cols-2">
          <BrandComparisonChart
            data={dashboardStats?.brandStats}
            loading={loading}
          />
          <ActivityFeed initialData={dashboardStats?.recentActivity} />
        </div>

        {/* Additional Stats */}
        {dashboardStats && (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ürün İstatistikleri</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Fiyatlı ürünler:{' '}
                  {dashboardStats.overview.productsWithPrice.toLocaleString(
                    'tr-TR',
                  )}
                </p>
                <p>
                  Stokta ürünler:{' '}
                  {dashboardStats.overview.productsInStock.toLocaleString(
                    'tr-TR',
                  )}
                </p>
                <p>
                  Ortalama fiyat: ₺
                  {(dashboardStats.overview.avgPrice / 100).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Aktivite</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>
                  Fiyat değişiklikleri:{' '}
                  {dashboardStats.overview.priceChanges.toLocaleString('tr-TR')}
                </p>
                <p>
                  Stok değişiklikleri:{' '}
                  {dashboardStats.overview.stockChanges.toLocaleString('tr-TR')}
                </p>
                <p>Periyot: {dashboardStats.period}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Kategori Dağılımı</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                {dashboardStats.categoryStats.map((stat) => (
                  <p key={stat.brand}>
                    {stat.brand}: {stat.categoryCount} kategori
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
