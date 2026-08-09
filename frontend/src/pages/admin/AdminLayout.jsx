import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from '../../api/auth'
import { apiFetch } from '../../api/client'
import AdminSidebar from '../../components/AdminLayout/AdminSidebar'
import './AdminLayout.css'

function AdminLayout() {
  const { isAuthenticated, logout } = useAuth()
  const [pendientes, setPendientes] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return
    let activo = true
    const cargar = () =>
      apiFetch('/reservas/pendientes/count')
        .then((d) => {
          if (activo) setPendientes(d.count)
        })
        .catch(() => {})
    cargar()
    const id = setInterval(cargar, 30000)
    return () => {
      activo = false
      clearInterval(id)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="admin-shell">
      <AdminSidebar pendientes={pendientes} onLogout={logout} />
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
