import { join } from 'node:path'
import { localeGate } from '@vibebrains/site-kit/gate'
import { productNames } from '@vibebrains/site-kit/brands'
import ru from '../src/locales/ru.json'
import en from '../src/locales/en.json'
import { competitors, PROVIDERS_FILE, PROVIDERS_SNIPPET, WINGET_COMMAND } from '../src/config/site'
import { providers } from '../src/config/providers'

localeGate({
  root: join(import.meta.dir, '..'),
  catalogs: { ru, en },
  // Data that is the same in every language and is not interface text: product names, commands and code
  data: [
    ...providers,
    ...competitors,
    ...Object.values(productNames),
    WINGET_COMMAND,
    PROVIDERS_FILE,
    PROVIDERS_SNIPPET,
  ],
})
