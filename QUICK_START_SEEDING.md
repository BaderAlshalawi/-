# 🚀 Quick Start: Seed Your Database

**Fast 3-step guide to seed your database and start logging in.**

---

## ✅ Step 1: Verify Database Connection

```bash
# Generate Prisma Client
npm run db:generate

# Test connection (opens Prisma Studio)
npm run db:studio
```

If Prisma Studio opens, your connection works! ✅

---

## ✅ Step 2: Ensure Database Schema Exists

```bash
# Push schema to create all tables
npm run db:push
```

This creates all required tables in your Supabase database.

---

## ✅ Step 3: Seed Database

```bash
# Run seed script
npm run db:seed
```

**Expected output:**
```
🌱 Starting database seeding...
✅ Created Super Admin: superadmin@lean.com
✅ Created Admin: admin@lean.com
... (more users and data)
✅ Database seeding completed successfully!
```

---

## 🎉 Done! Test Login

1. Start your app:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/login

3. Login with:
   - **Email:** `superadmin@lean.com`
   - **Password:** `Admin@123`

---

## 📋 All Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@lean.com` | `Admin@123` |
| Admin | `admin@lean.com` | `Admin@123` |
| Program Manager | `pm.tnt@lean.com` | `User@123` |
| Product Manager | `prodmgr1@lean.com` | `User@123` |
| Contributor | `contributor1@lean.com` | `User@123` |
| Viewer | `viewer@lean.com` | `User@123` |

---

## 🆘 Troubleshooting

**"Can't reach database server"**
- Check `.env.local` has correct `DATABASE_URL`
- Verify Supabase project is active

**"Table does not exist"**
- Run: `npm run db:push`

**"Module not found"**
- Run: `npm install && npm run db:generate`

---

## 📚 Full Guides

- **Detailed Seeding:** See `DATABASE_SEEDING_GUIDE.md`
- **Connection Files:** See `DATABASE_CONNECTION_FILES.md`
- **MCP Setup:** See `MCP_SUPABASE_CONNECTION_GUIDE.md`

---

**That's it! You're ready to go! 🎉**
