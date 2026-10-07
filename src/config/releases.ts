import { REPO } from './site'

/**
 * Release data shared by the build and the browser
 * Releases are per platform: a macOS-only fix makes "latest" a macOS release, so every button looks for the newest
 * build of its own platform instead of trusting `releases/latest`
 */

export const RELEASES_API = `https://api.github.com/repos/${REPO}/releases?per_page=20`

export type Os = 'windows' | 'macos'

/** Kind of a downloadable asset; the page names each kind from the catalog */
export type AssetKind = 'winSetup' | 'winZip' | 'dmg' | 'macZip'

export interface Asset {
  name: string
  size: number
  browser_download_url: string
}

export interface Release {
  tag_name: string
  published_at: string
  draft: boolean
  assets: Asset[]
}

export interface Build {
  version: string
  url: string
  sizeMb: number
}

const KINDS: readonly { kind: AssetKind; os: Os; test: RegExp }[] = [
  { kind: 'winSetup', os: 'windows', test: /\.exe$/i },
  { kind: 'winZip', os: 'windows', test: /win32.*\.zip$/i },
  { kind: 'dmg', os: 'macos', test: /\.dmg$/i },
  { kind: 'macZip', os: 'macos', test: /darwin.*\.zip$/i },
]

/** Kind of an asset, or undefined for files that are not builds for people (SBOM and the like) */
export const kindOf = (name: string): AssetKind | undefined => KINDS.find((entry) => entry.test.test(name))?.kind

const osOf = (kind: AssetKind): Os => KINDS.find((entry) => entry.kind === kind)?.os ?? 'windows'

/** Only app releases: helper releases (models, video tools) are not downloads for people */
export const appReleases = (all: readonly Release[]): Release[] =>
  all.filter((release) => /^v\d+\.\d+\.\d+$/.test(release.tag_name) && !release.draft)

/** Newest build of one platform, preferring the installer to the archive */
export const newestBuild = (releases: readonly Release[], os: Os): Build | undefined => {
  for (const release of releases) {
    const candidates = release.assets
      .map((asset) => ({ asset, kind: kindOf(asset.name) }))
      .filter((entry) => entry.kind !== undefined && osOf(entry.kind) === os)
      .sort((a, b) => KINDS.findIndex((k) => k.kind === a.kind) - KINDS.findIndex((k) => k.kind === b.kind))
    const best = candidates[0]
    if (best !== undefined) {
      return { version: release.tag_name, url: best.asset.browser_download_url, sizeMb: toMb(best.asset.size) }
    }
  }
  return undefined
}

export const toMb = (bytes: number): number => Math.round(bytes / 1024 / 1024)
