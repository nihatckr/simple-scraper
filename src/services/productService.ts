import { BRAND_CONFIG } from '../config'
import prisma from '../lib/prisma'
import { fetchZaraProductIds, fetchPullBearProductIds } from '../scraper/categories'
import { fetchWithRetry } from '../lib/retry'
import { getCache, cacheKeys, CACHE_TTL } from '../lib/redis-cache'
import { AdaptiveRateLimiter } from '../lib/adaptive-rate-limiter'

// Normalize edilmiş veri yapısına uyumlu interface
interface ProductData {
  id: number
  name: string
  price: number
  description: string
  colors: Array<{
    id: string
    name: string
    hexCode?: string | undefined
    price?: number | undefined
    description?: string | undefined
    images: Array<{
      url: string
      type: string
      kind: string
      order: number
      colorId?: string
      colorName?: string
    }>
    sizes: Array<{
      id: number
      name: string
      availability: string
      price?: number | undefined
      sku?: number | undefined
    }>
  }>
  // Toplam veriler (normalize edilmiş yapıdan)
  images?: Array<{
    url: string
    type: string
    kind: string
    order: number
    colorId?: string
    colorName?: string
    colorIndex?: number
  }>
  sizes?: Array<{
    id: number
    name: string
    availability: string
    colorId?: string
    colorName?: string
  }>
  stock?: Array<{
    id: number
    name: string
    availability: string
    price?: number | undefined
    sku?: number | undefined
    colorId?: string
    colorName?: string
  }>
  categoryId?: number
  brand?: string
}

// Rate limiting için delay fonksiyonu
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Random delay 200-500ms arası (çok hızlı)
const getRandomDelay = () => Math.floor(Math.random() * 300) + 200

// User-Agent rotasyonu
const userAgents = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
]

const getRandomUserAgent = () =>
  userAgents[Math.floor(Math.random() * userAgents.length)]

// Batch processing için ürünleri gruplara ayır
const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Brand-specific rate limiters
const rateLimiters = {
  ZARA: new AdaptiveRateLimiter({
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    maxConcurrency: 8,
    brand: 'ZARA'
  }),
  'PULL&BEAR': new AdaptiveRateLimiter({
    initialDelayMs: 800,
    maxDelayMs: 15000,
    backoffMultiplier: 2.5,
    maxConcurrency: 6,
    brand: 'PULL&BEAR'
  })
}

// Paralel işleme için worker pool (daha konservatif)
class WorkerPool {
  private maxWorkers: number
  private activeWorkers: number = 0
  private queue: Array<() => Promise<any>> = []
  private results: any[] = []

  constructor(maxWorkers: number = 10) { // Reduced from 15
    this.maxWorkers = maxWorkers
  }

  async addTask<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await task()
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })
      this.processQueue()
    })
  }

  private async processQueue() {
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
      return
    }

    this.activeWorkers++
    const task = this.queue.shift()
    
    if (task) {
      try {
        await task()
      } finally {
        this.activeWorkers--
        this.processQueue()
      }
    }
  }

  async waitForAll(): Promise<void> {
    while (this.queue.length > 0 || this.activeWorkers > 0) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
}

