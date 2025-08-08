import express from 'express'
import prisma from '../lib/prisma'
import { getCache } from '../lib/redis-cache'
import { hashPassword, comparePassword, signToken, authMiddleware } from '../lib/auth'
import { metrics } from '../lib/metrics'
import { performHealthCheck } from '../lib/health'

const router = express.Router()
// Prisma client için geçici genişletme (linter uyumluluğu)
const db: any = prisma as any

// Health endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await performHealthCheck()
    res.status(health.status === 'healthy' ? 200 : 503).json(health)
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' })
  }
})

// ==================== AUTH ====================

router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already in use' })
    const passwordHash = await hashPassword(password)
    const user = await db.user.create({ data: { email, passwordHash, name } })
    const token = signToken({ sub: user.id, email: user.email, role: 'user' })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: 'user' } })
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' })
  }
})

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = signToken({ sub: user.id, email: user.email, role: user.role })
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (error) {
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/auth/profile', authMiddleware(), async (req: any, res) => {
  const user = await db.user.findUnique({ where: { id: req.user.sub }, select: { id: true, email: true, name: true, role: true, createdAt: true } })
  res.json({ user })
})

router.put('/auth/profile', authMiddleware(), async (req: any, res) => {
  const { name } = req.body
  const user = await db.user.update({ where: { id: req.user.sub }, data: { name } })
  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } })
})

// ==================== MONITORING & CACHE ====================

// API performans metrikleri
router.get('/monitoring/performance', async (req, res) => {
  try {
    const snapshot = metrics.getSnapshot()
    res.json(snapshot)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get performance metrics' })
  }
})

// Cache istatistikleri
router.get('/monitoring/cache-stats', async (req, res) => {
  try {
    const cache = await getCache()
    const stats = await cache.getStats()
    res.json({ ...stats, timestamp: new Date() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cache stats' })
  }
})

// Cache temizleme
router.post('/monitoring/cache-flush', async (req, res) => {
  try {
    const cache = await getCache()
    await cache.flush()
    res.json({ message: 'Cache flushed', timestamp: new Date() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to flush cache' })
  }
})

// ==================== GENEL İSTATİSTİKLER ====================

// Genel istatistikler
router.get('/stats/overview', async (req, res) => {
  try {
    const [brands, mainCategories, subCategories, products, leafCategories] = await Promise.all([
      prisma.brand.count(),
      prisma.mainCategory.count(),
      prisma.subCategory.count(),
      prisma.product.count(),
      prisma.subCategory.count({ where: { isLeaf: true } })
    ])

    res.json({
      brands,
      mainCategories,
      subCategories,
      leafCategories,
      products,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

// Dashboard için gelişmiş istatistikler
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { period = '7d' } = req.query
    
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalProducts,
      productsWithPrice,
      productsInStock,
      avgPrice,
      priceChanges,
      stockChanges,
      brandStats,
      categoryStats,
      recentActivity
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { price: { not: null } } }),
      prisma.productStock.count({ where: { availability: 'in_stock' } }),
      prisma.product.aggregate({
        where: { price: { not: null } },
        _avg: { price: true }
      }),
      prisma.priceHistory.count({
        where: { timestamp: { gte: startDate } }
      }),
      prisma.stockHistory.count({
        where: { timestamp: { gte: startDate } }
      }),
      prisma.product.groupBy({
        by: ['brandName'],
        _count: { id: true },
        _avg: { price: true }
      }),
      prisma.subCategory.groupBy({
        by: ['brand'],
        _count: { categoryId: true },
        where: { isLeaf: true }
      }),
      prisma.product.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        include: {
          brand: true
        }
      })
    ])

    res.json({
      overview: {
        totalProducts,
        productsWithPrice,
        productsInStock,
        avgPrice: avgPrice._avg.price || 0,
        priceChanges,
        stockChanges
      },
      brandStats: brandStats.map(b => ({
        brand: b.brandName,
        productCount: b._count.id,
        avgPrice: b._avg.price || 0
      })),
      categoryStats: categoryStats.map(c => ({
        brand: c.brand,
        categoryCount: c._count.categoryId
      })),
      recentActivity,
      period,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get dashboard stats' })
  }
})

// ==================== MARKA İSTATİSTİKLERİ ====================

// Markalar listesi
router.get('/brands', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: {
        mainCategories: {
          include: {
            subcategories: {
              where: { level: { lte: 2 } },
              include: {
                subcategories: true
              }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      }
    })
    res.json(brands)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get brands' })
  }
})

// Marka detay istatistikleri
router.get('/brands/:brandName/stats', async (req, res) => {
  try {
    const { brandName } = req.params
    const { period = '30d' } = req.query
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalProducts,
      productsWithPrice,
      avgPrice,
      minPrice,
      maxPrice,
      totalCategories,
      leafCategories,
      priceHistory,
      stockHistory,
      recentProducts
    ] = await Promise.all([
      prisma.product.count({ where: { brandName } }),
      prisma.product.count({ where: { brandName, price: { not: null } } }),
      prisma.product.aggregate({
        where: { brandName, price: { not: null } },
        _avg: { price: true }
      }),
      prisma.product.aggregate({
        where: { brandName, price: { not: null } },
        _min: { price: true }
      }),
      prisma.product.aggregate({
        where: { brandName, price: { not: null } },
        _max: { price: true }
      }),
      prisma.subCategory.count({ where: { brand: brandName } }),
      prisma.subCategory.count({ where: { brand: brandName, isLeaf: true } }),
      prisma.priceHistory.count({
        where: { 
          product: { brandName },
          timestamp: { gte: startDate }
        }
      }),
      prisma.stockHistory.count({
        where: { 
          product: { brandName },
          timestamp: { gte: startDate }
        }
      }),
      prisma.product.findMany({
        where: { brandName },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { colors: true, images: true } }
        }
      })
    ])

    res.json({
      brandName,
      stats: {
        totalProducts,
        productsWithPrice,
        avgPrice: avgPrice._avg.price || 0,
        minPrice: minPrice._min.price || 0,
        maxPrice: maxPrice._max.price || 0,
        totalCategories,
        leafCategories,
        priceHistory,
        stockHistory
      },
      recentProducts,
      period,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get brand stats' })
  }
})

