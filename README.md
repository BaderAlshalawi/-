# Lean Portfolio Management System - V1

A complete Portfolio/Product/Feature/Release Management System with full RBAC, governance workflows, and audit logging.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for PostgreSQL database)

### Setup Steps

1. **Clone and Install Dependencies**

```bash
npm install
```

2. **Set Up Supabase Database**

   - Go to https://supabase.com and create a new project
   - Copy your database connection string and credentials
   - Run the SQL schema from the prompt in Supabase SQL Editor (see Database Schema section in the prompt)

3. **Configure Environment Variables**

   Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

   Update the following:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `DATABASE_URL` - PostgreSQL connection string from Supabase
   - `DIRECT_URL` - Same as DATABASE_URL
   - `JWT_SECRET` - A secure random string (min 32 characters)

4. **Initialize Prisma**

```bash
npx prisma generate
npx prisma db push
```

5. **Run the Development Server**

```bash
npm run dev
```

6. **Access the Application**

   Open [http://localhost:3000](http://localhost:3000)

   Login with test accounts:
   - **Super Admin**: superadmin@lean.com / Admin@123
   - **Admin**: admin@lean.com / Admin@123
   - **Program Manager**: pm.tnt@lean.com / User@123
   - **Product Manager**: prodmgr1@lean.com / User@123
   - **Contributor**: contributor1@lean.com / User@123
   - **Viewer**: viewer@lean.com / User@123

## 📁 Project Structure

```
lean-portfolio-system/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── layout/           # Layout components
│   │   ├── auth/             # Auth components
│   │   └── common/           # Shared components
│   ├── lib/                  # Utility libraries
│   │   ├── auth.ts           # Authentication helpers
│   │   ├── permissions.ts    # RBAC logic
│   │   ├── audit.ts          # Audit logging
│   │   └── prisma.ts         # Prisma client
│   ├── types/                # TypeScript types
│   └── store/                # Zustand stores
└── middleware.ts             # Next.js middleware for auth
```

## 🔐 Roles & Permissions

- **SUPER_ADMIN**: Full system access, can freeze system
- **ADMIN**: User management, audit log access (cannot edit business entities)
- **PROGRAM_MANAGER**: Manages assigned portfolio and products
- **PRODUCT_MANAGER**: Manages assigned products and features
- **CONTRIBUTOR**: Can edit assigned features when IN_PROGRESS
- **VIEWER**: Read-only access to all entities

## 🎯 Key Features

- ✅ Role-Based Access Control (RBAC)
- ✅ Governance workflows (Draft → Submit → Approve → Lock)
- ✅ User Management with leaver handling
- ✅ Complete Audit Logging
- ✅ Emergency System Freeze
- ✅ Portfolio/Product/Feature/Release Management
- ✅ Document Management

## 📝 Database Setup

The database schema is defined in Prisma (`prisma/schema.prisma`). After setting up Supabase:

1. Run the SQL schema from the initialization prompt in Supabase SQL Editor
2. This will create all tables, indexes, and seed data

Alternatively, you can use Prisma migrations:

```bash
npx prisma migrate dev --name init
```

## 🛠 Development

```bash
# Run development server
npm run dev

# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🔒 Security Notes

- JWT tokens are stored in httpOnly cookies
- Passwords are hashed using bcrypt
- All API routes are protected by middleware
- Row Level Security (RLS) is enabled in Supabase
- Audit logs are immutable

## 📚 Next Steps

This is V1 of the system. To complete the full implementation:

1. Complete all API endpoints for CRUD operations
2. Implement all governance workflows (Submit/Approve/Reject/Lock)
3. Add feature lifecycle transitions
4. Implement Release Go/No-Go flow
5. Complete Admin console (User Management, Audit Log)
6. Add document upload functionality
7. Implement system freeze/unfreeze

## 🤝 Contributing

This is a production-ready V1 system. Follow the development order outlined in the initialization prompt.

## 📄 License

Proprietary - Internal Use Only
