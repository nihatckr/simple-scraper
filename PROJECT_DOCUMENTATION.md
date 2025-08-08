# Simple Project - E-Ticaret Veri Pipeline ve Dashboard Sistemi

## 📋 Proje Genel Bakış

Bu proje, Zara ve Pull&Bear e-ticaret sitelerinden veri çekme, işleme, saklama ve analiz etme amacıyla geliştirilmiş kapsamlı bir veri pipeline ve dashboard sistemidir. Sistem, markalar arası çapraz istatistikler ve karşılaştırmalar sunan modern bir web arayüzü ile birlikte gelir.

### 🎯 Ana Hedefler
- **Veri Toplama**: Zara ve Pull&Bear'dan kategori ve ürün verilerinin otomatik çekimi
- **Veri İşleme**: Ham verilerin normalize edilmesi ve yapılandırılması
- **Veri Saklama**: MySQL veritabanında ilişkisel veri modeli ile saklama
- **Veri Analizi**: Markalar arası karşılaştırmalar ve istatistikler
- **Dashboard**: Modern web arayüzü ile veri görselleştirme

### 🏗️ Mimari Yapı
```
simple-project/
├── backend/          # Node.js/TypeScript API ve veri pipeline
├── frontend/         # Next.js/React dashboard
├── docker-compose.yml # Veritabanı container'ı
└── README.md
```

---

## 🔧 Backend Sistemi

### Teknoloji Stack
- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL + Prisma ORM
- **Cache**: Redis
- **Scheduling**: node-cron
- **HTTP Client**: Native fetch API

### 📁 Dizin Yapısı
```
backend/
├── src/
│   ├── api/              # REST API endpoints
│   ├── config/           # Konfigürasyon dosyaları
│   ├── jobs/             # Zamanlanmış görevler
│   ├── lib/              # Yardımcı kütüphaneler
│   ├── scraper/          # Veri çekme modülleri
│   ├── services/         # İş mantığı servisleri
│   ├── scripts/          # Yardımcı scriptler
│   ├── main.ts           # Ana veri pipeline
│   ├── server.ts         # API sunucusu
│   └── reset.ts          # Veritabanı sıfırlama
├── prisma/
│   ├── schema.prisma     # Veritabanı şeması
│   └── migrations/       # Veritabanı migrasyonları
└── package.json
```

### 🗄️ Veritabanı Şeması

#### Ana Modeller

**Brand (Markalar)**
```prisma
model Brand {
  id             String          @id
  name           String          @unique
  timestamp      DateTime        @default(now())
  mainCategories MainCategory[]
  products       Product[]
}
```

**MainCategory (Ana Kategoriler - ERKEK/KADIN)**
```prisma
model MainCategory {
  id            Int               @id
  name          String            // ERKEK, KADIN
  brand         Brand             @relation(fields: [brandId], references: [id])
  brandId       String
  gender        String
  level         Int               @default(0)
  subcategories SubCategory[]
}
```

**SubCategory (Alt Kategoriler - Recursive Yapı)**
```prisma
model SubCategory {
  categoryId       Int               @id
  categoryName     String
  brand            String
  gender           String
  level            Int
  isLeaf           Boolean           @default(false)
  matchingId       Int?
  productCount     Int?
  
  // Self-referential relationship
  parentSubCategory   SubCategory?  @relation("SubCategoryHierarchy")
  parentSubCategoryId Int?
  subcategories       SubCategory[] @relation("SubCategoryHierarchy")
  
  // Product relation
  products            Product[]     @relation("SubCategoryProducts")
  
  // History tracking
  history            CategoryHistory[]
}
```

**Product (Ürünler)**
```prisma
model Product {
  id              Int           @id @default(autoincrement())
  brand           Brand         @relation(fields: [brandName], references: [name])
  brandName       String
  productId       Int           @unique
  name            String
  price           Int?          // Kuruş cinsinden
  description     String?       @db.Text
  
  // Normalize yapısına uygun relations
  colors          ProductColor[]
  images          ProductImage[]
  sizes           ProductSize[]
  stock           ProductStock[]

  // Category relation
  subCategories   SubCategory[] @relation("SubCategoryProducts")
  
  // History tracking
  priceHistory    PriceHistory[]
  stockHistory    StockHistory[]
}
```

#### Detay Modeller

