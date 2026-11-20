import { NavLink } from 'react-router-dom'
import { CalendarDays, CircleHelp, Grid2X2, KeyRound, LayoutDashboard, LogOut, Settings } from 'lucide-react'

import { useClub } from '../../api/club'
import Button2 from '../ui/button-2'

const GRUPOS = [
  {
    titulo: 'Gestión',
    links: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/reservas', label: 'Reservas', icon: CalendarDays, pendientes: true },
      { to: '/admin/canchas', label: 'Canchas y turnos', icon: Grid2X2 },
      { to: '/admin/config', label: 'Configuración', icon: Settings },
    ],
  },
  {
    titulo: 'Cuenta',
    links: [
      { to: '/admin/cambiar-password', label: 'Cambiar contraseña', icon: KeyRound },
      { to: '/admin/ayuda', label: 'Ayuda', icon: CircleHelp },
    ],
  },
]

function AdminSidebar({ pendientes, onLogout }) {
  const club = useClub()

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <img className="sidebar-mark" src="/favicon-ry.svg" alt="" />
        <div className="sidebar-brand-info">
          <span className="sidebar-name">{club?.club_nombre || 'Reservas ya'}</span>
          <span className="sidebar-rol">Panel del club</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Panel de administración">
        {GRUPOS.map((grupo) => (
          <div key={grupo.titulo} className="sidebar-grupo">
            <p className="sidebar-grupo-titulo" id={`sidebar-${grupo.titulo}`}>{grupo.titulo}</p>
            <ul className="sidebar-lista" aria-labelledby={`sidebar-${grupo.titulo}`}>
              {grupo.links.map(({ to, label, icon: Icon, end, pendientes: conPendientes }) => (
                <li key={to}>
                  <NavLink to={to} end={end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                    <Icon className="sidebar-icono" size={16} strokeWidth={2} aria-hidden="true" />
                    <span className="sidebar-link-texto">{label}</span>
                    {conPendientes && pendientes > 0 && (
                      <span className="sidebar-badge" aria-label={`${pendientes} pendientes`}>{pendientes}</span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="sidebar-pie">
        <Button2 className="sidebar-logout btn2-peligro" onClick={onLogout}>
          <span className="sidebar-logout-texto">Cerrar sesión</span>
          <LogOut className="sidebar-logout-icono" size={16} strokeWidth={2} aria-hidden="true" />
        </Button2>
      </div>
    </aside>
  )
}

export default AdminSidebar