// ZARA ürün detaylarını çek (rate limiting ile)
async function fetchZaraProduct(
  productId: number,
  headers: Record<string, string> = {},
): Promise<ProductData | null> {
  return rateLimiters.ZARA.execute(async () => {
    try {
      // Cache kontrolü
      const cache = await getCache()
      const cacheKey = cacheKeys.productDetails(productId, 'ZARA')
      const cachedData = await cache.get<ProductData>(cacheKey)
      if (cachedData) {
        return cachedData
      }

      const defaultHeaders = {
        'User-Agent': getRandomUserAgent(),
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        Referer: 'https://www.zara.com/',
        ...headers,
      }

      // Ana ürün bilgilerini çek (Doğru ZARA API endpoint'i)
      const mainResponse = await fetchWithRetry(
        `https://www.zara.com/tr/tr/products-details?productIds=${productId}&ajax=true`,
        { headers: defaultHeaders as any },
        { maxRetries: 2 } // Reduced retries as we have adaptive limiting
      )

    if (!mainResponse.ok) {
      throw new Error(`HTTP ${mainResponse.status}`)
    }

    const mainData: any = await mainResponse.json()

    // Yanıt array formatında gelir, ilk elemanı al
    const product = Array.isArray(mainData) ? mainData[0] : mainData

    if (!product) {
      return null
    }

    // Normalize edilmiş format (tam yapı)
    const normalizedProduct: ProductData = {
      id: product.id,
      name: product.name || '',
      price: product.detail?.colors?.[0]?.price || 0,
      description: product.detail?.colors?.[0]?.description || '',
      colors: [],
      images: [], // Genel resim array'i
      sizes: [], // Genel beden array'i
      stock: [], // Genel stok array'i
    }

    // Renk ve beden bilgilerini işle
    if (product.detail?.colors) {
      for (const color of product.detail.colors) {
        const colorData = {
          id: color.id?.toString() || '',
          name: color.name || '',
          hexCode: color.hexCode || undefined,
          price: color.price || undefined,
          description: color.description || '',
          images: [] as any[],
          sizes: [] as any[],
        }

        // Görsel bilgilerini işle
        if (color.xmedia) {
          color.xmedia.forEach((media: any, index: number) => {
            if (media.url && media.type === 'image') {
              const imageData = {
                url: media.url,
                type: media.type || 'image',
                kind: media.kind || 'other',
                order: media.order || index + 1,
                colorId: color.id?.toString(),
                colorName: color.name,
              }

              // Renk içindeki görsele ekle
              colorData.images.push(imageData)

              // Genel görsel array'ine ekle (normalize yapıda var)
              normalizedProduct.images?.push({
                ...imageData,
                colorIndex: normalizedProduct.colors.length,
              })
            }
          })
        }

        // Beden bilgilerini işle
        if (color.sizes) {
          color.sizes.forEach((size: any) => {
            const sizeData = {
              id: size.id || 0,
              name: size.name || '',
              availability: size.availability || 'out_of_stock',
              price: size.price || color.price || undefined,
              sku: size.sku || undefined,
            }

            // Renk içindeki bedene ekle
            colorData.sizes.push(sizeData)

            // Genel beden array'ine ekle (normalize yapıda var)
            normalizedProduct.sizes?.push({
              id: size.id || 0,
              name: size.name || '',
              availability: size.availability || 'out_of_stock',
              colorId: color.id?.toString(),
              colorName: color.name,
            })

            // Genel stok array'ine ekle (normalize yapıda var)
            normalizedProduct.stock?.push({
              id: size.id || 0,
              name: size.name || '',
              availability: size.availability || 'out_of_stock',
              price: size.price || color.price || undefined,
              sku: size.sku || undefined,
              colorId: color.id?.toString(),
              colorName: color.name,
            })
          })
        }

        normalizedProduct.colors.push(colorData)
      }
    }

    // Cache'e kaydet
    await cache.set(cacheKey, normalizedProduct, CACHE_TTL)
    
      return normalizedProduct
    } catch (error: any) {
      console.error(`ZARA ürün çekme hatası (${productId}):`, error.message)
      throw error // Re-throw to trigger rate limiter's error handling
    }
  })
}

