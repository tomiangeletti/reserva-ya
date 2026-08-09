import { AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

function DashboardStats({ loading, pendientes, reservasHoy, confirmadas }) {
  const stats = [
    {
      label: 'Pendientes',
      value: pendientes,
      detail: 'Requieren tu atención',
      icon: AlertCircle,
      className: 'stat-highlight',
      iconClassName: '',
      link: 'Ver reservas',
    },
    {
      label: 'Reservas de hoy',
      value: reservasHoy,
      detail: 'Turnos activos registrados',
      icon: CalendarDays,
      className: '',
      iconClassName: 'stat-icon-soft',
    },
    {
      label: 'Confirmadas',
      value: confirmadas,
      detail: 'Reservas confirmadas para hoy',
      icon: CheckCircle2,
      className: '',
      iconClassName: 'stat-icon-green',
    },
  ]

  return (
    <section className="dashboard-stats" aria-label="Resumen del día">
      {stats.map(({ label, value, detail, icon: Icon, className, iconClassName, link }) => (
        <article className={`dashboard-stat ${className}`} key={label}>
          <div className={`stat-icon ${iconClassName}`}><Icon size={18} /></div>
          <div>
            <span className="stat-label">{label}</span>
            <strong>{loading ? '—' : value}</strong>
            <small>{detail}</small>
          </div>
          {link && <Link to="/admin/reservas" className="stat-link">{link}</Link>}
        </article>
      ))}
    </section>
  )
}

export default DashboardStats
