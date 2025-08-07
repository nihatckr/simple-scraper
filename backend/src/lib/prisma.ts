import { PrismaClient } from '../generated/prisma'

const prisma = new PrismaClient()

export default prisma

// Test database connection
async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Database connected successfully!')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Uncomment to test connection
// testConnection()