// Pull&Bear ürün detaylarını çek (rate limiting ile)
async function fetchPullBearProduct(
  productId: number,
  headers: Record<string, string> = {},
): Promise<ProductData | null> {
  return rateLimiters['PULL&BEAR'].execute(async () => {
    try {
      // Cache kontrolü
      const cache = await getCache()
      const cacheKey = cacheKeys.productDetails(productId, 'PULL&BEAR')
      const cachedData = await cache.get<ProductData>(cacheKey)
      if (cachedData) {
        return cachedData
      }

      const defaultHeaders = {
        'User-Agent': getRandomUserAgent(),
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        Referer: 'https://www.pullandbear.com/',
        ...headers,
      }

      const response = await fetchWithRetry(
        `https://www.pullandbear.com/itxrest/2/catalog/store/25009521/20309457/category/0/product/${productId}/detail?languageId=-43&appId=1`,
        { headers: defaultHeaders as any },
        { maxRetries: 2 } // Reduced retries
      )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data: any = await response.json()

    if (!data) {
      return null
    }

    const normalizedProduct: ProductData = {
      id: data.id,
      name: data.name || '',
      price: data.bundleProductSummaries?.[0]?.detail?.colors?.[0]?.sizes?.[0]
        ?.price
        ? parseInt(
            data.bundleProductSummaries[0].detail.colors[0].sizes[0].price,
          )
        : 0,
      description:
        data.bundleProductSummaries?.[0]?.detail?.longDescription || '',
      colors: [],
      images: [], // Genel resim array'i
      sizes: [], // Genel beden array'i
      stock: [], // Genel stok array'i
    }

    // Pull&Bear için renk ve beden işleme
    const bundleDetail = data.bundleProductSummaries?.[0]?.detail
    if (bundleDetail && bundleDetail.colors) {
      for (const color of bundleDetail.colors) {
        const colorData = {
          id: color.id?.toString() || '',
          name: color.name || '',
          hexCode: undefined, // Pull&Bear'da hexCode yok
          price: color.sizes?.[0]?.price
            ? parseInt(color.sizes[0].price)
            : undefined,
          description: bundleDetail.longDescription || '',
          images: [] as any[],
          sizes: [] as any[],
        }

        // Görsel işleme
        if (color.image) {
          // Ana görsel
          const mainImage = {
            url: `https://static.pullandbear.net/2/photos${color.image.url}_1_1_8.jpg?t=${color.image.timestamp}`,
            type: 'image',
            kind: 'main',
            order: 1,
            colorId: color.id?.toString(),
            colorName: color.name,
          }

          colorData.images.push(mainImage)
          normalizedProduct.images?.push({
            ...mainImage,
            colorIndex: normalizedProduct.colors.length,
          })

          // Yardımcı görseller
          if (color.image.aux) {
            color.image.aux.forEach((auxIndex: string, index: number) => {
              const auxImage = {
                url: `https://static.pullandbear.net/2/photos${color.image.url}_${auxIndex}_1_8.jpg?t=${color.image.timestamp}`,
                type: 'image',
                kind: 'aux',
                order: index + 2,
                colorId: color.id?.toString(),
                colorName: color.name,
              }

              colorData.images.push(auxImage)
              normalizedProduct.images?.push({
                ...auxImage,
                colorIndex: normalizedProduct.colors.length,
              })
            })
          }
        }

        // Beden işleme
        if (color.sizes) {
          color.sizes.forEach((size: any) => {
            const sizeData = {
              id: size.sku || 0,
              name: size.name || '',
              availability: size.isBuyable ? 'in_stock' : 'out_of_stock',
              price: size.price ? parseInt(size.price) : colorData.price,
              sku: size.sku || 0,
            }

            // Renk içindeki bedene ekle
            colorData.sizes.push(sizeData)

            // Genel beden array'ine ekle
            normalizedProduct.sizes?.push({
              id: size.sku || 0,
              name: size.name || '',
              availability: size.isBuyable ? 'in_stock' : 'out_of_stock',
              colorId: color.id?.toString(),
              colorName: color.name,
            })

            // Genel stok array'ine ekle
            normalizedProduct.stock?.push({
              id: size.sku || 0,
              name: size.name || '',
              availability: size.isBuyable ? 'in_stock' : 'out_of_stock',
              price: size.price ? parseInt(size.price) : undefined,
              sku: size.sku || 0,
              colorId: color.id?.toString(),
              colorName: color.name,
            })
          })
        }

        normalizedProduct.colors.push(colorData)
      }
    }

    // Cache'e kaydet
    await cache.set(cacheKey, normalizedProduct, CACHE_TTL)
    
      return normalizedProduct
    } catch (error: any) {
      console.error(`Pull&Bear ürün çekme hatası (${productId}):`, error.message)
      throw error // Re-throw to trigger rate limiter's error handling
    }
  })
}

