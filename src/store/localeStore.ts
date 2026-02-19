import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type Locale, type Direction, getDirection, t as translate } from '@/lib/i18n'

interface LocaleState {
  locale: Locale
  dir: Direction
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: 'en',
      dir: 'ltr',
      setLocale: (locale: Locale) => {
        set({ locale, dir: getDirection(locale) })
        if (typeof document !== 'undefined') {
          document.documentElement.lang = locale
          document.documentElement.dir = getDirection(locale)
        }
      },
      t: (key: string, params?: Record<string, string | number>) => {
        return translate(get().locale, key, params)
      },
    }),
    {
      name: 'lpms-locale',
      partialize: (state) => ({ locale: state.locale, dir: state.dir }),
    }
  )
)
