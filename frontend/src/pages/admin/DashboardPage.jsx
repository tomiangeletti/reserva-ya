import { useEffect, useState } from 'react'

import { apiFetch } from '../../api/client'
import DashboardAgenda from '../../components/DashboardPage/DashboardAgenda'
import DashboardAttention from '../../components/DashboardPage/DashboardAttention'
import DashboardStats from '../../components/DashboardPage/DashboardStats'
import './DashboardPage.css'

const ESTADOS_ACTIVOS = new Set(['PENDIENTE', 'CONFIRMADA'])

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

      <DashboardStats
        loading={loading}
        pendientes={pendientes}
        reservasHoy={reservasActivas.length}
        confirmadas={confirmadas}
      />

      <section className="dashboard-grid">
        <DashboardAgenda loading={loading} reservas={reservasActivas} />
        <DashboardAttention loading={loading} pendientes={pendientes} />
      </section>
    </div>
  )
}

export default DashboardPage