// Tek bir ürünün detaylarını çek ve kaydet
async function processProduct(
  productId: number,
  categoryId: number,
  brand: string,
  retries: number = 3,
): Promise<boolean> {
  try {
    console.log(`   📦 Ürün işleniyor: ${productId} (${brand})`)

    // Random delay ekle (daha kısa)
    await delay(Math.floor(Math.random() * 500) + 200) // 200-700ms arası

    // Ürün zaten var mı kontrol et
    const existingProduct = await prisma.product.findUnique({
      where: { productId },
    })

    if (existingProduct) {
      console.log(`   ⚠️  Ürün zaten mevcut: ${productId}`)
      return true
    }

    // Ürün detaylarını çek
    let productData: ProductData | null = null

    if (brand === 'ZARA') {
      productData = await fetchZaraProduct(productId)
    } else if (brand === 'PULL&BEAR') {
      productData = await fetchPullBearProduct(productId)
    }

    if (!productData) {
      console.log(`   ❌ Ürün detayları alınamadı: ${productId}`)
      return false
    }

    // Şimdilik sadece veri çekmeyi test edelim (database kaydetmeyi atla)
    console.log(
      `   ✅ Ürün verisi alındı: ${productData.name} (${productData.colors.length} renk)`,
    )

    // Database'e kaydet
    await saveProductToDatabase(productData, categoryId, brand)
    console.log(`   ✅ Ürün kaydedildi: ${productId}`)

    return true
  } catch (error: any) {
    if (retries > 0) {
      console.log(
        `   🔄 Hata, tekrar denenecek (${retries} kalan): ${productId}`,
      )
      await delay(getRandomDelay() * 2) // Daha uzun bekle
      return await processProduct(productId, categoryId, brand, retries - 1)
    }

    console.error(`   ❌ Ürün işlenemedi (${productId}):`, error.message)
    return false
  }
}

