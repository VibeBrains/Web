// @ts-check
import { defineConfig } from 'astro/config'

// Static site: every page is prerendered into dist/, no server runtime
export default defineConfig({
  site: 'https://vibeide.ru',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
})
