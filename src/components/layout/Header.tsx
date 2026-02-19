'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/store/authStore'
import { useLocaleStore } from '@/store/localeStore'
import { RoleBadge } from '@/components/RoleBadge'
import { LogOut, Globe, Bell } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { locale, setLocale, t } = useLocaleStore()
  const [pendingCount, setPendingCount] = useState(0)

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/pending-actions')
      if (res.ok) {
        const data = await res.json()
        setPendingCount(data.totalPending || 0)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    if (user) fetchPending()
  }, [user, fetchPending])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    router.push('/login')
  }

  const toggleLanguage = () => {
    setLocale(locale === 'en' ? 'ar' : 'en')
  }

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1B365D] to-[#7C3AED] flex items-center justify-center text-white font-bold text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                {user?.name}
              </h2>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          {user?.role && <RoleBadge role={user.role} />}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative hover:bg-muted transition-colors"
            aria-label="Notifications"
            onClick={() => router.push('/dashboard')}
          >
            <Bell className="h-4 w-4" />
            {pendingCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              >
                {pendingCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2 hover:bg-muted transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">{locale === 'en' ? 'العربية' : 'EN'}</span>
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4 me-2" />
            {t('auth.logout')}
          </Button>
        </div>
      </div>
    </header>
  )
}
