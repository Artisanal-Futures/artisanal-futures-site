'use server'

import { notFound } from 'next/navigation'

import { DatabaseMigrationClient } from '../_components/product-migration-client'
import { AdminClientLayout } from '../../_components/client-layout'

export default async function DatabaseMigrationPage() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return (
    <AdminClientLayout currentPage="Migrate Products" title="Migrate Products">
      <DatabaseMigrationClient />
    </AdminClientLayout>
  )
}
