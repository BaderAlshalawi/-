import { PrismaClient, UserRole, UserStatus, GovernanceState, FeatureState, PriorityLevel, HostingCostCategory } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting database seeding...')

  console.log('Cleaning existing data...')
  await prisma.$transaction([
    prisma.portfolioResourceAllocation.deleteMany(),
    prisma.hostingCost.deleteMany(),
    prisma.rateCard.deleteMany(),
    prisma.lookupFeature.deleteMany(),
  ])
  await prisma.$transaction([
    prisma.lookupPhase.deleteMany(),
    prisma.lookupQuarter.deleteMany(),
    prisma.lookupTeamType.deleteMany(),
    prisma.lookupPosition.deleteMany(),
    prisma.lookupGradeRole.deleteMany(),
  ])
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.document.deleteMany(),
    prisma.costEntry.deleteMany(),
    prisma.resourceAssignment.deleteMany(),
    prisma.productManagerAssignment.deleteMany(),
  ])
  await prisma.$transaction([
    prisma.feature.deleteMany(),
    prisma.release.deleteMany(),
  ])
  await prisma.product.deleteMany()
  await prisma.portfolio.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemConfig.deleteMany()

  const [adminPassword, userPassword] = await Promise.all([
    bcrypt.hash('Admin@123', 12),
    bcrypt.hash('User@123', 12),
  ])

  // ─── Users ───
  console.log('Creating users...')
  const [superAdmin, programManager, productManager1, productManager2] = await prisma.$transaction([
    prisma.user.create({
      data: { email: 'superadmin@lean.com', passwordHash: adminPassword, name: 'Super Admin', role: UserRole.SUPER_ADMIN, status: UserStatus.ACTIVE },
    }),
    prisma.user.create({
      data: { email: 'pm.tnt@lean.com', passwordHash: userPassword, name: 'Program Manager TNT', role: UserRole.PROGRAM_MANAGER, status: UserStatus.ACTIVE },
    }),
    prisma.user.create({
      data: { email: 'prodmgr1@lean.com', passwordHash: userPassword, name: 'Product Manager 1', role: UserRole.PRODUCT_MANAGER, status: UserStatus.ACTIVE },
    }),
    prisma.user.create({
      data: { email: 'prodmgr2@lean.com', passwordHash: userPassword, name: 'Product Manager 2', role: UserRole.PRODUCT_MANAGER, status: UserStatus.ACTIVE },
    }),
    prisma.user.create({
      data: { email: 'viewer@lean.com', passwordHash: userPassword, name: 'Viewer User', role: UserRole.VIEWER, status: UserStatus.ACTIVE },
    }),
  ])

  // ─── Lookups ───
  console.log('Creating lookup data...')

  const phaseNames = ['Development', 'Year 1', 'Year 2', 'Year 3']
  const phases = await prisma.$transaction(
    phaseNames.map((name, i) => prisma.lookupPhase.create({ data: { name, sortOrder: i } }))
  )

  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4']
  await prisma.$transaction(
    quarterNames.map((name, i) => prisma.lookupQuarter.create({ data: { name, sortOrder: i } }))
  )

  const teamTypeNames = ['Other', 'Business', 'Technical', 'Operation', 'Data', 'InfraTeam']
  const teamTypesArr = await prisma.$transaction(
    teamTypeNames.map((name, i) => prisma.lookupTeamType.create({ data: { name, sortOrder: i } }))
  )
  const teamTypes: Record<string, typeof teamTypesArr[0]> = {}
  teamTypesArr.forEach((tt: typeof teamTypesArr[0], i: number) => { teamTypes[teamTypeNames[i]] = tt })

  const positionNames = [
    'Product Manager', 'Program Manager', 'Business Analyst',
    'Senior Backend Developer (fullstack)', 'Senior Frontend Developer',
    'Senior QA', 'Business Operation', 'Senior IT Application Support',
    'Head Business Analysis', 'Head of Delivery', 'Executive Director',
    'Senior Engineer', 'Senior DBA', 'Senior NOC engineer',
    'SRE', 'SOC', 'Integration Support', 'Data Analyst',
    'Data Engineering Senior Expert', 'Data Engineering Senior Analyst',
    'Sr. Analyst', 'Analyst', 'Senior Expert',
  ]
  await prisma.$transaction(
    positionNames.map((name, i) => prisma.lookupPosition.create({ data: { name, sortOrder: i } }))
  )

  // ─── Grade/Roles with monthly costs ───
  const gradeRoleData: { name: string; monthly: number }[] = [
    { name: 'Lead', monthly: 69002 },
    { name: 'Sr.Lead', monthly: 75604 },
    { name: 'Analyst', monthly: 40061 },
    { name: 'Senior Backend Developer (fullstack)', monthly: 36000 },
    { name: 'Senior Frontend Developer', monthly: 36000 },
    { name: 'Senior QA', monthly: 36000 },
    { name: 'Senior IT Application Support', monthly: 39600 },
    { name: 'Head - Expert', monthly: 92222 },
    { name: 'Executive Director - Sr.Consultant', monthly: 189393 },
    { name: 'Senior IT infrastructure engineer', monthly: 48000 },
    { name: 'Senior DBA', monthly: 38400 },
    { name: 'Senior NOC engineer', monthly: 59760 },
    { name: 'SRE', monthly: 59760 },
    { name: 'SOC', monthly: 59760 },
    { name: 'Integration Support', monthly: 59760 },
    { name: 'Data Analyst', monthly: 40000 },
    { name: 'Data Engineering Senior Expert', monthly: 122100 },
    { name: 'Data Engineering Senior Analyst', monthly: 53325 },
    { name: 'Sr. Analyst', monthly: 53326 },
  ]

  const gradeRolesArr = await prisma.$transaction(
    gradeRoleData.map((g, i) => prisma.lookupGradeRole.create({ data: { name: g.name, sortOrder: i } }))
  )
  const gradeRoles: Record<string, typeof gradeRolesArr[0]> = {}
  gradeRolesArr.forEach((gr: typeof gradeRolesArr[0], i: number) => { gradeRoles[gradeRoleData[i].name] = gr })

  // ─── Rate Cards (22 days/month, 8 hours/day) ───
  console.log('Creating rate cards...')
  const DAYS = 22
  const HOURS_PER_DAY = 8

  // Map: grade name -> list of team type names that should have a rate card
  const gradeToTeams: Record<string, string[]> = {
    'Lead': ['Business', 'Operation'],
    'Sr.Lead': ['Business'],
    'Analyst': ['Business'],
    'Senior Backend Developer (fullstack)': ['Technical'],
    'Senior Frontend Developer': ['Technical'],
    'Senior QA': ['Technical'],
    'Senior IT Application Support': ['Technical'],
    'Head - Expert': ['Business'],
    'Executive Director - Sr.Consultant': ['Business'],
    'Senior IT infrastructure engineer': ['Technical'],
    'Senior DBA': ['Technical'],
    'Senior NOC engineer': ['Technical'],
    'SRE': ['Technical'],
    'SOC': ['Technical'],
    'Integration Support': ['Technical'],
    'Data Analyst': ['Data'],
    'Data Engineering Senior Expert': ['Data'],
    'Data Engineering Senior Analyst': ['Data'],
    'Sr. Analyst': ['Data'],
  }

  const rateCardCreates: Parameters<typeof prisma.rateCard.create>[0][] = []
  for (const grd of gradeRoleData) {
    const daily = Math.round((grd.monthly / DAYS) * 100) / 100
    const hourly = Math.round((daily / HOURS_PER_DAY) * 100) / 100
    const gr = gradeRoles[grd.name]
    const ttNames = gradeToTeams[grd.name] ?? ['Other']

    for (const ttName of ttNames) {
      const tt = teamTypes[ttName]
      if (!tt || !gr) continue
      rateCardCreates.push({
        data: {
          teamTypeId: tt.id,
          gradeRoleId: gr.id,
          monthlyCost: grd.monthly,
          dailyCost: daily,
          hourlyCost: hourly,
          currency: 'SAR',
          isActive: true,
        },
      })
    }
  }
  await prisma.$transaction(
    rateCardCreates.map((rc) => prisma.rateCard.create(rc))
  )

  // Build a fast lookup map: "teamTypeId|gradeRoleId" -> hourly
  const rateCardMap: Record<string, number> = {}
  for (const grd of gradeRoleData) {
    const daily = Math.round((grd.monthly / DAYS) * 100) / 100
    const hourly = Math.round((daily / HOURS_PER_DAY) * 100) / 100
    const gr = gradeRoles[grd.name]
    const ttNames = gradeToTeams[grd.name] ?? ['Other']
    for (const ttName of ttNames) {
      const tt = teamTypes[ttName]
      if (tt && gr) rateCardMap[`${tt.id}|${gr.id}`] = hourly
    }
  }

  // ─── Portfolios ───
  console.log('Creating portfolios...')
  const [portfolio1] = await prisma.$transaction([
    prisma.portfolio.create({
      data: {
        name: 'Digital Transformation', code: 'DT',
        description: 'Portfolio for digital transformation initiatives',
        governanceState: GovernanceState.APPROVED,
        programManagerId: programManager.id,
        priority: PriorityLevel.HIGH,
        approvedAt: new Date(), approvedById: superAdmin.id,
        estimatedBudget: 5000000, costCurrency: 'SAR',
      },
    }),
    prisma.portfolio.create({
      data: {
        name: 'Customer Experience', code: 'CX',
        description: 'Portfolio for customer experience improvements',
        governanceState: GovernanceState.DRAFT,
        programManagerId: programManager.id,
        priority: PriorityLevel.MEDIUM,
        costCurrency: 'SAR',
      },
    }),
  ])

  await prisma.user.update({
    where: { id: programManager.id },
    data: { assignedPortfolioId: portfolio1.id },
  })

  // ─── Lookup Features (per portfolio) ───
  const featureNames = ['Medication Delivery', 'Surplus Drugs', 'Feature 3', 'Feature 4', 'AI', 'Feature 5', 'Feature 6']
  const lookupFeaturesArr = await prisma.$transaction(
    featureNames.map((name, i) => prisma.lookupFeature.create({
      data: { portfolioId: portfolio1.id, name, sortOrder: i },
    }))
  )
  const lookupFeatures: Record<string, typeof lookupFeaturesArr[0]> = {}
  lookupFeaturesArr.forEach((f: typeof lookupFeaturesArr[0], i: number) => { lookupFeatures[featureNames[i]] = f })

  // ─── Products ───
  console.log('Creating products...')
  const [product1, product2] = await prisma.$transaction([
    prisma.product.create({
      data: {
        portfolioId: portfolio1.id, name: 'Mobile Banking App', code: 'MBA',
        description: 'Next-generation mobile banking application',
        businessValue: 'Increase customer engagement and reduce branch visits',
        targetClient: 'Retail Banking Customers', endUser: 'End consumers using mobile devices',
        valueProposition: 'Convenient, secure, and feature-rich banking experience',
        governanceState: GovernanceState.APPROVED, productManagerId: productManager1.id,
        priority: PriorityLevel.HIGH, approvedAt: new Date(), approvedById: superAdmin.id,
        costCurrency: 'SAR',
      },
    }),
    prisma.product.create({
      data: {
        portfolioId: portfolio1.id, name: 'AI Customer Support', code: 'AICS',
        description: 'AI-powered customer support system',
        businessValue: 'Reduce support costs and improve response time',
        targetClient: 'All customers', endUser: 'Customers seeking support',
        valueProposition: '24/7 instant support with AI assistance',
        governanceState: GovernanceState.SUBMITTED, productManagerId: productManager2.id,
        priority: PriorityLevel.MEDIUM, submittedAt: new Date(), submittedById: productManager2.id,
        costCurrency: 'SAR',
      },
    }),
  ])

  await prisma.$transaction([
    prisma.productManagerAssignment.create({
      data: { userId: productManager1.id, productId: product1.id, assignedById: superAdmin.id },
    }),
    prisma.productManagerAssignment.create({
      data: { userId: productManager2.id, productId: product2.id, assignedById: superAdmin.id },
    }),
  ])

  // ─── Releases ───
  console.log('Creating releases...')
  const [release1, release2] = await prisma.$transaction([
    prisma.release.create({
      data: {
        productId: product1.id, version: '1.0.0', name: 'Initial Release',
        description: 'First major release of mobile banking app',
        startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31'),
        governanceState: GovernanceState.APPROVED, readinessChecklist: [],
        costCurrency: 'SAR',
      },
    }),
    prisma.release.create({
      data: {
        productId: product1.id, version: '1.1.0', name: 'Feature Enhancement Release',
        description: 'Second release with new features',
        startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30'),
        governanceState: GovernanceState.DRAFT, readinessChecklist: [],
        costCurrency: 'SAR',
      },
    }),
  ])

  // ─── Features ───
  console.log('Creating features...')
  await prisma.$transaction([
    prisma.feature.create({
      data: {
        productId: product1.id, releaseId: release1.id,
        name: 'Biometric Authentication', description: 'Enable fingerprint and face ID login',
        state: FeatureState.RELEASED, ownerId: productManager1.id,
        priority: PriorityLevel.HIGH, costCurrency: 'SAR',
      },
    }),
    prisma.feature.create({
      data: {
        productId: product1.id, releaseId: release1.id,
        name: 'Bill Payment', description: 'Allow users to pay bills directly from the app',
        state: FeatureState.IN_PROGRESS, ownerId: productManager1.id,
        priority: PriorityLevel.MEDIUM, costCurrency: 'SAR',
      },
    }),
    prisma.feature.create({
      data: {
        productId: product1.id, releaseId: release2.id,
        name: 'Investment Portfolio View', description: 'Display investment portfolio in mobile app',
        state: FeatureState.DISCOVERY, ownerId: productManager1.id,
        priority: PriorityLevel.MEDIUM, costCurrency: 'SAR',
      },
    }),
  ])

  // ─── System Config ───
  console.log('Creating system config...')
  await prisma.$transaction([
    prisma.systemConfig.create({
      data: { key: 'system_frozen', value: { frozen: false }, updatedBy: superAdmin.id },
    }),
    prisma.systemConfig.create({
      data: { key: 'approval_sla_days', value: { days: 5 }, updatedBy: superAdmin.id },
    }),
    prisma.systemConfig.create({
      data: { key: 'costing_config', value: { workingDaysPerMonth: 22, hoursPerDay: 8 }, updatedBy: superAdmin.id },
    }),
  ])

  await prisma.$transaction([
    prisma.user.update({ where: { id: productManager1.id }, data: { costRate: 15000, costRateCurrency: 'SAR' } }),
    prisma.user.update({ where: { id: productManager2.id }, data: { costRate: 14000, costRateCurrency: 'SAR' } }),
  ])

  // ─── Sample Resource Allocations ───
  console.log('Creating sample allocations...')
  const devPhase = phases[0]  // Development
  const year1Phase = phases[1] // Year 1

  function getHourly(teamTypeName: string, gradeRoleName: string): number {
    const tt = teamTypes[teamTypeName]
    const gr = gradeRoles[gradeRoleName]
    if (!tt || !gr) return 0
    return rateCardMap[`${tt.id}|${gr.id}`] ?? 0
  }

  const sampleAllocations = [
    { feature: 'Medication Delivery', phase: devPhase, teamType: 'Business', position: 'Program Manager', gradeRole: 'Sr.Lead', hours: 400, util: 0.50 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Business', position: 'Program Manager', gradeRole: 'Sr.Lead', hours: 100, util: 0.50 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Business', position: 'Business Analyst', gradeRole: 'Analyst', hours: 400, util: 0.50 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Business', position: 'Product Manager', gradeRole: 'Analyst', hours: 240, util: 1.00 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior Backend Developer (fullstack)', gradeRole: 'Senior Backend Developer (fullstack)', hours: 160, util: 1.00 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior Frontend Developer', gradeRole: 'Senior Frontend Developer', hours: 80, util: 1.00 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior Backend Developer (fullstack)', gradeRole: 'Senior Backend Developer (fullstack)', hours: 80, util: 1.00 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior QA', gradeRole: 'Senior QA', hours: 80, util: 1.00 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Operation', position: 'Business Operation', gradeRole: 'Lead', hours: 40, util: 0.07 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior IT Application Support', gradeRole: 'Senior IT Application Support', hours: 22, util: 0.33 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Business', position: 'Head Business Analysis', gradeRole: 'Head - Expert', hours: 10, util: 0.14 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Business', position: 'Head of Delivery', gradeRole: 'Head - Expert', hours: 10, util: 0.14 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Business', position: 'Executive Director', gradeRole: 'Executive Director - Sr.Consultant', hours: 5, util: 0.14 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior Engineer', gradeRole: 'Senior IT infrastructure engineer', hours: 5, util: 0.10 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior Engineer', gradeRole: 'Senior DBA', hours: 5, util: 0.10 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Technical', position: 'Senior Engineer', gradeRole: 'Senior NOC engineer', hours: 5, util: 0.10 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Data', position: 'Data Analyst', gradeRole: 'Data Analyst', hours: 5, util: 0.45 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Data', position: 'Data Engineering Senior Expert', gradeRole: 'Data Engineering Senior Expert', hours: 5, util: 0.15 },
    { feature: 'Surplus Drugs', phase: devPhase, teamType: 'Data', position: 'Data Engineering Senior Analyst', gradeRole: 'Data Engineering Senior Analyst', hours: 5, util: 0.20 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Business', position: 'Product Manager', gradeRole: 'Lead', hours: 400, util: 0.50 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Business', position: 'Program Manager', gradeRole: 'Sr.Lead', hours: 100, util: 0.50 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Business', position: 'Business Analyst', gradeRole: 'Analyst', hours: 400, util: 0.50 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Technical', position: 'Senior Backend Developer (fullstack)', gradeRole: 'Senior Backend Developer (fullstack)', hours: 160, util: 1.00 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Technical', position: 'Senior Frontend Developer', gradeRole: 'Senior Frontend Developer', hours: 80, util: 1.00 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Technical', position: 'Senior Backend Developer (fullstack)', gradeRole: 'Senior Backend Developer (fullstack)', hours: 80, util: 1.00 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Data', position: 'Data Analyst', gradeRole: 'Data Analyst', hours: 5, util: 0.45 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Data', position: 'Data Engineering Senior Expert', gradeRole: 'Data Engineering Senior Expert', hours: 5, util: 0.15 },
    { feature: 'Surplus Drugs', phase: year1Phase, teamType: 'Data', position: 'Data Engineering Senior Analyst', gradeRole: 'Data Engineering Senior Analyst', hours: 5, util: 0.20 },
    { feature: 'Feature 3', phase: devPhase, teamType: 'Technical', position: 'Senior Frontend Developer', gradeRole: 'Senior Frontend Developer', hours: 6, util: 0.40 },
  ]

  const allocCreates = sampleAllocations.map((alloc) => {
    const tt = teamTypes[alloc.teamType]
    const gr = gradeRoles[alloc.gradeRole]
    const feat = lookupFeatures[alloc.feature]
    const hourly = getHourly(alloc.teamType, alloc.gradeRole)
    const actualCost = Math.round(hourly * alloc.hours * alloc.util * 100) / 100
    const durationDays = Math.round((alloc.hours / 8) * 100) / 100

    return prisma.portfolioResourceAllocation.create({
      data: {
        portfolioId: portfolio1.id,
        featureId: feat?.id ?? null,
        phaseId: alloc.phase.id,
        teamTypeId: tt.id,
        gradeRoleId: gr.id,
        hourlyCostSnapshot: hourly,
        actualHours: alloc.hours,
        utilization: alloc.util,
        actualCostComputed: actualCost,
        durationDaysComputed: durationDays,
        currency: 'SAR',
        createdById: superAdmin.id,
        updatedById: superAdmin.id,
      },
    })
  })
  await prisma.$transaction(allocCreates)

  // ─── Sample Hosting Costs ───
  console.log('Creating sample hosting costs...')
  await prisma.$transaction([
    prisma.hostingCost.create({
      data: { portfolioId: portfolio1.id, category: HostingCostCategory.LICENSE, amount: 98742.54, currency: 'SAR' },
    }),
    prisma.hostingCost.create({
      data: { portfolioId: portfolio1.id, category: HostingCostCategory.INFRA, amount: 170908.36, currency: 'SAR' },
    }),
    prisma.hostingCost.create({
      data: { portfolioId: portfolio1.id, category: HostingCostCategory.OTHERS, amount: 782251, currency: 'SAR' },
    }),
    prisma.hostingCost.create({
      data: { portfolioId: portfolio1.id, category: HostingCostCategory.INDIRECT, amount: 782251, currency: 'SAR' },
    }),
  ])

  console.log('Database seeding completed successfully!')
  console.log('\nTest Accounts Created:')
  console.log('Super Admin:  superadmin@lean.com / Admin@123')
  console.log('PM:           pm.tnt@lean.com / User@123')
  console.log('Product Mgr:  prodmgr1@lean.com / User@123')
  console.log('Product Mgr:  prodmgr2@lean.com / User@123')
  console.log('Viewer:       viewer@lean.com / User@123')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