// Ürünü database'e kaydet (normalize veri yapısına uygun + performance optimized)
async function saveProductToDatabase(
  productData: ProductData,
  categoryId: number,
  brand: string,
): Promise<void> {
  const maxRetries = 3
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      console.log(
        `   💾 Database'e kaydediliyor: ${productData.name} (${
          attempt + 1
        }/${maxRetries})`,
      )

      await prisma.$transaction(async (tx) => {
        // Ürün zaten var mı kontrol et
        let product = await tx.product.findUnique({
          where: { productId: productData.id },
          include: { colors: true, images: true, sizes: true, stock: true },
        })

        if (!product) {
          // Ürünü kaydet
          product = await tx.product.create({
            data: {
              productId: productData.id,
              name: productData.name,
              price: productData.price,
              description: productData.description || '',
              brandName: brand,
              subCategories: {
                connect: { categoryId: categoryId },
              },
            },
            include: { colors: true, images: true, sizes: true, stock: true },
          })
        }

        // 1. Renkleri kaydet ve relation mapping'i yap
        const colorMapping: { [key: string]: number } = {} // API colorId → DB colorId mapping

        for (const colorData of productData.colors) {
          const existingColor = product.colors.find(
            (c) => c.colorId === colorData.id,
          )

          let dbColorId: number

          if (!existingColor) {
            const createdColor = await tx.productColor.create({
              data: {
                colorId: colorData.id,
                name: colorData.name,
                hexCode: colorData.hexCode || null,
                price: colorData.price || null,
                description: colorData.description || '',
                productId: product.id,
              },
            })
            dbColorId = createdColor.id
          } else {
            dbColorId = existingColor.id
          }

          // Mapping'i kaydet
          colorMapping[colorData.id] = dbColorId

          // Renk içindeki resimleri ve bedenleri batch olarak kaydet
          if (!existingColor) {
            // Batch image inserts
            const imageInserts = colorData.images.map((imageData) => ({
              url: imageData.url,
              type: imageData.type,
              kind: imageData.kind,
              order: imageData.order,
              productId: product.id,
              colorId: dbColorId,
              colorName: colorData.name,
            }))

            if (imageInserts.length > 0) {
              await tx.productImage.createMany({
                data: imageInserts,
                skipDuplicates: true,
              })
            }

            // Batch size inserts
            const sizeInserts = colorData.sizes.map((sizeData) => ({
              sizeId: sizeData.id,
              name: sizeData.name,
              availability: sizeData.availability,
              price: sizeData.price || null,
              sku: sizeData.sku || null,
              productId: product.id,
              colorId: dbColorId,
              colorName: colorData.name,
            }))

            if (sizeInserts.length > 0) {
              await tx.productSize.createMany({
                data: sizeInserts,
                skipDuplicates: true,
              })
            }
          }
        }

        // 2. Genel resimleri batch olarak kaydet
        if (productData.images && productData.images.length > 0) {
          const generalImageInserts = productData.images.map((imageData) => ({
            url: imageData.url,
            type: imageData.type,
            kind: imageData.kind,
            order: imageData.order,
            productId: product.id,
            colorId: imageData.colorId
              ? colorMapping[imageData.colorId] ?? null
              : null,
            colorName: imageData.colorName || null,
            colorIndex: imageData.colorIndex || null,
          }))

          await tx.productImage.createMany({
            data: generalImageInserts,
            skipDuplicates: true,
          })
        }

        // 3. Genel bedenleri batch olarak kaydet
        if (productData.sizes && productData.sizes.length > 0) {
          const generalSizeInserts = productData.sizes.map((sizeData) => ({
            sizeId: sizeData.id,
            name: sizeData.name,
            availability: sizeData.availability,
            productId: product.id,
            colorId: sizeData.colorId
              ? colorMapping[sizeData.colorId] ?? null
              : null,
            colorName: sizeData.colorName || null,
          }))

          await tx.productSize.createMany({
            data: generalSizeInserts,
            skipDuplicates: true,
          })
        }

        // 4. Stok bilgilerini batch olarak kaydet
        if (productData.stock && productData.stock.length > 0) {
          const stockInserts = productData.stock.map((stockData) => ({
            sizeId: stockData.id,
            name: stockData.name,
            availability: stockData.availability,
            price: stockData.price || null,
            sku: stockData.sku || null,
            productId: product.id,
            colorId: stockData.colorId
              ? colorMapping[stockData.colorId] ?? null
              : null,
            colorName: stockData.colorName || null,
          }))

          await tx.productStock.createMany({
            data: stockInserts,
            skipDuplicates: true,
          })
        }
      })

      console.log(
        `   ✅ Database'e kaydedildi: ${productData.name} (${productData.colors.length} renk)`,
      )
      return // Success, exit retry loop
    } catch (error: any) {
      attempt++
      if (attempt >= maxRetries) {
        console.error(
          `   ❌ Database kayıt hatası (${productData.id}) - ${maxRetries} deneme sonrası:`,
          error.message,
        )
        throw error
      } else {
        console.log(
          `   🔄 Database hata, tekrar denenecek (${
            maxRetries - attempt
          } kalan): ${error.message}`,
        )
        await delay(1000 * attempt) // Exponential backoff
      }
    }
  }
}

