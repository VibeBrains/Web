/** Product repository on GitHub: releases, sources and issues live there */
export const REPO = 'VibeBrains/VibeIDE'

const GITHUB = `https://github.com/${REPO}`

/** Outbound links of the landing, one source for header, sections and footer */
export const links = {
  github: GITHUB,
  releases: `${GITHUB}/releases`,
  issues: `${GITHUB}/issues`,
  functional: `${GITHUB}/blob/main/docs/functional.md`,
  firstRun: `${GITHUB}/blob/main/docs/manuals/firstRun.md`,
  vibeidea: 'https://vibeidea.ru',
  vibememory: 'https://vibememory.ru',
} as const

/** One-line install from the Microsoft catalogue */
export const WINGET_COMMAND = 'winget install VibeBrains.VibeIDE'

/** localStorage key that remembers the language the visitor picked explicitly */
export const LANG_STORAGE_KEY = 'vibeide.lang'

/** Sibling products of the family section: product names, the same in every language */
export const siblings = { vibeidea: 'VibeIDEA', vibememory: 'VibeMemory' } as const

/**
 * App icons of the family, copied as they ship — a redrawn mark drifts from the real one:
 * VibeIDE's from resources/darwin/code.icns of its repository
 * VibeIDEA's from vibeidea-customization/resources/vibeidea.svg of its repository
 * VibeMemory's from public/favicon.svg of vibememory.ru
 */
export const brandIcons = {
  vibeide: '/brands/vibeide.png',
  vibeidea: '/brands/vibeidea.svg',
  vibememory: '/brands/vibememory.svg',
} as const

/** Competitors of the comparison table: product names, the same in every language */
export const competitors = ['Cursor', 'Windsurf', 'Copilot'] as const

/** File that adds providers without a rebuild, and a minimal example of it shown on the page */
export const PROVIDERS_FILE = '.vibe/providers.json'
export const PROVIDERS_SNIPPET = `{
  "version": 1,
  "providers": [{
    "id": "my-gateway",
    "name": "LLM Gateway",
    "protocol": "openai",
    "baseURL": "https://llm.company.local/v1",
    "apiKeyEnv": "GATEWAY_KEY"
  }]
}`
