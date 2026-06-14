import type { MetadataRoute } from 'next'
import dataJson from '../../public/data.json'

const BASE = 'https://gnulinuxbe.github.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: BASE + '/', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  ]

  for (const cat of (dataJson as any).categories) {
    entries.push({
      url: `${BASE}/${cat.id}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })
    for (const item of cat.items) {
      entries.push({
        url: `${BASE}/${cat.id}/${item.id}/`,
        lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      })
    }
  }

  return entries
}
