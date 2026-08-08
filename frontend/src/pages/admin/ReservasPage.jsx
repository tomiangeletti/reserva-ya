import { useCallback, useEffect, useRef, useState } from 'react'

import { apiFetch } from '../../api/client'
import './ReservasPage.css'

const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EXPIRADA: 'Expirada',
  CANCELADA: 'Cancelada',
}

function ReservasPage() {
  const [filtro, setFiltro] = useState('proximas')
  const [busqueda, setBusqueda] = useState('')
  const busquedaRef = useRef('')
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(
    async (q = '') => {
      setError('')
      try {
        const params = new URLSearchParams({ filtro })
        if (q.trim()) params.set('busqueda', q.trim())
        setReservas(await apiFetch(`/reservas?${params.toString()}`))
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    },
    [filtro],
  )

  useEffect(() => {
    cargar(busquedaRef.current)
  }, [cargar])

  function cambiarFiltro(nuevo) {
    setLoading(true)
    setFiltro(nuevo)
  }

  async function accion(id, accionNombre) {
    setError('')
    try {
      await apiFetch(`/reservas/${id}/${accionNombre}`, { method: 'PATCH' })
      setLoading(true)
      cargar(busquedaRef.current)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="reservas-page">
      <h1 className="admin-title">Reservas</h1>

      <div className="reservas-controls">
        <div className="reservas-tabs">
          <button
            className={`reserva-tab${filtro === 'hoy' ? ' active' : ''}`}
            onClick={() => cambiarFiltro('hoy')}
          >
            Hoy
          </button>
          <button
            className={`reserva-tab${filtro === 'proximas' ? ' active' : ''}`}
            onClick={() => cambiarFiltro('proximas')}
          >
            Próximas
          </button>
          <button
            className={`reserva-tab${filtro === 'todas' ? ' active' : ''}`}
            onClick={() => cambiarFiltro('todas')}
          >
            Todas
          </button>
        </div>
        <form
          className="reservas-search"
          onSubmit={(e) => {
            e.preventDefault()
            setLoading(true)
            cargar(busquedaRef.current)
          }}
        >
          <input
            className="config-input"
            placeholder="Buscar por cliente o teléfono"
            value={busqueda}
            onChange={(e) => {
              busquedaRef.current = e.target.value
              setBusqueda(e.target.value)
            }}
          />
          <button className="mini-btn" type="submit">
            Buscar
          </button>
        </form>
      </div>

      {error && <p className="login-error">{error}</p>}
      {loading && <p className="admin-hint">Cargando…</p>}
      {!loading && reservas.length === 0 && <p className="admin-hint">No hay reservas.</p>}

      {!loading && reservas.length > 0 && (
        <div className="reservas-table-wrap">
          <table className="reservas-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Cancha</th>
                <th>Cliente</th>
                <th>Teléfono</th>
                <th>Precio</th>
                <th>Seña</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r) => (
                <tr key={r.id}>
                  <td>{r.fecha}</td>
                  <td>{r.hora_inicio.slice(0, 5)}</td>
                  <td>{r.cancha_nombre}</td>
                  <td>{r.nombre_cliente}</td>
                  <td>{r.telefono_cliente}</td>
                  <td>${Number(r.precio_cancha).toLocaleString('es-AR')}</td>
                  <td>${Number(r.monto_senia).toLocaleString('es-AR')}</td>
                  <td>
                    <span className={`estado-badge ${r.estado.toLowerCase()}`}>
                      {ESTADO_LABEL[r.estado] ?? r.estado}
                    </span>
                  </td>
                  <td>
                    <div className="list-actions">
                      {r.estado === 'PENDIENTE' && (
                        <button className="mini-btn" onClick={() => accion(r.id, 'confirmar')}>
                          Confirmar
                        </button>
                      )}
                      {(r.estado === 'PENDIENTE' || r.estado === 'CONFIRMADA') && (
                        <button className="mini-btn danger" onClick={() => accion(r.id, 'cancelar')}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ReservasPage
