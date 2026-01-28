// Quick connection test script
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@'))
    
    // Simple query to test connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Connection successful!')
    console.log('Result:', result)
    
    // Try to count users
    const userCount = await prisma.user.count()
    console.log(`✅ Database accessible! Current users: ${userCount}`)
    
  } catch (error) {
    console.error('❌ Connection failed:')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n💡 Troubleshooting tips:')
      console.log('1. Check if Supabase project is active (not paused)')
      console.log('2. Verify database password in .env.local')
      console.log('3. Get connection string from Supabase Dashboard → Settings → Database')
      console.log('4. Check if connection string format is correct')
    }
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
