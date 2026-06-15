import type { Metadata } from 'next'
import AppPage from './AppPage'
import dataJson from '../../../../../public/data.json'

const BASE = 'https://gnulinuxbe.github.io'

export function generateStaticParams() {
  const params = (dataJson as any).categories.flatMap((c: any) =>
    c.items.flatMap((item: any) =>
      (item.apps ?? []).map((app: any) => ({
        categoryId: c.id,
        itemId: item.id,
        appId: app.id,
      }))
    )
  )
  return params.length > 0 ? params : [{ categoryId: '_', itemId: '_', appId: '_' }]
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string; itemId: string; appId: string }> }): Promise<Metadata> {
  const { categoryId, itemId, appId } = await params
  const cat  = (dataJson as any).categories.find((c: any) => c.id === categoryId)
  const item = cat?.items.find((i: any) => i.id === itemId)
  const app  = item?.apps?.find((a: any) => a.id === appId)
  if (!app || !item) return {}
  const title = `${app.name} — ${item.name}`
  const description = (app.description || item.description || '').replace(/[#*[\]`]/g, '').slice(0, 160)
  const image = app.screenshotUrl || app.iconUrl || item.bannerUrl || '/banner.png'
  const url = `${BASE}/${categoryId}/${itemId}/${appId}/`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, images: [{ url: image, alt: app.name }], type: 'website', url },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function Page({ params }: { params: Promise<{ categoryId: string; itemId: string; appId: string }> }) {
  const { categoryId, itemId, appId } = await params
  const cat  = (dataJson as any).categories.find((c: any) => c.id === categoryId)
  const item = cat?.items.find((i: any) => i.id === itemId)
  const app  = item?.apps?.find((a: any) => a.id === appId)

  const jsonLd = app ? {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: (app.description || '').replace(/[#*[\]`]/g, '').slice(0, 300),
    inLanguage: 'be',
    url: `${BASE}/${categoryId}/${itemId}/${appId}/`,
    ...(app.iconUrl ? { image: app.iconUrl } : {}),
    isAccessibleForFree: true,
  } : null

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>}
      <AppPage initialData={dataJson as any}/>
    </>
  )
}
