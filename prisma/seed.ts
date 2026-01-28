import { PrismaClient, UserRole, UserStatus, GovernanceState, FeatureState, PriorityLevel } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...')
  await prisma.auditLog.deleteMany()
  await prisma.document.deleteMany()
  await prisma.featureContributorAssignment.deleteMany()
  await prisma.productManagerAssignment.deleteMany()
  await prisma.feature.deleteMany()
  await prisma.release.deleteMany()
  await prisma.product.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemConfig.deleteMany()

  // Hash passwords
  const adminPassword = await bcrypt.hash('Admin@123', 12)
  const userPassword = await bcrypt.hash('User@123', 12)

  console.log('👥 Creating users...')

  // Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@lean.com',
      passwordHash: adminPassword,
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Super Admin:', superAdmin.email)

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@lean.com',
      passwordHash: adminPassword,
      name: 'System Admin',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Admin:', admin.email)

  // Create Program Manager
  const programManager = await prisma.user.create({
    data: {
      email: 'pm.tnt@lean.com',
      passwordHash: userPassword,
      name: 'Program Manager TNT',
      role: UserRole.PROGRAM_MANAGER,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Program Manager:', programManager.email)

  // Create Product Managers
  const productManager1 = await prisma.user.create({
    data: {
      email: 'prodmgr1@lean.com',
      passwordHash: userPassword,
      name: 'Product Manager 1',
      role: UserRole.PRODUCT_MANAGER,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Product Manager 1:', productManager1.email)

  const productManager2 = await prisma.user.create({
    data: {
      email: 'prodmgr2@lean.com',
      passwordHash: userPassword,
      name: 'Product Manager 2',
      role: UserRole.PRODUCT_MANAGER,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Product Manager 2:', productManager2.email)

  // Create Contributors
  const contributor1 = await prisma.user.create({
    data: {
      email: 'contributor1@lean.com',
      passwordHash: userPassword,
      name: 'Contributor 1',
      role: UserRole.CONTRIBUTOR,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Contributor 1:', contributor1.email)

  const contributor2 = await prisma.user.create({
    data: {
      email: 'contributor2@lean.com',
      passwordHash: userPassword,
      name: 'Contributor 2',
      role: UserRole.CONTRIBUTOR,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Contributor 2:', contributor2.email)

  // Create Viewer
  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@lean.com',
      passwordHash: userPassword,
      name: 'Viewer User',
      role: UserRole.VIEWER,
      status: UserStatus.ACTIVE,
    },
  })
  console.log('✅ Created Viewer:', viewer.email)

  console.log('📊 Creating portfolios...')

  // Create Portfolios
  const portfolio1 = await prisma.portfolio.create({
    data: {
      name: 'Digital Transformation',
      code: 'DT',
      description: 'Portfolio for digital transformation initiatives',
      governanceState: GovernanceState.APPROVED,
      programManagerId: programManager.id,
      priority: PriorityLevel.HIGH,
      approvedAt: new Date(),
      approvedById: admin.id,
    },
  })
  console.log('✅ Created Portfolio:', portfolio1.name)

  const portfolio2 = await prisma.portfolio.create({
    data: {
      name: 'Customer Experience',
      code: 'CX',
      description: 'Portfolio for customer experience improvements',
      governanceState: GovernanceState.DRAFT,
      programManagerId: programManager.id,
      priority: PriorityLevel.MEDIUM,
    },
  })
  console.log('✅ Created Portfolio:', portfolio2.name)

  // Assign users to portfolio
  await prisma.user.update({
    where: { id: contributor1.id },
    data: { assignedPortfolioId: portfolio1.id },
  })

  console.log('🛍️ Creating products...')

  // Create Products
  const product1 = await prisma.product.create({
    data: {
      portfolioId: portfolio1.id,
      name: 'Mobile Banking App',
      code: 'MBA',
      description: 'Next-generation mobile banking application',
      businessValue: 'Increase customer engagement and reduce branch visits',
      targetClient: 'Retail Banking Customers',
      endUser: 'End consumers using mobile devices',
      valueProposition: 'Convenient, secure, and feature-rich banking experience',
      governanceState: GovernanceState.APPROVED,
      productManagerId: productManager1.id,
      priority: PriorityLevel.HIGH,
      approvedAt: new Date(),
      approvedById: admin.id,
    },
  })
  console.log('✅ Created Product:', product1.name)

  const product2 = await prisma.product.create({
    data: {
      portfolioId: portfolio1.id,
      name: 'AI Customer Support',
      code: 'AICS',
      description: 'AI-powered customer support system',
      businessValue: 'Reduce support costs and improve response time',
      targetClient: 'All customers',
      endUser: 'Customers seeking support',
      valueProposition: '24/7 instant support with AI assistance',
      governanceState: GovernanceState.SUBMITTED,
      productManagerId: productManager2.id,
      priority: PriorityLevel.MEDIUM,
      submittedAt: new Date(),
      submittedById: productManager2.id,
    },
  })
  console.log('✅ Created Product:', product2.name)

  // Create Product Manager Assignments
  await prisma.productManagerAssignment.create({
    data: {
      userId: productManager1.id,
      productId: product1.id,
      assignedById: admin.id,
    },
  })

  await prisma.productManagerAssignment.create({
    data: {
      userId: productManager2.id,
      productId: product2.id,
      assignedById: admin.id,
    },
  })

  console.log('🚀 Creating releases...')

  // Create Releases
  const release1 = await prisma.release.create({
    data: {
      productId: product1.id,
      version: '1.0.0',
      name: 'Initial Release',
      description: 'First major release of mobile banking app',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-03-31'),
      governanceState: GovernanceState.APPROVED,
      readinessChecklist: [],
    },
  })
  console.log('✅ Created Release:', release1.version)

  const release2 = await prisma.release.create({
    data: {
      productId: product1.id,
      version: '1.1.0',
      name: 'Feature Enhancement Release',
      description: 'Second release with new features',
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-06-30'),
      governanceState: GovernanceState.DRAFT,
      readinessChecklist: [],
    },
  })
  console.log('✅ Created Release:', release2.version)

  console.log('✨ Creating features...')

  // Create Features
  const feature1 = await prisma.feature.create({
    data: {
      productId: product1.id,
      releaseId: release1.id,
      name: 'Biometric Authentication',
      description: 'Enable fingerprint and face ID login',
      targetUser: 'Mobile app users',
      customerSegmentation: 'Tech-savvy users',
      valueProposition: 'Quick and secure login without passwords',
      businessModel: 'Increase user engagement',
      risksChallenges: 'Device compatibility issues',
      state: FeatureState.RELEASED,
      ownerId: productManager1.id,
      priority: PriorityLevel.HIGH,
    },
  })
  console.log('✅ Created Feature:', feature1.name)

  const feature2 = await prisma.feature.create({
    data: {
      productId: product1.id,
      releaseId: release1.id,
      name: 'Bill Payment',
      description: 'Allow users to pay bills directly from the app',
      targetUser: 'All users',
      customerSegmentation: 'Regular bill payers',
      valueProposition: 'One-stop solution for bill management',
      businessModel: 'Transaction fees',
      risksChallenges: 'Integration with multiple billers',
      state: FeatureState.IN_PROGRESS,
      ownerId: productManager1.id,
      priority: PriorityLevel.MEDIUM,
    },
  })
  console.log('✅ Created Feature:', feature2.name)

  const feature3 = await prisma.feature.create({
    data: {
      productId: product1.id,
      releaseId: release2.id,
      name: 'Investment Portfolio View',
      description: 'Display investment portfolio in mobile app',
      targetUser: 'Investment account holders',
      customerSegmentation: 'High-value customers',
      valueProposition: 'Real-time portfolio tracking',
      businessModel: 'Increase investment product sales',
      risksChallenges: 'Data accuracy and real-time updates',
      state: FeatureState.DISCOVERY,
      ownerId: productManager1.id,
      priority: PriorityLevel.MEDIUM,
    },
  })
  console.log('✅ Created Feature:', feature3.name)

  // Create Feature Contributor Assignments
  await prisma.featureContributorAssignment.create({
    data: {
      userId: contributor1.id,
      featureId: feature2.id,
      assignedById: productManager1.id,
    },
  })

  await prisma.featureContributorAssignment.create({
    data: {
      userId: contributor2.id,
      featureId: feature3.id,
      assignedById: productManager1.id,
    },
  })

  console.log('⚙️ Creating system config...')

  // Create System Config
  await prisma.systemConfig.create({
    data: {
      key: 'system_frozen',
      value: false,
      updatedBy: superAdmin.id,
    },
  })
  console.log('✅ Created System Config')

  console.log('✅ Database seeding completed successfully!')
  console.log('\n📋 Test Accounts Created:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Super Admin:  superadmin@lean.com / Admin@123')
  console.log('Admin:       admin@lean.com / Admin@123')
  console.log('PM:          pm.tnt@lean.com / User@123')
  console.log('Product Mgr: prodmgr1@lean.com / User@123')
  console.log('Product Mgr: prodmgr2@lean.com / User@123')
  console.log('Contributor: contributor1@lean.com / User@123')
  console.log('Contributor: contributor2@lean.com / User@123')
  console.log('Viewer:      viewer@lean.com / User@123')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
