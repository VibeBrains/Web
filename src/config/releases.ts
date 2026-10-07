import type { KindRule } from '@vibebrains/site-kit/releases'
import { releasesApi } from '@vibebrains/site-kit/releases'
import { REPO } from './site'

/**
 * VibeIDE builds: releases are per platform, a macOS-only fix makes "latest" a macOS release,
 * so each button looks for the newest build of its own platform; the installer wins over the archive
 */
export const RELEASES_API = releasesApi(REPO, 20)

export type Os = 'windows' | 'macos'

export type AssetKind = 'winSetup' | 'winZip' | 'dmg' | 'macZip'

export const KINDS: readonly KindRule<AssetKind, Os>[] = [
  { kind: 'winSetup', os: 'windows', test: /\.exe$/i },
  { kind: 'winZip', os: 'windows', test: /win32.*\.zip$/i },
  { kind: 'dmg', os: 'macos', test: /\.dmg$/i },
  { kind: 'macZip', os: 'macos', test: /darwin.*\.zip$/i },
]

/** Platforms with a download button, in the order of the buttons */
export const OSES: readonly Os[] = ['windows', 'macos']

/** How many releases the releases panel lists */
export const RELEASES_SHOWN = 3
