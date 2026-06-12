import type { Metadata } from 'next'
import ItemPage from './ItemPage'
import dataJson from '../../../../public/data.json'

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
  const title = `${item.name} — Linux па-беларуску`
  const description = (item.description || '').replace(/[#*[\]`]/g, '').slice(0, 160)
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: item.bannerUrl ? [item.bannerUrl] : item.iconUrl ? [item.iconUrl] : ['/banner.png'],
      type: 'website',
    },
  }
}

export default function Page() {
  return <ItemPage />
}