**ProductColor (Ürün Renkleri)**
```prisma
model ProductColor {
  id          Int           @id @default(autoincrement())
  colorId     String        // API'den gelen orijinal color ID
  name        String
  hexCode     String?
  price       Int?          // Renk bazlı fiyat
  description String?       @db.Text
  
  product     Product       @relation(fields: [productId], references: [id])
  productId   Int
  
  // Her rengin kendi resimleri, bedenleri ve stok bilgileri
  images      ProductImage[]
  sizes       ProductSize[]
  stock       ProductStock[]
  
  // History relations
  priceHistory PriceHistory[]
  stockHistory StockHistory[]
  
  @@unique([productId, colorId])
}
```

**ProductSize (Ürün Bedenleri)**
```prisma
model ProductSize {
  id           Int           @id @default(autoincrement())
  sizeId       Int           // API'den gelen orijinal size ID
  name         String        // S, M, L, XL
  availability String        // "in_stock", "out_of_stock"
  price        Int?          // Kuruş cinsinden
  sku          Int?          // SKU numarası
  
  product      Product       @relation(fields: [productId], references: [id])
  productId    Int
  
  color        ProductColor? @relation(fields: [colorId], references: [id])
  colorId      Int?
  colorName    String?
}
```

**ProductImage (Ürün Resimleri)**
```prisma
model ProductImage {
  id          Int           @id @default(autoincrement())
  url         String        @db.Text
  type        String        // "image"
  kind        String        // "full", "other", "plain", "main", "aux"
  order       Int           @default(0)
  
  product     Product       @relation(fields: [productId], references: [id])
  productId   Int
  
  color       ProductColor? @relation(fields: [colorId], references: [id])
  colorId     Int?
  colorName   String?
  colorIndex  Int?
}
```

**ProductStock (Ürün Stok Bilgileri)**
```prisma
model ProductStock {
  id           Int           @id @default(autoincrement())
  sizeId       Int
  name         String
  availability String        // "in_stock", "out_of_stock"
  price        Int?
  sku          Int?
  
  product      Product       @relation(fields: [productId], references: [id])
  productId    Int
  
  color        ProductColor? @relation(fields: [colorId], references: [id])
  colorId      Int?
  colorName    String?
}
```

#### Geçmiş Takip Modelleri

**PriceHistory (Fiyat Geçmişi)**
```prisma
model PriceHistory {
  id          Int      @id @default(autoincrement())
  productId   Int
  product     Product  @relation(fields: [productId], references: [id])
  price       Int      // Kuruş cinsinden
  colorId     Int?     // Hangi renk varyantı
  color       ProductColor? @relation(fields: [colorId], references: [id])
  timestamp   DateTime @default(now())
  
  @@index([productId, timestamp])
}
```

**StockHistory (Stok Geçmişi)**
```prisma
model StockHistory {
  id          Int      @id @default(autoincrement())
  productId   Int
  product     Product  @relation(fields: [productId], references: [id])
  sizeId      Int
  colorId     Int?
  color       ProductColor? @relation(fields: [colorId], references: [id])
  available   Boolean
  timestamp   DateTime @default(now())
  
  @@index([productId, timestamp])
}
```

**CategoryHistory (Kategori Geçmişi)**
```prisma
model CategoryHistory {
  id          Int      @id @default(autoincrement())
  categoryId  Int
  category    SubCategory @relation(fields: [categoryId], references: [categoryId])
  action      String   // 'added', 'removed', 'modified'
  changes     Json?    // Değişiklik detayları
  timestamp   DateTime @default(now())
  
  @@index([categoryId, timestamp])
}
```

### 🔄 Veri Pipeline Akışı

#### 1. Kategori Çekme Süreci
```typescript
// src/scraper/categories.ts
export async function fetchBrandData(brandName: string, url: string, headers: Record<string, string>)
export async function fetchZaraProductIds(categoryId: number, headers: Record<string, string>)
export async function fetchPullBearProductIds(categoryId: number, headers: Record<string, string>)
export async function processAllCategories(categories: any[], brandName: string, genderName: string)
export async function structureBrandData(brandName: string, brandConfig: any, rawData: any)
export async function saveCategoryData()
```

#### 2. Ürün Detay Çekme Süreci
```typescript
// src/scraper/productDetails.ts
async function fetchZaraExtraDetails(productId: number)
async function fetchZaraProductDetails(productId: number)
async function fetchPullBearProductDetails(productId: number)
function normalizeProductData(productData: any, brand: string)
export async function saveNormalizedProductDetails()
```

