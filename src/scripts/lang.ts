import { LANG_STORAGE_KEY } from '../config/site'

/**
 * Remembers the language the visitor picks in the header switcher
 * Only an explicit pick is stored: Russian stays the default whatever the browser language is
 */
export const initLangMemory = (): void => {
  document.querySelectorAll<HTMLAnchorElement>('[data-lang-pick]').forEach((link) => {
    link.addEventListener('click', () => {
      const lang = link.dataset.langPick
      if (lang === undefined) return
      try {
        localStorage.setItem(LANG_STORAGE_KEY, lang)
      } catch {
        // Storage can be blocked: the link still leads to the chosen language
      }
    })
  })
}
