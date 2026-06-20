import type { Item, AppEntry } from '@/types'

export interface ProgressEntry {
  pct: number
  words_translated: number
  words_total: number
}

export interface ProgressData {
  updated: string
  language: string
  crowdin: Record<string, ProgressEntry | { _error: string }>
  weblate: Record<string, ProgressEntry | { _error: string }>
  github:  Record<string, ProgressEntry | { _error: string }>
}

export interface ItemProgressEntry {
  key: string
  platform: 'crowdin' | 'weblate' | 'github'
  pct: number
  words_translated: number
  words_total: number
}

type Platform = { links?: { type: string; url: string }[] }

function ok(s: ProgressEntry | { _error: string } | undefined): s is ProgressEntry {
  return !!s && !('_error' in s)
}

// Core: extract progress from any list of platforms
export function getProgressFromPlatforms(
  platforms: Platform[],
  data: ProgressData,
): ItemProgressEntry[] {
  const results: ItemProgressEntry[] = []
  const seen = new Set<string>()

  const add = (
    key: string,
    bucket: 'crowdin' | 'weblate' | 'github',
    store: Record<string, ProgressEntry | { _error: string }>,
  ) => {
    if (seen.has(key)) return
    seen.add(key)
    const s = store?.[key]
    if (ok(s)) results.push({ key, platform: bucket, ...s })
  }

  for (const plat of platforms) {
    for (const link of (plat.links ?? [])) {
      if (link.type !== 'translate') continue
      const url = link.url

      // Crowdin
      const cm = url.match(/crowdin\.com\/project\/([^/?#\s]+)/)
      if (cm) { add(cm[1], 'crowdin', data.crowdin); continue }

      // hosted.weblate.org
      const wm = url.match(/hosted\.weblate\.org\/projects\/([^/]+)\/([^/]+)/)
      if (wm) {
        const [, proj, comp] = wm
        add(comp === '-' ? proj : `${proj}/${comp}`, 'weblate', data.weblate)
        continue
      }

      // translate.element.io
      const em = url.match(/translate\.element\.io\/projects\/([^/]+)\/([^/]+)/)
      if (em) {
        const [, proj, comp] = em
        add(comp === '-' ? `element:${proj}` : `element:${proj}/${comp}`, 'weblate', data.weblate)
        continue
      }

      // GitHub .po
      if (url.includes('github.com/duckduckgo/duckduckgo-locales')) {
        add('duckduckgo', 'github', data.github)
        continue
      }
    }
  }

  return results
}

// For a full item (uses item.platforms + all apps' platforms — for the card in "solo" mode)
export function getItemProgress(item: Item, data: ProgressData): ItemProgressEntry[] {
  const allPlatforms: Platform[] = [
    ...(item.platforms ?? []),
    ...(item.apps?.flatMap(a => a.platforms) ?? []),
  ]
  return getProgressFromPlatforms(allPlatforms, data)
}

// For a single AppEntry (shows progress only for that specific app)
export function getAppProgress(app: AppEntry, data: ProgressData): ItemProgressEntry[] {
  return getProgressFromPlatforms(app.platforms ?? [], data)
}

export function avgPct(entries: ItemProgressEntry[]): number | null {
  if (!entries.length) return null
  const totalWords = entries.reduce((s, e) => s + e.words_total, 0)
  if (totalWords === 0) {
    return Math.round(entries.reduce((s, e) => s + e.pct, 0) / entries.length)
  }
  const translated = entries.reduce((s, e) => s + e.words_translated, 0)
  return Math.round(translated / totalWords * 100)
}

export function pctColor(pct: number): string {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
}

export async function fetchProgress(): Promise<ProgressData | null> {
  try {
    const r = await fetch('/progress.json', { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch {
    return null
  }
}
