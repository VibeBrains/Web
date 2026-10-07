import ru from '../locales/ru.json'
import en from '../locales/en.json'
import { createI18n } from '@vibebrains/site-kit/i18n'

/** Keys of the base catalog: every other catalog is checked against it by the locale gate */
export type Key = keyof typeof ru

export const { useTranslations } = createI18n<Key>({ ru, en })
