import type { Metadata } from 'next'
import CatPage from './CatPage'
import dataJson from '../../../public/data.json'

const BASE = 'https://gnulinuxbe.github.io'

export function generateStaticParams() {
  const cats = (dataJson as any).categories.map((c: any) => ({ categoryId: c.id }))
  return cats.length > 0 ? cats : [{ categoryId: '_' }]
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string }> }): Promise<Metadata> {
  const { categoryId } = await params
  const cat = (dataJson as any).categories.find((c: any) => c.id === categoryId)
  if (!cat) return {}
  const title = cat.name
  const description = cat.sub ? `${cat.sub} — Linux па-беларуску` : 'Linux па-беларуску'
  const url = `${BASE}/${categoryId}/`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      images: [{ url: cat.bannerUrl || '/banner.png', alt: cat.name }],
      type: 'website',
      url,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function Page({ params }: { params: Promise<{ categoryId: string }> }) {
  const { categoryId } = await params
  const cat = (dataJson as any).categories.find((c: any) => c.id === categoryId)

  const jsonLd = cat ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.name,
    description: cat.sub || '',
    url: `${BASE}/${categoryId}/`,
    inLanguage: 'be',
    numberOfItems: cat.items.length,
  } : null

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}/>}
      <CatPage initialData={dataJson as any}/>
    </>
  )
}
