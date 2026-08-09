import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, CalendarDays, CheckCircle2, Clock3, RefreshCw } from 'lucide-react'

import { apiFetch } from '../../api/client'
import './DashboardPage.css'

const ESTADOS_ACTIVOS = new Set(['PENDIENTE', 'CONFIRMADA'])

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
}

function fechaLocalISO() {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset() * 60000
  return new Date(ahora.getTime() - offset).toISOString().slice(0, 10)
}

function formatearFecha(fecha) {
  if (!fecha) return ''
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(anio, mes - 1, dia))
}

function DashboardPage() {
  const [reservas, setReservas] = useState([])
  const [pendientes, setPendientes] = useState(0)
  const [fecha, setFecha] = useState(fechaLocalISO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true

    async function cargarDashboard() {
      try {
        const [reservasHoy, pendientesHoy] = await Promise.all([
          apiFetch('/reservas?filtro=hoy'),
          apiFetch('/reservas/pendientes/count'),
        ])

        if (!activo) return
        setReservas(reservasHoy)
        setPendientes(pendientesHoy.count)
        setFecha(fechaLocalISO())
        setError('')
      } catch (e) {
        if (activo) setError(e.message)
      } finally {
        if (activo) setLoading(false)
      }
    }

    cargarDashboard()
    const id = setInterval(cargarDashboard, 30000)

    return () => {
      activo = false
      clearInterval(id)
    }
  }, [])

  const reservasActivas = reservas.filter((reserva) => ESTADOS_ACTIVOS.has(reserva.estado))
  const confirmadas = reservasActivas.filter((reserva) => reserva.estado === 'CONFIRMADA').length
  const agenda = [...reservasActivas].sort((a, b) => {
    const horaA = a.hora_inicio.localeCompare(b.hora_inicio)
    return horaA || a.cancha_nombre.localeCompare(b.cancha_nombre)
  })

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Panel de administración</p>
          <h1 className="admin-title">Buen día</h1>
          <p className="admin-hint">Este es el resumen de tu club para hoy.</p>
        </div>
        <div className="dashboard-date">
          <span className="dashboard-date-dot" />
          {formatearFecha(fecha)}
        </div>
      </header>

      {error && <p className="admin-error dashboard-error">{error}</p>}

      <section className="dashboard-stats" aria-label="Resumen del día">
        <article className="dashboard-stat stat-highlight">
          <div className="stat-icon"><AlertCircle size={18} /></div>
          <div>
            <span className="stat-label">Pendientes</span>
            <strong>{loading ? '—' : pendientes}</strong>
            <small>Requieren tu atención</small>
          </div>
          <Link to="/admin/reservas" className="stat-link">Ver reservas</Link>
        </article>
        <article className="dashboard-stat">
          <div className="stat-icon stat-icon-soft"><CalendarDays size={18} /></div>
          <div>
            <span className="stat-label">Reservas de hoy</span>
            <strong>{loading ? '—' : reservasActivas.length}</strong>
            <small>Turnos activos registrados</small>
          </div>
        </article>
        <article className="dashboard-stat">
          <div className="stat-icon stat-icon-green"><CheckCircle2 size={18} /></div>
          <div>
            <span className="stat-label">Confirmadas</span>
            <strong>{loading ? '—' : confirmadas}</strong>
            <small>Reservas confirmadas para hoy</small>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-card agenda-card">
          <div className="card-heading">
            <div>
              <h2>Agenda de hoy</h2>
              <p>Reservas activas ordenadas por horario</p>
            </div>
            <Link to="/admin/reservas" className="card-action">Ver todo <ArrowRight size={15} /></Link>
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
              <div><strong>Señas por confirmar</strong><small>{pendientes} reservas esperan comprobante</small></div>
              <Link to="/admin/reservas" aria-label="Ver señas pendientes"><ArrowRight size={17} /></Link>
            </div>
          </div>
          <Link to="/admin/reservas" className="attention-button">Revisar reservas pendientes</Link>
        </article>
      </section>
    </div>
  )
}

export default DashboardPage
