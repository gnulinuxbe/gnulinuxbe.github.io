import type { Metadata } from 'next'
import ItemPage from './ItemPage'
import dataJson from '../../../../public/data.json'

const BASE = 'https://gnulinuxbe.github.io'

export function generateStaticParams() {
  const params = (dataJson as any).categories.flatMap((c: any) =>
    c.items.map((i: any) => ({ categoryId: c.id, itemId: i.id }))
  )
  return params.length > 0 ? params : [{ categoryId: '_', itemId: '_' }]
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string; itemId: string }> }): Promise<Metadata> {
  const { categoryId, itemId } = await params
  const cat  = (dataJson as any).categories.find((c: any) => c.id === categoryId)
  const item = cat?.items.find((i: any) => i.id === itemId)
  if (!item) return {}
  const title = item.name
  const description = (item.description || '').replace(/[#*[\]`]/g, '').slice(0, 160)
  const image = item.bannerUrl || item.iconUrl || '/banner.png'
  const url = `${BASE}/${categoryId}/${itemId}/`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      images: [{ url: image, alt: item.name }],
      type: 'website',
      url,
    },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function Page({ params }: { params: Promise<{ categoryId: string; itemId: string }> }) {
  const { categoryId, itemId } = await params
  const cat  = (dataJson as any).categories.find((c: any) => c.id === categoryId)
  const item = cat?.items.find((i: any) => i.id === itemId)

  const jsonLd = item ? {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: item.name,
    description: (item.description || '').replace(/[#*[\]`]/g, '').slice(0, 300),
    inLanguage: 'be',
    url: `${BASE}/${categoryId}/${itemId}/`,
    ...(item.iconUrl ? { image: item.iconUrl } : {}),
    ...(item.tags?.length ? { keywords: item.tags.join(', ') } : {}),
    ...(item.updatedAt ? { dateModified: item.updatedAt } : {}),
    isAccessibleForFree: true,
  } : null

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>}
      <ItemPage initialData={dataJson as any}/>
    </>
  )
}
