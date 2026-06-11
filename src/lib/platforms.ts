export interface PlatformMeta {
  name: string
  icon: string
  color: string
  bg: string
}

export const PLATFORMS: PlatformMeta[] = [
  { name: 'Android', icon: '🤖', color: '#22c55e', bg: 'rgba(34,197,94,.12)'   },
  { name: 'iOS',     icon: '🍎', color: '#94a3b8', bg: 'rgba(148,163,184,.12)' },
  { name: 'Вэб',     icon: '🌐', color: '#60a5fa', bg: 'rgba(96,165,250,.12)'  },
  { name: 'Linux',   icon: '🐧', color: '#f59e0b', bg: 'rgba(245,158,11,.12)'  },
  { name: 'PC',      icon: '🖥',  color: '#a78bfa', bg: 'rgba(167,139,250,.12)' },
  { name: 'Сайт',    icon: '🔗', color: '#34d399', bg: 'rgba(52,211,153,.12)'  },
]

export function getPlatformMeta(name: string): PlatformMeta {
  return PLATFORMS.find(p => p.name === name)
    ?? { name, icon: '📦', color: '#8892aa', bg: 'rgba(136,146,170,.12)' }
}

export const LINK_TYPES = [
  { value: 'translate', label: 'Перакласці', color: '#ff2d6b', bg: 'rgba(255,45,107,.13)' },
  { value: 'download',  label: 'Спампаваць', color: '#22c55e', bg: 'rgba(34,197,94,.13)'  },
  { value: 'website',   label: 'Адкрыць',    color: '#60a5fa', bg: 'rgba(96,165,250,.13)' },
  { value: 'chat',      label: 'Чат',         color: '#a78bfa', bg: 'rgba(167,139,250,.13)'},
  { value: 'other',     label: 'Іншае',       color: '#8892aa', bg: 'rgba(136,146,170,.13)'},
] as const

export type LinkType = typeof LINK_TYPES[number]['value']

export function getLinkStyle(type: string) {
  return LINK_TYPES.find(t => t.value === type) ?? LINK_TYPES[4]
}

export function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('be', { day: 'numeric', month: 'short', year: 'numeric' })
    || d.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })
}
