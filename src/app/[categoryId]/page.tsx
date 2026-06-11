import CatPage from './CatPage'
import dataJson from '../../../public/data.json'

export function generateStaticParams() {
  const cats = (dataJson as any).categories.map((c: any) => ({ categoryId: c.id }))
  return cats.length > 0 ? cats : [{ categoryId: '_' }]
}

export default function Page() {
  return <CatPage />
}
