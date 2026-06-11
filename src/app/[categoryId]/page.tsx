import CatPage from './CatPage'
import dataJson from '../../../public/data.json'

export function generateStaticParams() {
  return (dataJson as any).categories.map((c: any) => ({ categoryId: c.id }))
}

export default function Page() {
  return <CatPage />
}
