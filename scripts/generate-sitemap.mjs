import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(resolve(__dirname, '../public/data.json'), 'utf-8'))

const BASE = 'https://gnulinuxbe.github.io'
const now = new Date().toISOString()

const urls = [
  { loc: `${BASE}/`, lastmod: now, freq: 'weekly', priority: '1.0' },
]

for (const cat of data.categories) {
  urls.push({ loc: `${BASE}/${cat.id}/`, lastmod: now, freq: 'weekly', priority: '0.8' })
  for (const item of cat.items) {
    const lastmod = item.updatedAt
      ? new Date(item.updatedAt).toISOString()
      : now
    urls.push({ loc: `${BASE}/${cat.id}/${item.id}/`, lastmod, freq: 'monthly', priority: '0.6' })
    if (item.apps?.length) {
      for (const app of item.apps) {
        urls.push({ loc: `${BASE}/${cat.id}/${item.id}/${app.id}/`, lastmod, freq: 'monthly', priority: '0.5' })
      }
    }
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`

writeFileSync(resolve(__dirname, '../public/sitemap.xml'), xml, 'utf-8')
console.log(`sitemap.xml: ${urls.length} urls`)
