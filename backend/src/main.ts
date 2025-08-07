import { saveCategoriesDatabase } from './services/categoryService'
import { saveProductsToDatabase } from './services/productService'
import prisma from './lib/prisma'

async function showStatus() {
  const categoriesCount = await prisma.subCategory.count()
  const productsCount = await prisma.product.count()
  const brandsCount = await prisma.brand.count()

  console.log('\n📊 Database Durumu:')
  console.log(`   🏷️  Markalar: ${brandsCount}`)
  console.log(`   📁 Kategoriler: ${categoriesCount}`)
  console.log(`   📦 Ürünler: ${productsCount}`)
  console.log('')
}

async function main() {
  console.log('🚀 Simple Project - Data Pipeline başlatılıyor...\n')

  // Mevcut durumu göster
  await showStatus()

  // 1. Kategorileri direkt API'den çekip database'e kaydet
  console.log("💾 1. Kategorileri APIden çekip database'e kaydet...")
  await saveCategoriesDatabase()

  // 2. Ürün detaylarını leaf kategorilerden çekip database'e kaydet
  console.log(
    "\n📦 2. Ürün detaylarını leaf kategorilerden çekip database'e kaydet...",
  )
  await saveProductsToDatabase()

  // Final durumu göster
  console.log('\n🎉 İşlemler tamamlandı!')
  await showStatus()
}

main().catch(console.error)
