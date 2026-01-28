# 🚀 Supabase Database Setup Guide

Complete step-by-step guide to connect your codebase with Supabase and create the database schema.

---

## 📋 Prerequisites

- Supabase account (sign up at https://supabase.com)
- Node.js 18+ installed
- npm or yarn package manager

---

## Step 1: Create Supabase Project

1. **Go to Supabase Dashboard**
   - Visit https://supabase.com/dashboard
   - Sign in or create an account

2. **Create New Project**
   - Click "New Project"
   - Fill in:
     - **Name**: `lean-portfolio-system` (or your preferred name)
     - **Database Password**: Save this password securely (you'll need it)
     - **Region**: Choose closest to your users
   - Click "Create new project"
   - Wait 2-3 minutes for project initialization

---

## Step 2: Get Supabase Connection Details

1. **Navigate to Project Settings**
   - In your Supabase project dashboard, click **Settings** (gear icon)
   - Go to **API** section

2. **Copy API Credentials**
   - **Project URL**: Copy `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: Copy `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: Copy `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

3. **Get Database Connection String**
   - Go to **Settings** → **Database**
   - Scroll to **Connection string** section
   - Select **Connection pooling** tab
   - Copy the **URI** connection string (for `DATABASE_URL`)
   - Select **Direct connection** tab
   - Copy the **URI** connection string (for `DIRECT_URL`)

   **Format:**
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

---

## Step 3: Configure Environment Variables

1. **Update `.env.local` file**

   Open `.env.local` in your project root and update with your Supabase credentials:

   ```env
   # ===========================================
   # SUPABASE CONFIGURATION
   # ===========================================
   NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
   SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

   # ===========================================
   # DATABASE (Prisma Direct Connection)
   # ===========================================
   # Connection pooling (for application queries)
   DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   
   # Direct connection (for migrations)
   DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5555/postgres"

   # ===========================================
   # AUTH
   # ===========================================
   JWT_SECRET=[GENERATE-A-SECURE-32-CHAR-STRING]
   JWT_EXPIRES_IN=7d

   # ===========================================
   # APP
   # ===========================================
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

2. **Generate JWT Secret** (if not set)
   ```bash
   # Generate a secure random string
   openssl rand -base64 32
   ```

---

## Step 4: Create Database Schema in Supabase

You have **two options** to create the database schema:

### Option A: Using SQL Editor (Recommended for First Setup)

1. **Open Supabase SQL Editor**
   - In your Supabase dashboard, click **SQL Editor** in the left sidebar
   - Click **New query**

2. **Run the Migration SQL**
   - Open the file: `prisma/migrations/init_schema.sql`
   - Copy the entire contents
   - Paste into the SQL Editor
   - Click **Run** (or press `Cmd/Ctrl + Enter`)

3. **Verify Tables Created**
   - Go to **Table Editor** in Supabase dashboard
   - You should see all tables:
     - `users`
     - `portfolios`
     - `products`
     - `releases`
     - `features`
     - `documents`
     - `audit_log`
     - `system_config`
     - `product_manager_assignments`
     - `feature_contributor_assignments`

### Option B: Using Prisma Migrate (Alternative)

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Or use migrations (creates migration history)
npx prisma migrate dev --name init
```

---

## Step 5: Verify Database Connection

1. **Test Prisma Connection**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Test connection with Prisma Studio
   npm run db:studio
   ```
   
   Prisma Studio should open in your browser showing your database tables.

2. **Verify Connection in Code**
   - The database connection is handled by: **`src/lib/prisma.ts`**
   - This file exports a singleton Prisma client instance
   - It's automatically used throughout your application

---

## Step 6: Test the Application

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Access Application**
   - Open http://localhost:3000
   - The app should connect to Supabase database

3. **Check for Errors**
   - Monitor terminal for connection errors
   - Check browser console for any issues

---

## 📁 Key Files for Database Connection

### **Primary Database Connection Files:**

1. **`src/lib/prisma.ts`** ⭐
   - Main Prisma client instance
   - Singleton pattern for connection pooling
   - Used throughout the application for database queries

2. **`prisma/schema.prisma`** ⭐
   - Database schema definition
   - Defines all models, enums, and relationships
   - Source of truth for database structure

3. **`.env.local`** ⭐
   - Contains all database connection strings
   - Supabase API keys and credentials
   - **Never commit this file to git!**

4. **`prisma/migrations/init_schema.sql`** ⭐
   - SQL migration file to create database schema
   - Can be run directly in Supabase SQL Editor

### **Supporting Files:**

5. **`package.json`**
   - Contains Prisma scripts:
     - `db:generate` - Generate Prisma Client
     - `db:push` - Push schema to database
     - `db:studio` - Open Prisma Studio
     - `db:seed` - Seed database with initial data

6. **`src/lib/auth.ts`**
   - Uses Prisma client for user authentication
   - Example: `prisma.user.findUnique()`

7. **API Routes** (in `src/app/api/`)
   - All API routes use `prisma` from `src/lib/prisma.ts`
   - Examples:
     - `src/app/api/users/route.ts`
     - `src/app/api/portfolios/route.ts`
     - `src/app/api/products/route.ts`

---

## 🔍 How Database Connection Works

### Connection Flow:

```
Application Code
    ↓
src/lib/prisma.ts (Prisma Client)
    ↓
DATABASE_URL / DIRECT_URL (.env.local)
    ↓
Supabase PostgreSQL Database
```

### Prisma Client Usage Example:

```typescript
// In any API route or server component
import { prisma } from '@/lib/prisma'

// Query example
const users = await prisma.user.findMany({
  where: { status: 'ACTIVE' },
  include: { portfoliosManaged: true }
})
```

---

## 🛠 Troubleshooting

### Issue: "Can't reach database server"

**Solution:**
- Verify `DATABASE_URL` and `DIRECT_URL` in `.env.local`
- Check Supabase project is active (not paused)
- Ensure password in connection string matches your database password
- Try using direct connection instead of pooler

### Issue: "Schema does not exist"

**Solution:**
- Run the SQL migration in Supabase SQL Editor
- Or run: `npm run db:push`

### Issue: "Prisma Client not generated"

**Solution:**
```bash
npm run db:generate
```

### Issue: "Connection timeout"

**Solution:**
- Check Supabase project status
- Verify network connectivity
- Try using connection pooling URL (port 6543) for `DATABASE_URL`
- Use direct connection (port 5555) for `DIRECT_URL`

---

## 🔐 Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use connection pooling** for application queries (`DATABASE_URL`)
3. **Use direct connection** only for migrations (`DIRECT_URL`)
4. **Keep `SUPABASE_SERVICE_ROLE_KEY` secret** - it has admin access
5. **Use environment-specific credentials** for production

---

## 📊 Database Schema Overview

Your database includes:

- **11 Tables**: users, portfolios, products, releases, features, documents, audit_log, system_config, product_manager_assignments, feature_contributor_assignments
- **7 Enums**: UserRole, UserStatus, GovernanceState, FeatureState, PriorityLevel, AuditAction, EntityType
- **Full RBAC**: Role-based access control with 6 user roles
- **Audit Logging**: Complete audit trail for all actions
- **Governance Workflows**: Draft → Submit → Approve → Lock states

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Environment variables configured in `.env.local`
- [ ] Database schema created (SQL migration run)
- [ ] Prisma Client generated (`npm run db:generate`)
- [ ] Connection tested (`npm run db:studio`)
- [ ] Application starts without errors (`npm run dev`)
- [ ] Can access database tables in Supabase dashboard

---

## 🎯 Next Steps

After database setup:

1. **Seed Initial Data** (optional):
   ```bash
   npm run db:seed
   ```

2. **Create First User**:
   - Use the application to create users
   - Or insert directly via Supabase dashboard

3. **Start Development**:
   - Your app is now connected to Supabase!
   - All database operations will use Prisma Client

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**Need Help?** Check the troubleshooting section or review the connection files highlighted above.
