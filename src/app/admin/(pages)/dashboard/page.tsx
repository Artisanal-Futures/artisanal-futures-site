import AdminClientLayout from '../../_components/layout/admin-client-layout'

export const metadata = {
  title: 'Admin Dashboard',
}

export default function AdminPage() {
  return (
    <AdminClientLayout currentPage="Dashboard" title="Dashboard">
      <div className="flex items-center justify-center p-8">
        <p className="text-lg text-muted-foreground">
          🚧 Dashboard is under construction 🚧
        </p>
      </div>
    </AdminClientLayout>
  )
}
