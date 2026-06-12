import type { Metadata } from 'next'
import CatPage from './CatPage'
import dataJson from '../../../public/data.json'

export function generateStaticParams() {
  const cats = (dataJson as any).categories.map((c: any) => ({ categoryId: c.id }))
  return cats.length > 0 ? cats : [{ categoryId: '_' }]
}

export async function generateMetadata({ params }: { params: Promise<{ categoryId: string }> }): Promise<Metadata> {
  const { categoryId } = await params
  const cat = (dataJson as any).categories.find((c: any) => c.id === categoryId)
  if (!cat) return {}
  const title = `${cat.name} — Linux па-беларуску`
  const description = cat.sub || ''
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: cat.bannerUrl ? [cat.bannerUrl] : ['/banner.png'],
      type: 'website',
    },
  }
}

export default function Page() {
  return <CatPage />
}
