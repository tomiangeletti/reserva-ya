import { ArrowRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

function DashboardAttention({ loading, pendientes }) {
  return (
    <article className="dashboard-card attention-card">
      <div className="card-heading">
        <div>
          <h2>Pendientes de confirmación</h2>
          <p>Reservas que requieren tu atención</p>
        </div>
        <span className="attention-count">{loading ? '—' : pendientes}</span>
      </div>
      <div className="attention-list">
        <div className="attention-item">
          <span className="attention-mark"><Clock3 size={15} /></span>
          <div>
            <strong>Señas por confirmar</strong>
            <small>{pendientes} reservas esperan comprobante</small>
          </div>
          <Link to="/admin/reservas" aria-label="Ver señas pendientes"><ArrowRight size={17} /></Link>
        </div>
      </div>
      <Link to="/admin/reservas" className="attention-button">Revisar reservas pendientes</Link>
    </article>
  )
}

export default DashboardAttention
