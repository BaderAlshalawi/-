'use client'

import { useEffect } from 'react'
import { useLocaleStore } from '@/store/localeStore'
import { getDirection } from '@/lib/i18n'

export function LocaleInitializer() {
  const locale = useLocaleStore((s) => s.locale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = getDirection(locale)
  }, [locale])

  return null
}
