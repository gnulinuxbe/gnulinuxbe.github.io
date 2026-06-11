import ItemPage from './ItemPage'
import dataJson from '../../../../public/data.json'

export function generateStaticParams() {
  const params = (dataJson as any).categories.flatMap((c: any) =>
    c.items.map((i: any) => ({ categoryId: c.id, itemId: i.id }))
  )
  return params.length > 0 ? params : [{ categoryId: '_', itemId: '_' }]
}

export default function Page() {
  return <ItemPage />
}
