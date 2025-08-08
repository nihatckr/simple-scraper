'use client'

import { useState } from 'react'
import { PriceDistributionChart } from '@/components/charts/price-distribution-chart'
import { PriceTrendsChart } from '@/components/charts/price-trends-chart'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PriceDistributionResponse, PriceTrendsResponse } from '@/lib/types'

// Mock data for demonstration
const mockPriceDistribution: PriceDistributionResponse = {
  distribution: [
    {
      range: '₺0-50',
      min: 0,
      max: 5000,
      count: 25,
      percentage: 20.8,
    },
    {
      range: '₺50-100',
      min: 5000,
      max: 10000,
      count: 35,
      percentage: 29.2,
    },
    {
      range: '₺100-200',
      min: 10000,
      max: 20000,
      count: 40,
      percentage: 33.3,
    },
    {
      range: '₺200-500',
      min: 20000,
      max: 50000,
      count: 15,
      percentage: 12.5,
    },
    {
      range: '₺500+',
      min: 50000,
      max: 100000,
      count: 5,
      percentage: 4.2,
    },
  ],
  stats: {
    min: 1500,
    max: 89900,
    avg: 12500,
    median: 9800,
    total: 120,
  },
  filters: {
    brand: 'ZARA',
  },
  timestamp: new Date().toISOString(),
}

const mockPriceTrends: PriceTrendsResponse = {
  trends: [
    { date: '2025-01-01', avgPrice: 11000, count: 45 },
    { date: '2025-01-02', avgPrice: 11500, count: 48 },
    { date: '2025-01-03', avgPrice: 12000, count: 52 },
    { date: '2025-01-04', avgPrice: 11800, count: 49 },
    { date: '2025-01-05', avgPrice: 12200, count: 55 },
    { date: '2025-01-06', avgPrice: 12800, count: 58 },
    { date: '2025-01-07', avgPrice: 12500, count: 53 },
  ],
  period: '7d',
  filters: {
    brand: 'ZARA',
  },
  timestamp: new Date().toISOString(),
}

export function PriceAnalyticsDemo() {
  const [showData, setShowData] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggleData = () => {
    if (!showData) {
      setLoading(true)
      // Simulate API loading
      setTimeout(() => {
        setLoading(false)
        setShowData(true)
      }, 1000)
    } else {
      setShowData(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fiyat Analitiği Demo</CardTitle>
          <CardDescription>
            Fiyat dağılımı ve trend grafiklerinin demo versiyonu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleToggleData}>
            {showData ? 'Veriyi Gizle' : 'Demo Veriyi Göster'}
          </Button>
        </CardContent>
      </Card>

      {(showData || loading) && (
        <div className="grid gap-6 lg:grid-cols-2">
          <PriceDistributionChart
            data={showData ? mockPriceDistribution : undefined}
            loading={loading}
          />

          <PriceTrendsChart
            data={showData ? mockPriceTrends : undefined}
            loading={loading}
          />
        </div>
      )}
    </div>
  )
}
