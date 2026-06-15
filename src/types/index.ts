// ─── Link ────────────────────────────────────────────────────────────────────
export interface Link {
  label: string
  url: string
  type: 'translate' | 'download' | 'website' | 'chat' | 'other'
}

// ─── Platform ────────────────────────────────────────────────────────────────
// Now just a named set of links — no description (description lives on AppEntry/Item)
export interface Platform {
  name: string   // Android | iOS | Вэб | Linux | PC
  links: Link[]
}

// ─── AppEntry ────────────────────────────────────────────────────────────────
// One application inside a grouped item (e.g. Ente Photos inside Ente)
export interface AppEntry {
  id: string
  name: string
  iconUrl: string
  screenshotUrl?: string
  description: string   // ONE description for this app (shown regardless of platform)
  platforms: Platform[] // Each platform only has links, no separate description
}

// ─── Item ────────────────────────────────────────────────────────────────────
export interface Item {
  id: string
  name: string
  bannerUrl: string
  iconUrl: string
  screenshotUrl: string
  category: string
  tags: string[]
  createdAt: string
  updatedAt: string

  // SIMPLE mode: one description + platforms with links
  description: string
  platforms: Platform[]

  // GROUPED mode (optional): multiple apps, each with own description + platforms
  apps?: AppEntry[]
}

// ─── Category ────────────────────────────────────────────────────────────────
export interface Category {
  id: string
  name: string
  sub: string
  icon: string
  bannerUrl: string
  contributeUrl: string
  items: Item[]
}

export interface SiteData {
  categories: Category[]
}
