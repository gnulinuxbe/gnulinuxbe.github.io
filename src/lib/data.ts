import type { SiteData } from '@/types'

let cache: SiteData | null = null

export async function loadData(): Promise<SiteData> {
  if (cache) return cache
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const res = await fetch(`${base}/data.json`, { cache: 'no-store' })
  cache = await res.json()
  return cache!
}

export function bust() { cache = null }

export async function saveData(data: SiteData) {
  bust()
  const res = await fetch('/api/save/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Save failed')
}

export async function uploadFile(file: File, name: string): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('name', name)
  const res = await fetch('/api/upload/', { method: 'POST', body: fd })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error)
  return json.url
}

export function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export function allTags(data: SiteData): string[] {
  const s = new Set<string>()
  data.categories.forEach(c => c.items.forEach(i => i.tags.forEach(t => s.add(t))))
  return Array.from(s).sort()
}
