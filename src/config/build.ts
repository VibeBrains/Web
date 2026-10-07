import { appReleases, RELEASES_API, type Release } from './releases'

/**
 * Releases as of the build: the page ships working download links even without scripts
 * GitHub can refuse (rate limit, no network): the page then links to the releases list, and the browser fills it in
 */
const fetchReleases = async (): Promise<Release[]> => {
  try {
    const response = await fetch(RELEASES_API, { headers: { Accept: 'application/vnd.github+json' } })
    if (!response.ok) {
      console.warn(`[releases] GitHub API: HTTP ${response.status}, the page links to the releases list`)
      return []
    }
    return appReleases((await response.json()) as Release[])
  } catch (error) {
    console.warn(`[releases] GitHub API unavailable (${String(error)}), the page links to the releases list`)
    return []
  }
}

export const buildReleases: Release[] = await fetchReleases()
