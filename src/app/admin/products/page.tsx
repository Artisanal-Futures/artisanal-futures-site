import { api } from '~/trpc/server'
import { AdminClientLayout } from '../_components/client-layout'
import { ProductClient } from './_components/product-client'

export const metadata = {
  title: 'Projects',
}

export default async function ProjectsAdminPage() {
  const products = await api.product.getAll()

  return (
    <AdminClientLayout currentPage="Projects" title="Projects">
      <ProductClient products={products} />
    </AdminClientLayout>
  )
}
