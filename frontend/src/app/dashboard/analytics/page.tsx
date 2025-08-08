import { PriceAnalytics } from '@/components/dashboard/price-analytics'
import { PriceAnalyticsDemo } from '@/components/demo/price-analytics-demo'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fiyat Analitiği</h1>
        <p className="text-muted-foreground">
          Fiyat dağılımları, trendler ve pazar dinamiklerini analiz edin
        </p>
      </div>

      {/* Demo section for testing */}
      <PriceAnalyticsDemo />

      {/* Real implementation */}
      <PriceAnalytics />
    </div>
  )
}