#### 3. Veri Normalizasyon
- **Null/Undefined Temizleme**: `removeNullValues()` fonksiyonu
- **API Veri Yapısı Standardizasyonu**: Her marka için özel parser
- **İlişkisel Veri Modeli**: Prisma şemasına uygun dönüşüm
- **Fallback Değerler**: Eksik veriler için varsayılan değerler

### 🚀 API Endpoints

#### Health & Status
- `GET /api/health` - Sistem sağlık kontrolü
- `GET /api/stats/overview` - Genel istatistikler

#### Brands & Categories
- `GET /api/brands` - Markalar listesi (hierarchical)
- `GET /api/categories` - Kategoriler (filtrelenebilir)

#### Products
- `GET /api/products` - Ürünler listesi (sayfalanabilir, filtrelenebilir)
- `GET /api/products/:productId` - Tek ürün detayı

#### History & Analytics
- `GET /api/products/:productId/price-history` - Fiyat geçmişi
- `GET /api/products/:productId/stock-history` - Stok geçmişi
- `GET /api/categories/:categoryId/history` - Kategori geçmişi

### ⚙️ Konfigürasyon

#### Environment Variables
```bash
# Database
DATABASE_URL=mysql://root:1234@localhost:3306/simple_project

# API Configuration
PORT=3000
NODE_ENV=development|production
MAX_RETRIES=3
RETRY_DELAY=1000
REQUEST_TIMEOUT=30000

# Database Configuration
DB_CONNECTION_TIMEOUT=60000
DB_POOL_SIZE=10

# Batch Processing
BATCH_SIZE=100
PRODUCT_LIMIT_DEV=3
PRODUCT_LIMIT_PROD=50
```

#### Brand Configuration
```typescript
// src/config/index.ts
export const BRAND_CONFIG = {
  ZARA: {
    baseUrl: 'https://www.zara.com/tr/tr',
    endpoints: {
      categories: '/categories?ajax=true',
      products: '/products-details?productIds={id}&ajax=true',
      extraDetail: '/product/{id}/extra-detail?ajax=true'
    },
    headers: { /* ... */ }
  },
  'PULL&BEAR': {
    baseUrl: 'https://www.pullandbear.com',
    endpoints: {
      categories: '/itxrest/3/catalog/store/25009521/20309457/category/{id}/product',
      products: '/itxrest/3/catalog/store/25009521/20309457/product/{id}/detail'
    },
    headers: { /* ... */ }
  }
}
```

### 🔄 Zamanlanmış Görevler

#### Weekly Sync Job
```typescript
// src/jobs/weekly-sync.ts
export function startWeeklySync() {
  cron.schedule('0 2 * * 0', async () => { // Her Pazar 02:00
    await performWeeklySync()
  })
}
```

#### Health Monitoring
```typescript
// src/lib/health.ts
export async function performHealthCheck() {
  return {
    status: 'healthy' | 'unhealthy',
    timestamp: new Date(),
    checks: {
      database: { status: 'pass' | 'fail', responseTime: number },
      environment: { status: 'pass' | 'fail' },
      disk: { status: 'pass' | 'fail' }
    }
  }
}
```

### 🛠️ Utility Functions

#### Retry Mechanism
```typescript
// src/lib/retry.ts
export async function fetchWithRetry(url: string, options?: RequestInit, maxRetries = 3)
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3)
```

#### Caching
```typescript
// src/lib/redis-cache.ts
export async function getCache()
export async function setCache(key: string, value: any, ttl: number)
export async function getCache(key: string)
```

---

## 🎨 Frontend Sistemi

### Teknoloji Stack
- **Framework**: Next.js 15.4.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: Zustand
- **Charts**: Recharts
- **HTTP Client**: Native fetch API

### 📁 Dizin Yapısı
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── dashboard/       # Dashboard sayfaları
│   │   ├── globals.css      # Global stiller
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Ana sayfa (redirect)
│   ├── components/          # React bileşenleri
│   │   ├── ui/              # shadcn/ui bileşenleri
│   │   └── dashboard/       # Dashboard özel bileşenleri
│   ├── lib/                 # Yardımcı fonksiyonlar
│   └── store/               # Zustand state management
├── public/                  # Statik dosyalar
└── package.json
```

### 🎯 Ana Özellikler

#### 1. Dashboard Overview
- **Genel İstatistikler**: Marka, kategori, ürün sayıları
- **Real-time Data**: API'den canlı veri çekimi
- **Responsive Design**: Mobil uyumlu tasarım

#### 2. Veri Görselleştirme
- **Overview Cards**: Temel metrikler
- **Charts & Graphs**: Recharts ile grafikler
- **Data Tables**: Filtrelenebilir tablolar

#### 3. Filtreleme ve Arama
- **Brand Filter**: Marka bazlı filtreleme
- **Category Filter**: Kategori bazlı filtreleme
- **Search**: Ürün arama
- **Advanced Filters**: Gelişmiş filtreleme seçenekleri

### 🔧 Bileşen Yapısı

#### UI Components (shadcn/ui)
```typescript
// Temel bileşenler
- Button
- Card
- Table
- Tabs
- Badge
- DropdownMenu
- Input
- Select
- Skeleton
- Separator
```

#### Dashboard Components
```typescript
// src/components/dashboard/overview-cards.tsx
export function OverviewCards({ stats }: Props) {
  // Marka, kategori, ürün sayılarını gösteren kartlar
}