// Batch işleme - Optimized with Worker Pool
async function processBatch(
  productIds: number[],
  categoryId: number,
  brand: string,
  batchIndex: number,
  totalBatches: number
): Promise<{ success: number; failure: number }> {
  console.log(`   🔄 Batch ${batchIndex + 1}/${totalBatches} işleniyor (${productIds.length} ürün)`)

             // Worker pool ile paralel işleme (12 paralel worker - daha konservatif)
           const workerPool = new WorkerPool(12)
  
  const promises = productIds.map(async (productId) => {
    return workerPool.addTask(async () => {
      try {
        const result = await processProduct(productId, categoryId, brand)
        return result ? 'success' : 'failure'
      } catch (error) {
        console.error(`   ❌ Ürün işleme hatası (${productId}):`, error)
        return 'failure'
      }
    })
  })

  const results = await Promise.allSettled(promises)
  await workerPool.waitForAll()
  
  const success = results.filter(r => r.status === 'fulfilled' && r.value === 'success').length
  const failure = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value === 'failure')).length

  console.log(`   ✅ Batch ${batchIndex + 1} tamamlandı: ${success} başarılı, ${failure} başarısız`)
  return { success, failure }
}

// Kategorideki ürünleri işle
async function processCategoryProducts(
  categoryId: number,
  brand: string,
): Promise<void> {
  try {
    console.log(`\n🎯 Kategori işleniyor: ${categoryId} (${brand})`)

    // Kategoriden ürün ID'lerini al
    const category = await prisma.subCategory.findUnique({
      where: { categoryId },
    })

    if (!category || !category.isLeaf) {
      console.log(`   ⚠️  Kategori leaf değil veya bulunamadı: ${categoryId}`)
      return
    }

    // Cache kontrolü - ürün ID'leri
    const cache = await getCache()
    const productIdsCacheKey = cacheKeys.productIds(categoryId, brand)
    let productIds: number[] = await cache.get<number[]>(productIdsCacheKey) || []

    if (productIds.length === 0) {
      console.log(`   🔍 ${brand} API'den ürün ID'leri çekiliyor...`)
      
      if (brand === 'ZARA') {
        productIds = await fetchZaraProductIds(categoryId, BRAND_CONFIG.ZARA.headers)
      } else if (brand === 'PULL&BEAR') {
        productIds = await fetchPullBearProductIds(categoryId, BRAND_CONFIG.PULLANDBEAR.headers)
      }

      // Cache'e kaydet
      if (productIds.length > 0) {
        await cache.set(productIdsCacheKey, productIds, CACHE_TTL)
        console.log(`   💾 Ürün ID'leri cache'e kaydedildi`)
      }
    } else {
      console.log(`   📋 Cache'den ${productIds.length} ürün ID'si alındı`)
    }

    if (productIds.length === 0) {
      console.log(`   ⚠️  Kategoride ürün bulunamadı: ${categoryId}`)
      return
    }

    console.log(`   📋 ${productIds.length} ürün bulundu`)

    // Tüm ürünleri işle - LIMITSIZ
    const limitedProductIds = productIds // Tüm ürünleri al
    console.log(
      `   🚀 TÜM ÜRÜNLER: ${limitedProductIds.length}/${productIds.length} ürün işlenecek`,
    )

    // Batch boyutu: 20 (daha konservatif)
    const batchSize = 20
    const batches = chunkArray(limitedProductIds, batchSize)

    let totalSuccess = 0
    let totalFailure = 0

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      if (!batch) continue

      const { success, failure } = await processBatch(
        batch,
        category.categoryId,
        category.brand,
        i,
        batches.length
      )

      totalSuccess += success
      totalFailure += failure

      // Rate limiter istatistiklerini logla
      console.log(`   📊 Rate Limiter Stats:`, {
        ZARA: rateLimiters.ZARA.getStats(),
        PULLANDBEAR: rateLimiters['PULL&BEAR'].getStats()
      })

      // Batch'ler arası bekleme (daha uzun)
      if (i < batches.length - 1) {
        const waitTime = 1000 // Increased from 500
        await delay(waitTime + Math.random() * 1000) // Increased jitter
      }
    }

    console.log(
      `   ✅ Kategori tamamlandı: ${totalSuccess} başarılı, ${totalFailure} başarısız`,
    )
  } catch (error: any) {
    console.error(`Kategori işleme hatası (${categoryId}):`, error.message)
  }
}

