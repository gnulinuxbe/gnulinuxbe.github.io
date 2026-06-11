import ItemPage from './ItemPage'
import dataJson from '../../../../public/data.json'

export function generateStaticParams() {
  return (dataJson as any).categories.flatMap((c: any) =>
    c.items.map((i: any) => ({ categoryId: c.id, itemId: i.id }))
  )
}

export default function Page() {
  return <ItemPage />
}
