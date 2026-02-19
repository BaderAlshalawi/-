'use client'

import { useLocaleStore } from '@/store/localeStore'
import { locales, type Locale } from '@/lib/i18n'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { locale, setLocale } = useLocaleStore()

  const toggleLocale = () => {
    const next: Locale = locale === 'en' ? 'ar' : 'en'
    setLocale(next)
  }

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors border border-border"
      aria-label={`Switch to ${locale === 'en' ? 'Arabic' : 'English'}`}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{locales[locale].nativeName}</span>
    </button>
  )
}