// Tüm leaf kategorilerdeki ürünleri işle
export async function saveProductsToDatabase(forceUpdate: boolean = false): Promise<void> {
  try {
    console.log("🚀 Ürün detayları database'e aktarılıyor...\n")

    // Ürünler zaten var mı kontrol et (sadece ilk kurulumda)
    const existingProducts = await prisma.product.count()
    if (existingProducts > 0 && !forceUpdate) {
      console.log(
        `✅ Ürünler zaten mevcut (${existingProducts} adet). İşlem atlanıyor.`,
      )
      return
    }

    if (forceUpdate) {
      console.log(`🔄 Güncelleme modu: ${existingProducts} mevcut ürün güncellenecek`)
    }

    // Tüm kategorileri işle - LIMITSIZ
    const [zaraCategories, pullBearCategories] = await Promise.all([
      prisma.subCategory.findMany({
        where: {
          brand: 'ZARA',
          isLeaf: true,
        },
        orderBy: [
          { productCount: 'desc' }, // En büyük kategorilerden başla
          { categoryName: 'asc' }
        ],
      }),
      prisma.subCategory.findMany({
        where: {
          brand: 'PULL&BEAR',
          isLeaf: true,
        },
        orderBy: [
          { productCount: 'desc' }, // En büyük kategorilerden başla
          { categoryName: 'asc' }
        ],
      })
    ])

    const leafCategories = [...zaraCategories, ...pullBearCategories]

    console.log(
      `📊 ${leafCategories.length} leaf kategori seçildi (TÜM KATEGORİLER - her kategoriden TÜM ÜRÜNLER)\n`,
    )

    // Kategorileri marka bazında grupla
    const categoriesByBrand = leafCategories.reduce((acc, category) => {
      if (!acc[category.brand]) {
        acc[category.brand] = []
      }
      acc[category.brand]!.push(category)
      return acc
    }, {} as Record<string, typeof leafCategories>)

    // Her marka için paralel işlem başlat
    const brandPromises = Object.entries(categoriesByBrand).map(async ([brand, categories]) => {
      console.log(`\n🏪 ${brand} markası işleniyor...`)
      
      let brandSuccess = 0
      let brandFailure = 0

      // Her marka için kategorileri sırayla işle
      for (let i = 0; i < categories.length; i++) {
        const category = categories[i]
        if (!category) continue
        
        console.log(
          `\n[${i + 1}/${categories.length}] 🎯 Kategori: ${category.categoryName}`,
        )
        console.log(`   📦 Ürün sayısı: ${category.productCount}`)

        await processCategoryProducts(category.categoryId, category.brand)

        // Kategoriler arası bekleme (marka içinde)
        if (i < categories.length - 1) {
          console.log(`   ⏱️  Sonraki kategori için bekleniyor...`)
          await delay(1000) // Çok kısa bekleme
        }
      }

      return { brand, success: brandSuccess, failure: brandFailure }
    })

    // Tüm markaların işlemlerini bekle
    const results = await Promise.all(brandPromises)

    // Özet bilgi
    const totalProducts = await prisma.product.count()
    console.log(`\n🎉 Ürün aktarımı tamamlandı!`)
    console.log(`📊 Toplam database'deki ürün sayısı: ${totalProducts}`)

    // Marka bazında özet
    results.forEach(({ brand, success, failure }) => {
      console.log(`   • ${brand}: ${success} başarılı, ${failure} başarısız`)
    })
  } catch (error: any) {
    console.error('Ürün aktarım hatası:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Belirli bir kategorinin ürünlerini işle (test için)
export async function saveProductsByCategoryId(
  categoryId: number,
): Promise<void> {
  try {
    const category = await prisma.subCategory.findUnique({
      where: { categoryId },
    })

    if (!category) {
      throw new Error(`Kategori bulunamadı: ${categoryId}`)
    }

    await processCategoryProducts(categoryId, category.brand)
  } catch (error: any) {
    console.error('Kategori ürün aktarım hatası:', error.message)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}
