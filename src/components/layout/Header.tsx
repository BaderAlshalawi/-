'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'
import { RoleBadge } from '@/components/RoleBadge'
import { LogOut, User, Globe } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [language, setLanguage] = useState<'en' | 'ar'>('en')

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    logout()
    router.push('/login')
  }

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en'
    setLanguage(newLang)
    document.documentElement.lang = newLang
    document.body.dir = newLang === 'ar' ? 'rtl' : 'ltr'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome, {user?.name}
            </h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          {user?.role && <RoleBadge role={user.role} />}
        </div>
        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="font-medium">{language === 'en' ? '🇸🇦 AR' : '🇬🇧 EN'}</span>
          </Button>

          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
