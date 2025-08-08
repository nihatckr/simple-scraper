'use client'

import { useState, useEffect } from 'react'

interface UseResponsiveChartOptions {
  breakpoints?: {
    mobile: number
    tablet: number
    desktop: number
  }
}

export function useResponsiveChart(options: UseResponsiveChartOptions = {}) {
  const { breakpoints = { mobile: 640, tablet: 768, desktop: 1024 } } = options

  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>(
    'desktop',
  )
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth

      const nextScreenSize: 'mobile' | 'tablet' | 'desktop' =
        width < breakpoints.mobile
          ? 'mobile'
          : width < breakpoints.tablet
          ? 'tablet'
          : 'desktop'

      const nextDimensions =
        nextScreenSize === 'mobile'
          ? { width: width - 40, height: 250 }
          : nextScreenSize === 'tablet'
          ? { width: width - 60, height: 300 }
          : { width: width - 80, height: 350 }

      setScreenSize((prev) => (prev !== nextScreenSize ? nextScreenSize : prev))
      setDimensions((prev) =>
        prev.width !== nextDimensions.width || prev.height !== nextDimensions.height
          ? nextDimensions
          : prev,
      )
    }

    // Initial call
    handleResize()

    // Add event listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoints.mobile, breakpoints.tablet, breakpoints.desktop])

  const getChartConfig = () => {
    switch (screenSize) {
      case 'mobile':
        return {
          height: 250,
          margin: { top: 10, right: 10, left: 10, bottom: 5 },
          fontSize: 10,
          showLegend: false,
          tickCount: 3,
        }
      case 'tablet':
        return {
          height: 300,
          margin: { top: 15, right: 20, left: 15, bottom: 5 },
          fontSize: 11,
          showLegend: true,
          tickCount: 5,
        }
      default:
        return {
          height: 350,
          margin: { top: 20, right: 30, left: 20, bottom: 5 },
          fontSize: 12,
          showLegend: true,
          tickCount: 7,
        }
    }
  }

  return {
    screenSize,
    dimensions,
    config: getChartConfig(),
    isMobile: screenSize === 'mobile',
    isTablet: screenSize === 'tablet',
    isDesktop: screenSize === 'desktop',
  }
}
