import { CalendarDays, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
}

function DashboardAgenda({ loading, reservas }) {
  const agenda = [...reservas].sort((a, b) => {
    const hora = a.hora_inicio.localeCompare(b.hora_inicio)
    return hora || a.cancha_nombre.localeCompare(b.cancha_nombre)
  })

  return (
    <article className="dashboard-card agenda-card">
      <div className="card-heading">
        <div>
          <h2>Agenda de hoy</h2>
          <p>Reservas activas ordenadas por horario</p>
        </div>
        <Link to="/admin/reservas" className="card-action">Ver todo <span>→</span></Link>
      </div>
      {loading && <p className="admin-hint dashboard-loading"><RefreshCw size={15} /> Cargando agenda...</p>}
      {!loading && agenda.length === 0 && (
        <div className="dashboard-empty">
          <CalendarDays size={22} />
          <strong>No hay reservas para hoy</strong>
          <span>Cuando ingrese una reserva, aparecerá en esta agenda.</span>
        </div>
      )}
      {!loading && agenda.length > 0 && (
        <div className="agenda-list">
          {agenda.map((reserva) => {
            const color = reserva.estado === 'CONFIRMADA' ? 'success' : 'warning'
            return (
              <div className="agenda-row" key={reserva.id}>
                <time>{reserva.hora_inicio.slice(0, 5)}</time>
                <div className={`agenda-line ${color}`} />
                <div className="agenda-info">
                  <strong>{reserva.nombre_cliente}</strong>
                  <span>{reserva.cancha_nombre}</span>
                </div>
                <span className={`dashboard-status ${color}`}>{ESTADO_LABEL[reserva.estado]}</span>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}

export default DashboardAgenda