// Markalar arası karşılaştırma
router.get('/analytics/brand-comparison', async (req, res) => {
  try {
    const { metric = 'price', period = '30d' } = req.query
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    let comparisonData

    if (metric === 'price') {
      comparisonData = await prisma.product.groupBy({
        by: ['brandName'],
        where: { 
          price: { not: null },
          updatedAt: { gte: startDate }
        },
        _count: { id: true },
        _avg: { price: true },
        _min: { price: true },
        _max: { price: true }
      })
    } else if (metric === 'products') {
      comparisonData = await prisma.product.groupBy({
        by: ['brandName'],
        _count: { id: true }
      })
    } else if (metric === 'categories') {
      comparisonData = await prisma.subCategory.groupBy({
        by: ['brand'],
        where: { isLeaf: true },
        _count: { categoryId: true }
      })
    }

    res.json({
      metric,
      period,
      data: comparisonData,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get brand comparison' })
  }
})

// ==================== KATEGORİ İSTATİSTİKLERİ ====================

// Kategoriler (filtrelenebilir)
router.get('/categories', async (req, res) => {
  try {
    const { brand, leaf, level } = req.query
    
    const where: any = {}
    if (brand) where.brand = brand
    if (leaf === 'true') where.isLeaf = true
    if (level) where.level = parseInt(level as string)

    const categories = await prisma.subCategory.findMany({
      where,
      include: {
        _count: { select: { products: true } }
      },
      orderBy: [
        { level: 'asc' },
        { categoryName: 'asc' }
      ]
    })
    
    res.json(categories)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get categories' })
  }
})

// Belirli kategorinin çocukları
router.get('/categories/:categoryId/children', async (req, res) => {
  try {
    const { categoryId } = req.params
    const id = parseInt(categoryId)
    const children = await prisma.subCategory.findMany({
      where: { parentSubCategoryId: id },
      include: { _count: { select: { products: true } } },
      orderBy: [{ level: 'asc' }, { categoryName: 'asc' }]
    })
    res.json({ categoryId: id, children, timestamp: new Date() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get child categories' })
  }
})

// Kategori breadcrumb (ebeveyn zinciri)
router.get('/categories/:categoryId/breadcrumbs', async (req, res) => {
  try {
    const { categoryId } = req.params
    let current = await prisma.subCategory.findUnique({ where: { categoryId: parseInt(categoryId) } })
    if (!current) return res.status(404).json({ error: 'Category not found' })

    const chain: Array<{ categoryId: number; categoryName: string; level: number; brand: string }> = []
    while (current) {
      chain.push({ categoryId: current.categoryId, categoryName: current.categoryName, level: current.level, brand: current.brand })
      if (!current.parentSubCategoryId) break
      current = await prisma.subCategory.findUnique({ where: { categoryId: current.parentSubCategoryId } })
    }
    chain.reverse()
    res.json({ breadcrumbs: chain, timestamp: new Date() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get breadcrumbs' })
  }
})

// Marka bazlı tam kategori ağacı
router.get('/categories/tree', async (req, res) => {
  try {
    const { brand } = req.query
    const where: any = {}
    if (brand) where.brand = brand

    const categories = await prisma.subCategory.findMany({
      where,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: [{ level: 'asc' }, { categoryName: 'asc' }]
    })

    const byId = new Map<number, any>()
    const roots: any[] = []
    for (const c of categories) {
      byId.set(c.categoryId, { ...c, children: [] as any[] })
    }
    for (const c of categories) {
      const node = byId.get(c.categoryId)
      if (c.parentSubCategoryId && byId.has(c.parentSubCategoryId)) {
        byId.get(c.parentSubCategoryId).children.push(node)
      } else {
        roots.push(node)
      }
    }

    res.json({ tree: roots, count: categories.length, filters: { brand }, timestamp: new Date() })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category tree' })
  }
})

// Kategori detay istatistikleri
router.get('/categories/:categoryId/stats', async (req, res) => {
  try {
    const { categoryId } = req.params
    const { period = '30d' } = req.query
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const category = await prisma.subCategory.findUnique({
      where: { categoryId: parseInt(categoryId) },
      include: {
        _count: { select: { products: true } },
        products: {
          select: {
            price: true,
            _count: { select: { colors: true, images: true } }
          }
        }
      }
    })

    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    }

    const [
      avgPrice,
      minPrice,
      maxPrice,
      productsWithPrice,
      productsInStock,
      priceHistory,
      stockHistory
    ] = await Promise.all([
      prisma.product.aggregate({
        where: { 
          subCategories: { some: { categoryId: parseInt(categoryId) } },
          price: { not: null }
        },
        _avg: { price: true }
      }),
      prisma.product.aggregate({
        where: { 
          subCategories: { some: { categoryId: parseInt(categoryId) } },
          price: { not: null }
        },
        _min: { price: true }
      }),
      prisma.product.aggregate({
        where: { 
          subCategories: { some: { categoryId: parseInt(categoryId) } },
          price: { not: null }
        },
        _max: { price: true }
      }),
      prisma.product.count({
        where: { 
          subCategories: { some: { categoryId: parseInt(categoryId) } },
          price: { not: null }
        }
      }),
      prisma.productStock.count({
        where: { 
          product: { subCategories: { some: { categoryId: parseInt(categoryId) } } },
          availability: 'in_stock'
        }
      }),
      prisma.priceHistory.count({
        where: { 
          product: { subCategories: { some: { categoryId: parseInt(categoryId) } } },
          timestamp: { gte: startDate }
        }
      }),
      prisma.stockHistory.count({
        where: { 
          product: { subCategories: { some: { categoryId: parseInt(categoryId) } } },
          timestamp: { gte: startDate }
        }
      })
    ])

    res.json({
      category,
      stats: {
        avgPrice: avgPrice._avg.price || 0,
        minPrice: minPrice._min.price || 0,
        maxPrice: maxPrice._max.price || 0,
        productsWithPrice,
        productsInStock,
        priceHistory,
        stockHistory
      },
      period,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category stats' })
  }
})

// Kategori performans analizi
router.get('/analytics/category-performance', async (req, res) => {
  try {
    const { brand, limit = '10' } = req.query

    const where: any = { isLeaf: true }
    if (brand) where.brand = brand

    const categories = await prisma.subCategory.findMany({
      where,
      include: {
        _count: { select: { products: true } },
        products: {
          select: {
            price: true,
            _count: { select: { colors: true, images: true } }
          }
        }
      },
      orderBy: { productCount: 'desc' },
      take: parseInt(limit as string)
    })

    const performance = categories.map((category: any) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      brand: category.brand,
      productCount: category._count.products,
      avgPrice: (category.products && category.products.length > 0)
        ? category.products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / category.products.length
        : 0,
      totalColors: (category.products || []).reduce((sum: number, p: any) => sum + (p._count?.colors || 0), 0),
      totalImages: (category.products || []).reduce((sum: number, p: any) => sum + (p._count?.images || 0), 0)
    }))

    res.json({
      performance,
      filters: { brand, limit },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category performance' })
  }
})

// ==================== ÜRÜN İSTATİSTİKLERİ ====================

// Ürünler listesi (filtrelenebilir ve sayfalanabilir)
router.get('/products', async (req, res) => {
  try {
    const { 
      brand, 
      categoryId, 
      page = '1', 
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const where: any = {}
    if (brand) where.brandName = brand
    if (categoryId) {
      where.subCategories = {
        some: { categoryId: parseInt(categoryId as string) }
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          colors: { take: 3 },
          images: { take: 1, orderBy: { order: 'asc' } },
          _count: {
            select: { 
              colors: true, 
              images: true, 
              sizes: true 
            }
          }
        },
        skip,
        take,
        orderBy: { [sortBy as string]: sortOrder }
      }),
      prisma.product.count({ where })
    ])

    res.json({
      products,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get products' })
  }
})

// Tek ürün detayı
router.get('/products/:productId', async (req, res) => {
  try {
    const { productId } = req.params

    const product = await prisma.product.findUnique({
      where: { productId: parseInt(productId) },
      include: {
        brand: true,
        colors: {
          include: {
            images: { orderBy: { order: 'asc' } },
            sizes: { orderBy: { name: 'asc' } },
            stock: true
          }
        },
        images: { orderBy: { order: 'asc' } },
        sizes: { orderBy: { name: 'asc' } },
        stock: true,
        subCategories: true
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    res.json(product)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product' })
  }
})

// Ürün istatistikleri
router.get('/products/:productId/stats', async (req, res) => {
  try {
    const { productId } = req.params
    const { period = '30d' } = req.query
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      product,
      priceHistory,
      stockHistory,
      colorCount,
      imageCount,
      sizeCount
    ] = await Promise.all([
      prisma.product.findUnique({
        where: { productId: parseInt(productId) },
        include: {
          brand: true,
          _count: { select: { colors: true, images: true, sizes: true } }
        }
      }),
      prisma.priceHistory.findMany({
        where: { 
          productId: parseInt(productId),
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'asc' }
      }),
      prisma.stockHistory.findMany({
        where: { 
          productId: parseInt(productId),
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'asc' }
      }),
      prisma.productColor.count({ where: { productId: parseInt(productId) } }),
      prisma.productImage.count({ where: { productId: parseInt(productId) } }),
      prisma.productSize.count({ where: { productId: parseInt(productId) } })
    ])

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Fiyat analizi
    const priceAnalysis = priceHistory.length > 0 ? {
      firstPrice: priceHistory[0]!.price,
      lastPrice: priceHistory[priceHistory.length - 1]!.price,
      lowestPrice: Math.min(...priceHistory.map(h => h.price)),
      highestPrice: Math.max(...priceHistory.map(h => h.price)),
      priceChange: priceHistory.length > 1 
        ? ((priceHistory[priceHistory.length - 1]!.price - priceHistory[0]!.price) / priceHistory[0]!.price) * 100
        : 0,
      dataPoints: priceHistory.length
    } : null

    // Stok analizi
    const stockAnalysis = stockHistory.length > 0 ? {
      currentlyInStock: stockHistory[stockHistory.length - 1]!.available,
      stockChanges: stockHistory.reduce((acc, curr, idx, arr) => {
        if (idx === 0) return acc
        const prev = arr[idx - 1]
        if (prev && curr.available !== prev.available) {
          acc.push({
            from: prev.available,
            to: curr.available,
            timestamp: curr.timestamp
          })
        }
        return acc
      }, [] as any[]),
      dataPoints: stockHistory.length
    } : null

    res.json({
      product,
      stats: {
        colorCount,
        imageCount,
        sizeCount,
        priceAnalysis,
        stockAnalysis
      },
      period,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product stats' })
  }
})

// ==================== FİYAT İSTATİSTİKLERİ ====================

// Fiyat geçmişi
router.get('/products/:productId/price-history', async (req, res) => {
  try {
    const { productId } = req.params
    const { start, end, colorId } = req.query

    const where: any = {
      productId: parseInt(productId),
      timestamp: {}
    }

    if (start) where.timestamp.gte = new Date(start as string)
    if (end) where.timestamp.lte = new Date(end as string)
    if (colorId) where.colorId = parseInt(colorId as string)

    const history = await prisma.priceHistory.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      include: {
        color: true
      }
    })

    if (history.length > 0) {
      const firstPrice = history[0]?.price
      const lastPrice = history[history.length - 1]?.price
      const priceChange = firstPrice && lastPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0

      res.json({
        history,
        analysis: {
          firstPrice,
          lastPrice,
          priceChange: parseFloat(priceChange.toFixed(2)),
          lowestPrice: Math.min(...history.map(h => h.price)),
          highestPrice: Math.max(...history.map(h => h.price)),
          dataPoints: history.length
        }
      })
    } else {
      res.json({ history: [], analysis: null })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get price history' })
  }
})

// Fiyat trend analizi
router.get('/analytics/price-trends', async (req, res) => {
  try {
    const { brand, categoryId, period = '30d' } = req.query
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where: any = {
      timestamp: { gte: startDate }
    }

    if (brand) {
      where.product = { brandName: brand }
    }
    if (categoryId) {
      where.product = { 
        ...where.product,
        subCategories: { some: { categoryId: parseInt(categoryId as string) } }
      }
    }

    const trends = await prisma.priceHistory.groupBy({
      by: ['timestamp'],
      where,
      _avg: { price: true },
      _count: { id: true },
      orderBy: { timestamp: 'asc' }
    })

    const dailyTrendsMap = new Map<string, { avgPrice: number; count: number; totalPrice: number }>()
    for (const trend of trends) {
      const tsValue: Date = (trend.timestamp instanceof Date ? trend.timestamp : new Date(trend.timestamp as any))
      const key: string = tsValue.toISOString().slice(0, 10)
      const existing: { avgPrice: number; count: number; totalPrice: number } = dailyTrendsMap.get(key) ?? { avgPrice: 0, count: 0, totalPrice: 0 }
      const nextCount = existing.count + trend._count.id
      const nextTotal = existing.totalPrice + (trend._avg.price || 0)
      dailyTrendsMap.set(key, {
        count: nextCount,
        totalPrice: nextTotal,
        avgPrice: nextTotal / Math.max(1, nextCount)
      })
    }

    res.json({
      trends: Array.from(dailyTrendsMap.entries()).map(([date, data]) => ({
        date: date as string,
        avgPrice: Math.round(data.avgPrice),
        count: data.count
      })),
      period,
      filters: { brand, categoryId },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get price trends' })
  }
})

// Fiyat dağılımı analizi
router.get('/analytics/price-distribution', async (req, res) => {
  try {
    const { brand, categoryId } = req.query

    const where: any = { price: { not: null } }
    if (brand) where.brandName = brand
    if (categoryId) {
      where.subCategories = { some: { categoryId: parseInt(categoryId as string) } }
    }

    const products = await prisma.product.findMany({
      where,
      select: { price: true }
    })

    const prices = products.map(p => p.price!).filter(p => p > 0)
    
    if (prices.length === 0) {
      return res.json({
        distribution: [],
        stats: { min: 0, max: 0, avg: 0, median: 0 },
        filters: { brand, categoryId },
        timestamp: new Date()
      })
    }

    // Fiyat aralıkları
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min
    const bucketCount = 10
    const bucketSize = range / bucketCount

    const distribution = Array.from({ length: bucketCount }, (_, i) => {
      const bucketMin = min + (i * bucketSize)
      const bucketMax = min + ((i + 1) * bucketSize)
      const count = prices.filter((p: number) => p >= bucketMin && p < bucketMax).length
      
      return {
        range: `${Math.round(bucketMin)} - ${Math.round(bucketMax)}`,
        min: Math.round(bucketMin),
        max: Math.round(bucketMax),
        count,
        percentage: (count / prices.length) * 100
      }
    })

    // İstatistikler
    const avg = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length
    const sorted = prices.slice().sort((a: number, b: number) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const medianVal: number = sorted.length % 2 === 0 
      ? (((sorted[mid - 1] ?? sorted[mid]) as number) + ((sorted[mid] ?? sorted[mid - 1]) as number)) / 2
      : (sorted[mid] as number)

    res.json({
      distribution,
      stats: {
        min: Math.round(min),
        max: Math.round(max),
        avg: Math.round(avg),
        median: Math.round(medianVal),
        total: prices.length
      },
      filters: { brand, categoryId },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get price distribution' })
  }
})

// ==================== STOK İSTATİSTİKLERİ ====================

// Stok geçmişi
router.get('/products/:productId/stock-history', async (req, res) => {
  try {
    const { productId } = req.params
    const { start, end, colorId } = req.query

    const where: any = {
      productId: parseInt(productId),
      timestamp: {}
    }

    if (start) where.timestamp.gte = new Date(start as string)
    if (end) where.timestamp.lte = new Date(end as string)
    if (colorId) where.colorId = parseInt(colorId as string)

    const history = await prisma.stockHistory.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      include: {
        color: true
      }
    })

    if (history.length > 0) {
      const stockChanges = history.reduce((acc: Array<{ from: boolean; to: boolean; timestamp: Date }>, curr, idx, arr) => {
        if (idx === 0) return acc
      const prev = arr[idx - 1]
        if (prev && curr.available !== prev.available) {
          acc.push({
            from: prev.available,
            to: curr.available,
            timestamp: curr.timestamp
          })
        }
        return acc
    }, [])

      const currentlyInStock = history[history.length - 1]!.available

      res.json({
        history,
        analysis: {
          stockChanges,
          currentlyInStock,
          outOfStockCount: stockChanges.filter(c => !c.to).length,
          restockCount: stockChanges.filter(c => c.to).length,
          dataPoints: history.length
        }
      })
    } else {
      res.json({ history: [], analysis: null })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stock history' })
  }
})

// Stok analizi
router.get('/analytics/stock-analysis', async (req, res) => {
  try {
    const { brand, categoryId } = req.query

    const where: any = {}
    if (brand) where.product = { brandName: brand }
    if (categoryId) {
      where.product = { 
        ...where.product,
        subCategories: { some: { categoryId: parseInt(categoryId as string) } }
      }
    }

    const [inStock, outOfStock, totalProducts] = await Promise.all([
      prisma.productStock.count({ 
        where: { ...where, availability: 'in_stock' } 
      }),
      prisma.productStock.count({ 
        where: { ...where, availability: 'out_of_stock' } 
      }),
      prisma.productStock.count({ where })
    ])

    const stockRatio = totalProducts > 0 ? (inStock / totalProducts) * 100 : 0

    res.json({
      inStock,
      outOfStock,
      totalProducts,
      stockRatio: Math.round(stockRatio * 100) / 100,
      filters: { brand, categoryId },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stock analysis' })
  }
})

// Stok trend analizi
router.get('/analytics/stock-trends', async (req, res) => {
  try {
    const { brand, categoryId, period = '30d' } = req.query
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where: any = {
      timestamp: { gte: startDate }
    }

    if (brand) {
      where.product = { brandName: brand }
    }
    if (categoryId) {
      where.product = { 
        ...where.product,
        subCategories: { some: { categoryId: parseInt(categoryId as string) } }
      }
    }

    const trends = await prisma.stockHistory.groupBy({
      by: ['timestamp'],
      where,
      _count: { id: true },
      orderBy: { timestamp: 'asc' }
    })

    const dailyTrends = trends.reduce((acc: Record<string, { totalChanges: number }>, trend) => {
      const tsValue: Date = (trend.timestamp instanceof Date ? trend.timestamp : new Date(trend.timestamp as any))
      const key: string = tsValue.toISOString().slice(0, 10)
      const entry: { totalChanges: number } = acc[key] ?? { totalChanges: 0 }
      entry.totalChanges += trend._count.id
      acc[key] = entry
      return acc
    }, {} as Record<string, { totalChanges: number }>)

    res.json({
      trends: Object.entries(dailyTrends).map(([date, data]) => ({
        date,
        totalChanges: data.totalChanges
      })),
      period,
      filters: { brand, categoryId },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stock trends' })
  }
})

// ==================== ARAMA VE FİLTRELEME ====================

// Arama ve filtreleme
router.get('/search', async (req, res) => {
  try {
    const { 
      q, 
      brand, 
      categoryId, 
      minPrice, 
      maxPrice, 
      inStock,
      page = '1',
      limit = '20'
    } = req.query

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)
    const take = parseInt(limit as string)

    const where: any = {}

    if (q) {
      where.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } }
      ]
    }

    if (brand) where.brandName = brand

    if (categoryId) {
      where.subCategories = {
        some: { categoryId: parseInt(categoryId as string) }
      }
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseInt(minPrice as string)
      if (maxPrice) where.price.lte = parseInt(maxPrice as string)
    }

    if (inStock === 'true') {
      where.stock = {
        some: { availability: 'in_stock' }
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          brand: true,
          colors: { take: 1 },
          images: { take: 1, orderBy: { order: 'asc' } },
          _count: { select: { colors: true, images: true } }
        },
        skip,
        take,
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    res.json({
      products,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      },
      filters: { q, brand, categoryId, minPrice, maxPrice, inStock },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Search failed' })
  }
})

// ==================== GEÇMİŞ TAKİP ====================

// Kategori geçmişi
router.get('/categories/:categoryId/history', async (req, res) => {
  try {
    const { categoryId } = req.params
    const { start, end } = req.query

    const where: any = {
      categoryId: parseInt(categoryId),
      timestamp: {}
    }

    if (start) where.timestamp.gte = new Date(start as string)
    if (end) where.timestamp.lte = new Date(end as string)

    const history = await prisma.categoryHistory.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      include: {
        category: true
      }
    })

    res.json(history)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category history' })
  }
})

// ==================== SİSTEM İSTATİSTİKLERİ ====================

// Sistem performans istatistikleri
router.get('/stats/system', async (req, res) => {
  try {
    const [
      totalBrands,
      totalCategories,
      totalProducts,
      totalPriceHistory,
      totalStockHistory,
      totalCategoryHistory,
      lastSync,
      databaseSize
    ] = await Promise.all([
      prisma.brand.count(),
      prisma.subCategory.count(),
      prisma.product.count(),
      prisma.priceHistory.count(),
      prisma.stockHistory.count(),
      prisma.categoryHistory.count(),
      prisma.dataSync.findFirst({
        orderBy: { timestamp: 'desc' }
      }),
      // Database size estimation (approximate)
      prisma.$queryRaw`SELECT 
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = DATABASE()`
    ])

    const dbRows = Array.isArray(databaseSize) ? (databaseSize as Array<{ size_mb: number }>) : []

    res.json({
      database: {
        totalBrands,
        totalCategories,
        totalProducts,
        totalPriceHistory,
        totalStockHistory,
        totalCategoryHistory,
        estimatedSizeMB: dbRows[0]?.size_mb || 0
      },
      lastSync: lastSync ? {
        type: lastSync.syncType,
        status: lastSync.status,
        itemsCount: lastSync.itemsCount,
        timestamp: lastSync.timestamp
      } : null,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get system stats' })
  }
})

// ==================== VERİ KALİTESİ VE DOĞRULAMA ====================

// Veri kalitesi raporu
router.get('/analytics/data-quality', async (req, res) => {
  try {
    const [
      productsWithoutPrice,
      productsWithoutDescription,
      productsWithoutImages,
      productsWithoutColors,
      productsWithoutSizes,
      categoriesWithoutProducts,
      duplicateProducts,
      invalidPrices
    ] = await Promise.all([
      prisma.product.count({ where: { price: null } }),
      prisma.product.count({ where: { description: null } }),
      prisma.product.count({ 
        where: { 
          images: { none: {} }
        }
      }),
      prisma.product.count({ 
        where: { 
          colors: { none: {} }
        }
      }),
      prisma.product.count({ 
        where: { 
          sizes: { none: {} }
        }
      }),
      prisma.subCategory.count({ 
        where: { 
          isLeaf: true,
          products: { none: {} }
        }
      }),
      // Duplicate products (same productId)
      prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as count FROM (
        SELECT productId, COUNT(*) as cnt 
        FROM products 
        GROUP BY productId 
        HAVING cnt > 1
      ) as duplicates`),
      // Invalid prices (negative or zero)
      prisma.product.count({ 
        where: { 
          price: { 
            not: null,
            lte: 0
          }
        }
      })
    ])

    const totalProducts = await prisma.product.count()
    const totalCategories = await prisma.subCategory.count({ where: { isLeaf: true } })

    res.json({
      quality: {
        productsWithoutPrice: {
          count: productsWithoutPrice,
          percentage: totalProducts > 0 ? (productsWithoutPrice / totalProducts) * 100 : 0
        },
        productsWithoutDescription: {
          count: productsWithoutDescription,
          percentage: totalProducts > 0 ? (productsWithoutDescription / totalProducts) * 100 : 0
        },
        productsWithoutImages: {
          count: productsWithoutImages,
          percentage: totalProducts > 0 ? (productsWithoutImages / totalProducts) * 100 : 0
        },
        productsWithoutColors: {
          count: productsWithoutColors,
          percentage: totalProducts > 0 ? (productsWithoutColors / totalProducts) * 100 : 0
        },
        productsWithoutSizes: {
          count: productsWithoutSizes,
          percentage: totalProducts > 0 ? (productsWithoutSizes / totalProducts) * 100 : 0
        },
        categoriesWithoutProducts: {
          count: categoriesWithoutProducts,
          percentage: totalCategories > 0 ? (categoriesWithoutProducts / totalCategories) * 100 : 0
        },
        duplicateProducts: {
          count: (Array.isArray(duplicateProducts) ? (duplicateProducts as any[])[0]?.count : 0) || 0
        },
        invalidPrices: {
          count: invalidPrices,
          percentage: totalProducts > 0 ? (invalidPrices / totalProducts) * 100 : 0
        }
      },
      summary: {
        totalProducts,
        totalCategories,
        overallQuality: totalProducts > 0 ? 
          ((totalProducts - productsWithoutPrice - productsWithoutDescription - productsWithoutImages) / totalProducts) * 100 : 0
      },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get data quality report' })
  }
})

// ==================== SENKRONİZASYON DURUMU ====================

// Senkronizasyon durumu
router.get('/sync/status', async (req, res) => {
  try {
    const [
      lastCategorySync,
      lastProductSync,
      syncHistory,
      nextScheduledSync
    ] = await Promise.all([
      prisma.dataSync.findFirst({
        where: { syncType: 'categories' },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.dataSync.findFirst({
        where: { syncType: 'products' },
        orderBy: { timestamp: 'desc' }
      }),
      prisma.dataSync.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' }
      }),
      // Next scheduled sync (every Sunday at 2 AM)
      (() => {
        const now = new Date()
        const nextSunday = new Date(now)
        nextSunday.setDate(now.getDate() + (7 - now.getDay()))
        nextSunday.setHours(2, 0, 0, 0)
        return nextSunday
      })()
    ])

    res.json({
      categories: lastCategorySync ? {
        lastSync: lastCategorySync.timestamp,
        status: lastCategorySync.status,
        itemsCount: lastCategorySync.itemsCount,
        errorMessage: lastCategorySync.errorMessage
      } : null,
      products: lastProductSync ? {
        lastSync: lastProductSync.timestamp,
        status: lastProductSync.status,
        itemsCount: lastProductSync.itemsCount,
        errorMessage: lastProductSync.errorMessage
      } : null,
      history: syncHistory,
      nextScheduledSync,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get sync status' })
  }
})

// Manuel senkronizasyon tetikleme
router.post('/sync/trigger', async (req, res) => {
  try {
    const { type } = req.body // 'categories' or 'products'

    if (!type || !['categories', 'products'].includes(type)) {
      return res.status(400).json({ error: 'Invalid sync type' })
    }

    // Create sync record
    const syncRecord = await prisma.dataSync.create({
      data: {
        syncType: type,
        status: 'in_progress',
        timestamp: new Date()
      }
    })

    res.json({
      message: `${type} sync triggered`,
      syncId: syncRecord.id,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to trigger sync' })
  }
})

// ==================== ÖNERİLER VE İNSIGHTS ====================

// Ürün önerileri
router.get('/recommendations/products', async (req, res) => {
  try {
    const { brand, categoryId, limit = '10' } = req.query

    const where: any = { price: { not: null } }
    if (brand) where.brandName = brand
    if (categoryId) {
      where.subCategories = { some: { categoryId: parseInt(categoryId as string) } }
    }

    // En popüler ürünler (en çok renk ve resim sayısına göre)
    const popularProducts = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        _count: { select: { colors: true, images: true } }
      },
      orderBy: [
        { colors: { _count: 'desc' } },
        { images: { _count: 'desc' } }
      ],
      take: parseInt(limit as string)
    })

    // En yeni ürünler
    const newProducts = await prisma.product.findMany({
      where,
      include: {
        brand: true,
        _count: { select: { colors: true, images: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    })

    // Fiyat değişimi olan ürünler
    const priceChangedProducts = await prisma.product.findMany({
      where: {
        ...where,
        priceHistory: { some: {} }
      },
      include: {
        brand: true,
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 2
        },
        _count: { select: { colors: true, images: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: parseInt(limit as string)
    })

    res.json({
      popular: popularProducts,
      new: newProducts,
      priceChanged: priceChangedProducts,
      filters: { brand, categoryId, limit },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get product recommendations' })
  }
})

// İş insights
router.get('/insights/business', async (req, res) => {
  try {
    const { period = '30d' } = req.query
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      totalProducts,
      avgPrice,
      priceChanges,
      stockChanges,
      topCategories,
      brandPerformance,
      priceTrends,
      stockTrends
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.aggregate({
        where: { price: { not: null } },
        _avg: { price: true }
      }),
      prisma.priceHistory.count({
        where: { timestamp: { gte: startDate } }
      }),
      prisma.stockHistory.count({
        where: { timestamp: { gte: startDate } }
      }),
      prisma.subCategory.groupBy({
        by: ['brand'],
        where: { isLeaf: true },
        _count: { categoryId: true },
        orderBy: { _count: { categoryId: 'desc' } },
        take: 5
      }),
      prisma.product.groupBy({
        by: ['brandName'],
        _count: { id: true },
        _avg: { price: true },
        orderBy: { _count: { id: 'desc' } }
      }),
      prisma.priceHistory.groupBy({
        by: ['timestamp'],
        where: { timestamp: { gte: startDate } },
        _avg: { price: true },
        orderBy: { timestamp: 'asc' }
      }),
      prisma.stockHistory.groupBy({
        by: ['timestamp'],
        where: { timestamp: { gte: startDate } },
        _count: { id: true },
        orderBy: { timestamp: 'asc' }
      })
    ])

    // Insights hesaplamaları
    const insights = {
      totalProducts,
      avgPrice: avgPrice._avg.price || 0,
      priceChanges,
      stockChanges,
      topCategories: topCategories.map(c => ({
        brand: c.brand,
        categoryCount: c._count.categoryId
      })),
      brandPerformance: brandPerformance.map(b => ({
        brand: b.brandName,
        productCount: b._count.id,
        avgPrice: b._avg.price || 0
      })),
      trends: {
        priceTrends: priceTrends.length > 0 ? {
          trend: ((priceTrends[priceTrends.length - 1]?._avg.price || 0) > (priceTrends[0]?._avg.price || 0)) ? 'up' : 'down',
          change: priceTrends.length > 1 ? 
            ((((priceTrends[priceTrends.length - 1]?._avg.price) || 0) - ((priceTrends[0]?._avg.price) || 0)) / Math.max(1, (priceTrends[0]?._avg.price) || 0)) * 100 : 0
        } : null,
        stockTrends: stockTrends.length > 0 ? {
          totalChanges: stockTrends.reduce((sum, t) => sum + (t._count.id || 0), 0)
        } : null
      }
    }

    res.json({
      insights,
      period,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get business insights' })
  }
})

// ==================== RAPORLAR VE EXPORT ====================

// Rapor oluşturma
router.post('/reports/generate', async (req, res) => {
  try {
    const { 
      type, // 'products', 'categories', 'analytics', 'quality'
      filters, // { brand, categoryId, period, etc. }
      format = 'json' // 'json', 'csv'
    } = req.body

    if (!type || !['products', 'categories', 'analytics', 'quality'].includes(type)) {
      return res.status(400).json({ error: 'Invalid report type' })
    }

    let reportData

    switch (type) {
      case 'products':
        reportData = await generateProductsReport(filters)
        break
      case 'categories':
        reportData = await generateCategoriesReport(filters)
        break
      case 'analytics':
        reportData = await generateAnalyticsReport(filters)
        break
      case 'quality':
        reportData = await generateQualityReport(filters)
        break
    }

    res.json({
      report: {
        type,
        filters,
        format,
        data: reportData,
        generatedAt: new Date(),
        recordCount: Array.isArray(reportData) ? reportData.length : 1
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate report' })
  }
})

// Rapor fonksiyonları
async function generateProductsReport(filters: any) {
  const where: any = {}
  if (filters?.brand) where.brandName = filters.brand
  if (filters?.categoryId) {
    where.subCategories = { some: { categoryId: parseInt(filters.categoryId) } }
  }

  return await prisma.product.findMany({
    where,
    include: {
      brand: true,
      colors: { include: { images: true } },
      images: true,
      sizes: true,
      stock: true,
      subCategories: true
    }
  })
}

async function generateCategoriesReport(filters: any) {
  const where: any = {}
  if (filters?.brand) where.brand = filters.brand
  if (filters?.leaf) where.isLeaf = true

  return await prisma.subCategory.findMany({
    where,
    include: {
      _count: { select: { products: true } },
      products: {
        select: {
          price: true,
          _count: { select: { colors: true, images: true } }
        }
      }
    }
  })
}

async function generateAnalyticsReport(filters: any) {
  const period = filters?.period || '30d'
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  return {
    period,
    startDate,
    endDate: new Date(),
    stats: {
      totalProducts: await prisma.product.count(),
      totalCategories: await prisma.subCategory.count({ where: { isLeaf: true } }),
      priceChanges: await prisma.priceHistory.count({ where: { timestamp: { gte: startDate } } }),
      stockChanges: await prisma.stockHistory.count({ where: { timestamp: { gte: startDate } } })
    }
  }
}

async function generateQualityReport(filters: any) {
  return {
    productsWithoutPrice: await prisma.product.count({ where: { price: null } }),
    productsWithoutDescription: await prisma.product.count({ where: { description: null } }),
    categoriesWithoutProducts: await prisma.subCategory.count({ 
      where: { isLeaf: true, products: { none: {} } }
    })
  }
}

// ==================== BİLDİRİMLER VE ALERTS ====================

// Bildirimler
router.get('/notifications', async (req, res) => {
  try {
    const { type, limit = '10' } = req.query

    const where: any = {}
    if (type) where.type = type

    // Son fiyat değişiklikleri
    const priceAlerts = await prisma.priceHistory.findMany({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: {
        product: { include: { brand: true } },
        color: true
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string)
    })

    // Stok değişiklikleri
    const stockAlerts = await prisma.stockHistory.findMany({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      include: {
        product: { include: { brand: true } },
        color: true
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string)
    })

    // Senkronizasyon hataları
    const syncErrors = await prisma.dataSync.findMany({
      where: { 
        status: 'failed',
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit as string)
    })

    res.json({
      priceAlerts,
      stockAlerts,
      syncErrors,
      filters: { type, limit },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get notifications' })
  }
})

// ==================== KULLANICI TERCİHLERİ VE AYARLAR ====================

// Kullanıcı tercihleri (basit key-value store)
router.get('/preferences', async (req, res) => {
  try {
    // Bu örnek için basit bir yapı kullanıyoruz
    // Gerçek uygulamada ayrı bir preferences tablosu olabilir
    const defaultPreferences = {
      dashboard: {
        defaultPeriod: '30d',
        showNotifications: true,
        refreshInterval: 30000, // 30 seconds
        defaultBrand: null,
        defaultCategory: null
      },
      analytics: {
        defaultMetric: 'price',
        chartType: 'line',
        showTrends: true
      },
      notifications: {
        priceChanges: true,
        stockChanges: true,
        syncErrors: true,
        emailNotifications: false
      }
    }

    res.json({
      preferences: defaultPreferences,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get preferences' })
  }
})

// Kullanıcı tercihlerini güncelleme
router.put('/preferences', async (req, res) => {
  try {
    const { preferences } = req.body

    // Bu örnek için sadece başarı mesajı döndürüyoruz
    // Gerçek uygulamada preferences tablosuna kaydedilir
    res.json({
      message: 'Preferences updated successfully',
      preferences,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update preferences' })
  }
})

// ==================== GELİŞMİŞ ANALİTİK ====================

// Kategori hiyerarşi analizi
router.get('/analytics/category-hierarchy', async (req, res) => {
  try {
    const { brand } = req.query

    const where: any = {}
    if (brand) where.brand = brand

    const categories = await prisma.subCategory.findMany({
      where,
      include: {
        _count: { select: { products: true } },
        subcategories: {
          include: {
            _count: { select: { products: true } }
          }
        }
      },
      orderBy: [{ level: 'asc' }, { categoryName: 'asc' }]
    })

    // Hiyerarşi yapısını oluştur
    const hierarchy = categories
      .filter(c => c.level === 0) // Root categories
      .map(root => ({
        ...root,
        children: categories
          .filter(c => c.parentCategoryId === root.categoryId)
          .map(child => ({
            ...child,
            children: categories.filter(c => c.parentSubCategoryId === child.categoryId)
          }))
      }))

    res.json({
      hierarchy,
      filters: { brand },
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get category hierarchy' })
  }
})

// Zaman bazlı analiz
router.get('/analytics/time-based', async (req, res) => {
  try {
    const { period = '30d', groupBy = 'day' } = req.query // groupBy: 'day', 'week', 'month'
    
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const [
      priceHistory,
      stockHistory,
      productCreations
    ] = await Promise.all([
      prisma.priceHistory.groupBy({
        by: ['timestamp'],
        where: { timestamp: { gte: startDate } },
        _avg: { price: true },
        _count: { id: true },
        orderBy: { timestamp: 'asc' }
      }),
      prisma.stockHistory.groupBy({
        by: ['timestamp'],
        where: { timestamp: { gte: startDate } },
        _count: { id: true },
        orderBy: { timestamp: 'asc' }
      }),
      prisma.product.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: startDate } },
        _count: { id: true },
        orderBy: { createdAt: 'asc' }
      })
    ])

    res.json({
      priceHistory,
      stockHistory,
      productCreations,
      period,
      groupBy,
      timestamp: new Date()
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get time-based analytics' })
  }
})

export default router
