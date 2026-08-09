import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { CalendarDays, CircleHelp, Grid2X2, LayoutDashboard, LogOut, Settings } from 'lucide-react'

import { useAuth } from '../../api/auth'
import { apiFetch } from '../../api/client'
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
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-mark">E</span>
          <span className="sidebar-name">El Túnel</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <LayoutDashboard size={17} strokeWidth={2} />
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/reservas"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <CalendarDays size={17} strokeWidth={2} />
            Reservas
            {pendientes > 0 && <span className="sidebar-badge">{pendientes}</span>}
          </NavLink>
          <NavLink
            to="/admin/canchas"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Grid2X2 size={17} strokeWidth={2} />
            Canchas y turnos
          </NavLink>
          <NavLink
            to="/admin/config"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Settings size={17} strokeWidth={2} />
            Configuración
          </NavLink>
          <NavLink
            to="/admin/ayuda"
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <CircleHelp size={17} strokeWidth={2} />
            Ayuda
          </NavLink>
        </nav>
          <button className="sidebar-logout" onClick={logout}>
            <LogOut size={17} strokeWidth={2} />
            Cerrar sesión
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
