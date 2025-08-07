# 🛒 Simple Project - E-ticaret Veri Pipeline

Bu proje, **Zara** ve **Pull&Bear** e-ticaret sitelerinden kategori ve ürün verilerini çeker, normalize eder ve veritabanına kaydeder. Production-ready bir veri pipeline sistemidir.

## 🎯 Özellikler

### ✅ **Kategori Sistemi (v2.0)**
- Hiyerarşik kategori yapısını çeker ve veritabanına kaydeder
- Zara ve Pull&Bear kategorilerini eşleştirir
- Leaf kategorilerden ürün verilerini otomatik çeker

### ✅ **Ürün Detay Sistemi (v2.0)**
- Tam ürün detaylarını API'lerden çeker
- Normalized veri yapısında veritabanına kaydeder
- Renkler, görseller, bedenler ve stok bilgilerini ayrı tablolarda tutar
- Production ortamında batch processing ile yüksek performans

### ✅ **Veritabanı Entegrasyonu**
- Prisma ORM ile MySQL veritabanı
- Normalized schema yapısı
- Transaction güvenliği
- Batch operations ve hata yönetimi

### ✅ **Production Özellikleri**
- Environment-based configuration
- Retry mechanisms with exponential backoff
- Batch processing for better performance
- Comprehensive error handling
- Color relation mapping (string→int)
 
## 🏗️ Teknoloji Stack

- **Node.js** >= 16.0.0
- **TypeScript** >= 4.5.0  
- **Prisma ORM** - Veritabanı yönetimi
- **MySQL** - Ana veritabanı
- **Zod** - Veri validasyonu

## 📊 Veritabanı Yapısı

### **Ana Tablolar**
- `Brand` - Marka bilgileri (Zara, Pull&Bear)
- `MainCategory` - Ana kategoriler (Kadın, Erkek, etc.)
- `SubCategory` - Alt kategoriler (Elbise, Pantolon, etc.)
- `Product` - Ürün temel bilgileri
- `ProductColor` - Ürün renk varyasyonları
- `ProductImage` - Ürün görselleri
- `ProductSize` - Ürün bedenleri
- `ProductStock` - Stok bilgileri

### **İlişkiler**
- Normalized yapı ile proper foreign key relations
- Color relations: string→int mapping sistemi
- Cascade delete operations
- Index optimizations for better performance


## � Kurulum ve Çalıştırma

### **1. Bağımlılıkları Yükle**
```bash
npm install
```

### **2. Veritabanı Kurulumu**
```bash
# Prisma migrasyonları çalıştır
npx prisma migrate dev

# Prisma client generate et
npx prisma generate
```

### **3. Çalıştırma**

#### **Development Mode**
```bash
npm run dev
```

#### **Production Mode**
```bash
NODE_ENV=production npm run dev
```

#### **Veritabanını Temizle**
```bash
npm run reset
```

## 🔗 API Endpoint'leri

### **Zara API'ları**
- **Kategoriler:** `https://www.zara.com/tr/tr/categories?ajax=true`
- **Ürün ID'leri:** `https://www.zara.com/tr/tr/category/{categoryId}/products?ajax=true`
- **Ürün Detayları:** `https://www.zara.com/tr/tr/products-details?productIds={productId}&ajax=true`

### **Pull&Bear API'ları**
- **Kategoriler:** `https://www.pullandbear.com/itxrest/2/catalog/store/25009621/30359503/category?languageId=-17&appId=1`
- **Ürün ID'leri:** `https://www.pullandbear.com/itxrest/2/catalog/store/25009621/30359503/category/{categoryId}/product?languageId=-17&appId=1`
- **Ürün Detayları:** `https://www.pullandbear.com/itxrest/2/catalog/store/25009621/30359503/category/0/product/{productId}/detail?languageId=-17&appId=1`

## 📈 Performance Özellikleri

### **Environment-based Scaling**
- **Development:** 3 ürün per kategori (hızlı test)
- **Production:** 50 ürün per kategori (full scale)

### **Batch Operations**
- `createMany()` operations for better performance
- Transaction safety with rollback support
- Exponential backoff retry mechanism

### **Error Handling**
- Comprehensive try-catch blocks
- Retry logic for API failures
- Graceful degradation for missing data

## 🔧 Production Optimizations

- **Color Mapping System:** API string colorId → Database integer mapping
- **Batch Processing:** Multiple records inserted in single operations
- **Memory Management:** Efficient data processing with controlled limits
- **Error Recovery:** Automatic retry with exponential backoff
- **Transaction Safety:** Database consistency with rollback support
## 📋 Veri Akış Süreçleri

### **1. Kategori Pipeline**
```
API'den kategoriler → Normalize → Database'e kaydet
├── Zara kategorileri
├── Pull&Bear kategorileri  
└── Kategori eşleştirmeleri
```

### **2. Ürün Pipeline**
```
Leaf kategoriler → Ürün ID'leri → Detay API → Normalize → Database
├── Product temel bilgileri
├── ProductColor (renk varyasyonları)
├── ProductImage (görseller)
├── ProductSize (bedenler)
└── ProductStock (stok durumu)
```

## 📊 Database Schema Örneği

### **Product Table**
```sql
Product {
  id          String     @id
  name        String
  price       String
  sectionId   Int?
  familyId    Int?
  subfamilyId Int?
  brandId     Int
  categoryId  Int
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}
```

### **ProductColor Table**
```sql
ProductColor {
  id          Int      @id @default(autoincrement())
  productId   String
  colorName   String?
  hexCode     String?
  createdAt   DateTime @default(now())
}
```

### **Normalized Data Structure**
Tüm veriler normalize edilmiş yapıda saklanır:
- Proper foreign key relationships
- No data duplication  
- Optimized for queries
- Scalable architecture

## 🎯 Gelecek Özellikler

- [ ] Real-time data synchronization
- [ ] Advanced filtering and search
- [ ] Price tracking and history
- [ ] Stock level monitoring
- [ ] Multi-language support
- [ ] API rate limiting optimization

---

**Son Güncelleme:** 7 Ağustos 2025  
**Versiyon:** 2.0 (Production Ready)# simple-scraper