// src/components/dashboard/product-table.tsx
export function ProductTable({ products, filters }: Props) {
  // Ürün listesi tablosu
}

// src/components/dashboard/analytics-charts.tsx
export function AnalyticsCharts({ data }: Props) {
  // İstatistik grafikleri
}
```

### 📊 State Management

#### Zustand Store
```typescript
// src/store/filters.ts
export type Filters = {
  brand?: string
  categoryId?: number
  search?: string
}

export const useFilters = create<State>((set) => ({
  brand: undefined,
  categoryId: undefined,
  search: '',
  set: (patch) => set(patch),
  reset: () => set({ brand: undefined, categoryId: undefined, search: '' }),
}))
```

### 🌐 API Integration

#### API Helper
```typescript
// src/lib/api.ts
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'

export async function apiGet<T>(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, { ...init, cache: 'no-store' })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json() as Promise<T>
}
```

### 🎨 Styling & Design

#### Tailwind CSS Configuration
```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { /* ... */ },
        secondary: { /* ... */ },
        destructive: { /* ... */ },
        muted: { /* ... */ },
        accent: { /* ... */ },
        popover: { /* ... */ },
        card: { /* ... */ },
      }
    }
  }
}
```

#### shadcn/ui Configuration
```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "gray",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

---

## 🔄 Sistem Entegrasyonu

### Veri Akışı
```
1. Scraper → API Endpoints → Database
2. Database → API Endpoints → Frontend
3. Frontend → User Interface → Analytics
```

### API Communication
- **Backend**: http://localhost:3000/api
- **Frontend**: http://localhost:3001
- **CORS**: Cross-origin requests enabled
- **Error Handling**: Comprehensive error responses

### Environment Setup
```bash
# Backend
cd backend
npm install
cp .env.example .env
# DATABASE_URL ve diğer env değişkenlerini ayarla
npm run db:migrate
npm run dev:server

# Frontend
cd frontend
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL ayarla
npm run dev
```

---

## 📈 Özellikler ve Yetenekler

### 🔍 Veri Çekme Özellikleri
- **Multi-Brand Support**: Zara ve Pull&Bear
- **Hierarchical Categories**: Recursive kategori yapısı
- **Product Details**: Tam ürün detayları (renk, beden, resim, stok)
- **Price Tracking**: Fiyat geçmişi takibi
- **Stock Monitoring**: Stok durumu izleme
- **Image Management**: Ürün resimleri yönetimi

### 📊 Analitik Özellikler
- **Cross-Brand Comparison**: Markalar arası karşılaştırma
- **Price Analysis**: Fiyat analizi ve trendler
- **Stock Analysis**: Stok analizi
- **Category Analytics**: Kategori bazlı analizler
- **Historical Data**: Geçmiş veri analizi

### 🎯 Dashboard Özellikleri
- **Real-time Updates**: Canlı veri güncellemeleri
- **Interactive Filters**: Etkileşimli filtreler
- **Responsive Design**: Mobil uyumlu tasarım
- **Data Visualization**: Grafik ve tablolar
- **Export Capabilities**: Veri dışa aktarma

### 🔧 Teknik Özellikler
- **Type Safety**: Tam TypeScript desteği
- **Error Handling**: Kapsamlı hata yönetimi
- **Caching**: Redis tabanlı önbellekleme
- **Scheduling**: Otomatik veri senkronizasyonu
- **Health Monitoring**: Sistem sağlık kontrolü
- **Logging**: Detaylı loglama sistemi

---

## 🚀 Gelecek Geliştirmeler

