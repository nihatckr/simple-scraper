import { render, screen } from '@testing-library/react'
import { PriceDistributionChart } from '../price-distribution-chart'
import { PriceDistributionResponse } from '@/lib/types'

const mockData: PriceDistributionResponse = {
  distribution: [
    {
      range: '₺0-50',
      min: 0,
      max: 5000,
      count: 10,
      percentage: 25,
    },
    {
      range: '₺50-100',
      min: 5000,
      max: 10000,
      count: 15,
      percentage: 37.5,
    },
    {
      range: '₺100-200',
      min: 10000,
      max: 20000,
      count: 12,
      percentage: 30,
    },
    {
      range: '₺200+',
      min: 20000,
      max: 50000,
      count: 3,
      percentage: 7.5,
    },
  ],
  stats: {
    min: 1000,
    max: 45000,
    avg: 8500,
    median: 7500,
    total: 40,
  },
  filters: {
    brand: 'ZARA',
  },
  timestamp: '2025-01-01T00:00:00Z',
}

describe('PriceDistributionChart', () => {
  it('renders chart with data correctly', () => {
    render(<PriceDistributionChart data={mockData} />)

    expect(screen.getByText('Fiyat Dağılımı')).toBeInTheDocument()
    expect(
      screen.getByText('Ürünlerin fiyat aralıklarına göre dağılımı'),
    ).toBeInTheDocument()
    expect(screen.getByText('ZARA')).toBeInTheDocument()
    expect(screen.getByText('₺10.00')).toBeInTheDocument() // min price
    expect(screen.getByText('₺450.00')).toBeInTheDocument() // max price
    expect(screen.getByText('₺85.00')).toBeInTheDocument() // avg price
    expect(screen.getByText('₺75.00')).toBeInTheDocument() // median price
  })

  it('shows loading state', () => {
    render(<PriceDistributionChart loading={true} />)

    expect(screen.getByText('Fiyat Dağılımı')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(<PriceDistributionChart error="Test error" />)

    expect(screen.getByText('Fiyat Dağılımı')).toBeInTheDocument()
    expect(
      screen.getByText('Veri yüklenirken hata oluştu: Test error'),
    ).toBeInTheDocument()
  })

  it('shows no data state', () => {
    const emptyData: PriceDistributionResponse = {
      distribution: [],
      stats: {
        min: 0,
        max: 0,
        avg: 0,
        median: 0,
        total: 0,
      },
      filters: {},
      timestamp: '2025-01-01T00:00:00Z',
    }

    render(<PriceDistributionChart data={emptyData} />)

    expect(screen.getByText('Veri bulunamadı')).toBeInTheDocument()
  })
})
