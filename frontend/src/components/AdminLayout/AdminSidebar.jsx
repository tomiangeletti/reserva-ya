import { NavLink } from 'react-router-dom'
import { CalendarDays, CircleHelp, Grid2X2, KeyRound, LayoutDashboard, LogOut, Settings } from 'lucide-react'

function AdminSidebar({ pendientes, onLogout }) {
  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
    { to: '/admin/canchas', label: 'Canchas y turnos', icon: Grid2X2 },
    { to: '/admin/config', label: 'Configuración', icon: Settings },
    { to: '/admin/cambiar-password', label: 'Cambiar contraseña', icon: KeyRound },
    { to: '/admin/ayuda', label: 'Ayuda', icon: CircleHelp },
  ]

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-mark">RY</span>
        <span className="sidebar-name">Reservas ya</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <Icon size={17} strokeWidth={2} />
            {label}
            {label === 'Reservas' && pendientes > 0 && <span className="sidebar-badge">{pendientes}</span>}
          </NavLink>
        ))}
      </nav>
      <button className="sidebar-logout" onClick={onLogout}>
        <LogOut size={17} strokeWidth={2} />
        Cerrar sesión
      </button>
    </aside>
  )
}

export default AdminSidebar