### Planlanan Özellikler
1. **Real-time Notifications**: Fiyat değişikliği bildirimleri
2. **Advanced Analytics**: Makine öğrenmesi tabanlı analizler
3. **Mobile App**: React Native mobil uygulama
4. **API Rate Limiting**: Gelişmiş API koruması
5. **Multi-language Support**: Çoklu dil desteği
6. **Export Features**: PDF/Excel dışa aktarma
7. **User Authentication**: Kullanıcı girişi ve yetkilendirme
8. **Webhook Integration**: Dış sistem entegrasyonları

### Performans İyileştirmeleri
1. **Database Optimization**: Veritabanı performans optimizasyonu
2. **Caching Strategy**: Gelişmiş önbellekleme stratejisi
3. **CDN Integration**: İçerik dağıtım ağı entegrasyonu
4. **Load Balancing**: Yük dengeleme
5. **Microservices**: Mikroservis mimarisine geçiş

---

## 📝 Kullanım Kılavuzu

### Kurulum
```bash
# 1. Repository'yi klonla
git clone <repository-url>
cd simple-project

# 2. Backend kurulumu
cd backend
npm install
cp .env.example .env
# .env dosyasını düzenle
npm run db:migrate
npm run dev:server

# 3. Frontend kurulumu
cd ../frontend
npm install
cp .env.example .env.local
# .env.local dosyasını düzenle
npm run dev
```

### Veri Çekme
```bash
# Kategorileri çek
cd backend
npm run start:categories

# Ürünleri çek (test)
npm run start:test-sync

# Tüm ürünleri çek
npm run start:full-sync
```

### API Kullanımı
```bash
# Sağlık kontrolü
curl http://localhost:3000/api/health

# Genel istatistikler
curl http://localhost:3000/api/stats/overview

# Markalar
curl http://localhost:3000/api/brands

# Ürünler
curl http://localhost:3000/api/products?brand=ZARA&page=1&limit=20
```

### Dashboard Erişimi
- **URL**: http://localhost:3001/dashboard
- **Ana Sayfa**: Otomatik olarak dashboard'a yönlendirir
- **Responsive**: Mobil ve desktop uyumlu

---

## 🔧 Sorun Giderme

### Yaygın Sorunlar

#### 1. Database Connection
```bash
# MySQL servisini kontrol et
brew services list | grep mysql

# Bağlantıyı test et
mysql -u root -p1234 -h localhost -P 3306 simple_project
```

#### 2. API Errors
```bash
# Backend loglarını kontrol et
tail -f backend/api.log

# Health check
curl http://localhost:3000/api/health
```

#### 3. Frontend Build Errors
```bash
# Dependencies'leri temizle
cd frontend
rm -rf node_modules package-lock.json
npm install

# Build'i yeniden dene
npm run build
```

#### 4. Scraping Issues
```bash
# API rate limiting
# User-Agent header'larını kontrol et
# Network connectivity'yi test et
```

### Debug Modları
```bash
# Backend debug
NODE_ENV=development npm run dev:server

# Frontend debug
npm run dev -- --debug
```

---

## 📊 Performans Metrikleri

### Veri Boyutları
- **Categories**: ~212 alt kategori
- **Products**: ~1,730 ürün
- **Images**: ~5,000+ resim
- **Price History**: Sürekli artan veri

### API Performance
- **Response Time**: < 200ms (ortalama)
- **Throughput**: 1000+ requests/minute
- **Uptime**: 99.9% (hedef)

### Database Performance
- **Query Time**: < 50ms (ortalama)
- **Storage**: ~500MB (tahmini)
- **Indexes**: Optimized for common queries

---

## 🔒 Güvenlik

### API Security
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Giriş verisi doğrulama
- **Error Handling**: Güvenli hata mesajları
- **Rate Limiting**: API rate limiting (planlanan)

### Data Security
- **Database**: MySQL authentication
- **Environment Variables**: Hassas veriler .env dosyalarında
- **Logging**: Güvenli loglama

---

## 📞 Destek ve İletişim

### Dokümantasyon
- **API Docs**: Swagger/OpenAPI (planlanan)
- **Code Comments**: Kapsamlı kod açıklamaları
- **README**: Detaylı kurulum kılavuzu

### Monitoring
- **Health Checks**: Otomatik sağlık kontrolü
- **Logging**: Structured logging
- **Error Tracking**: Hata takibi (planlanan)

---

Bu dokümantasyon, projenin mevcut durumunu ve gelecek planlarını kapsamlı bir şekilde açıklamaktadır. Sistem sürekli geliştirilmekte ve yeni özellikler eklenmektedir.
