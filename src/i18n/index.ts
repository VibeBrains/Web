import ru from '../locales/ru.json'
import en from '../locales/en.json'
import { BASE_LANG, type Lang } from '../config/languages'

/** Keys of the base catalog: every other catalog is checked against it by tests/locales.test.ts */
export type Key = keyof typeof ru

export type Params = Record<string, string | number>

const catalogs: Record<Lang, Partial<Record<Key, string>>> = { ru, en }

const PLACEHOLDER = /\{(\w+)\}/g

/**
 * Substitutes named placeholders
 * A placeholder without a value stays visible: a bare `{count}` names the bug, silent removal would hide it
 */
export const format = (template: string, params?: Params): string =>
  params === undefined
    ? template
    : template.replace(PLACEHOLDER, (whole, name: string) => (name in params ? String(params[name]) : whole))

/**
 * Translator bound to one language
 * A key missing from the language falls back to the base string, so a partial catalog still renders
 * A key missing from the base catalog fails the build instead of shipping an empty label
 */
export const useTranslations = (lang: Lang) => {
  const catalog = catalogs[lang]
  const base = catalogs[BASE_LANG]
  const t = (key: Key, params?: Params): string => {
    const template = catalog[key] ?? base[key]
    if (template === undefined) throw new Error(`i18n: no string for key "${key}"`)
    return format(template, params)
  }
  /** Catalog strings keep one sentence per line: callers render each line as its own element */
  const lines = (key: Key, params?: Params): string[] => t(key, params).split('\n')
  return { t, lines }
}
