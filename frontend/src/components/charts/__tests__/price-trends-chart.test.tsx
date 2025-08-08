import { render, screen } from '@testing-library/react'
import { PriceTrendsChart } from '../price-trends-chart'
import { PriceTrendsResponse } from '@/lib/types'

const mockData: PriceTrendsResponse = {
  trends: [
    {
      date: '2025-01-01',
      avgPrice: 8000,
      count: 10,
    },
    {
      date: '2025-01-02',
      avgPrice: 8500,
      count: 12,
    },
    {
      date: '2025-01-03',
      avgPrice: 9000,
      count: 15,
    },
    {
      date: '2025-01-04',
      avgPrice: 8800,
      count: 11,
    },
  ],
  period: '7d',
  filters: {
    brand: 'ZARA',
  },
  timestamp: '2025-01-01T00:00:00Z',
}

describe('PriceTrendsChart', () => {
  it('renders chart with data correctly', () => {
    render(<PriceTrendsChart data={mockData} />)

    expect(screen.getByText('Fiyat Trendleri')).toBeInTheDocument()
    expect(
      screen.getByText('Zaman içinde ortalama fiyat değişimleri (7d)'),
    ).toBeInTheDocument()
    expect(screen.getByText('ZARA')).toBeInTheDocument()

    // Check statistics
    expect(screen.getByText('Minimum')).toBeInTheDocument()
    expect(screen.getByText('Maksimum')).toBeInTheDocument()
    expect(screen.getByText('Ortalama')).toBeInTheDocument()
    expect(screen.getByText('Değişim')).toBeInTheDocument()
    expect(screen.getByText('Değişim %')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<PriceTrendsChart loading={true} />)

    expect(screen.getByText('Fiyat Trendleri')).toBeInTheDocument()
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('shows error state', () => {
    render(<PriceTrendsChart error="Test error" />)

    expect(screen.getByText('Fiyat Trendleri')).toBeInTheDocument()
    expect(
      screen.getByText('Veri yüklenirken hata oluştu: Test error'),
    ).toBeInTheDocument()
  })

  it('shows no data state', () => {
    const emptyData: PriceTrendsResponse = {
      trends: [],
      period: '7d',
      filters: {},
      timestamp: '2025-01-01T00:00:00Z',
    }

    render(<PriceTrendsChart data={emptyData} />)

    expect(screen.getByText('Veri bulunamadı')).toBeInTheDocument()
  })

  it('calculates price change correctly', () => {
    render(<PriceTrendsChart data={mockData} />)

    // First price: 8000, Last price: 8800, Change: +800 (10%)
    expect(screen.getByText('+₺8.00')).toBeInTheDocument() // Change in formatted price
    expect(screen.getByText('+10.0%')).toBeInTheDocument() // Percentage change
  })
})
