import en from './locales/en.json'
import ar from './locales/ar.json'

export type Locale = 'en' | 'ar'
export type Direction = 'ltr' | 'rtl'

export const locales: Record<Locale, { name: string; nativeName: string; dir: Direction }> = {
  en: { name: 'English', nativeName: 'English', dir: 'ltr' },
  ar: { name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
}

const translations: Record<Locale, typeof en> = { en, ar }

export function getTranslations(locale: Locale) {
  return translations[locale] || translations.en
}

export function getDirection(locale: Locale): Direction {
  return locales[locale]?.dir || 'ltr'
}

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T & string]: T[K] extends object
    ? `${K}.${NestedKeyOf<T[K]>}`
    : K
  }[keyof T & string]
  : never

export type TranslationKey = NestedKeyOf<typeof en>

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const trans = translations[locale] || translations.en
  const keys = key.split('.')
  let value: any = trans
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return key
    }
  }
  if (typeof value !== 'string') return key
  if (params) {
    return Object.entries(params).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, String(v)),
      value
    )
  }
  return value
}
