import { fetchReleases } from '@vibebrains/site-kit/releases'
import { RELEASES_API } from './releases'

/** Releases as of the build: the page ships working download links even without scripts */
export const buildReleases = await fetchReleases(RELEASES_API)
