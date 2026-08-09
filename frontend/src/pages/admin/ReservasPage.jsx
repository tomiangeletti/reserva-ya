import { useCallback, useEffect, useRef, useState } from 'react'

import { apiFetch } from '../../api/client'
import ReservasControls from '../../components/ReservasPage/ReservasControls'
import ReservasTable from '../../components/ReservasPage/ReservasTable'
import './ReservasPage.css'

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

  function buscar(e) {
    e.preventDefault()
    setLoading(true)
    cargar(busquedaRef.current)
  }

  return (
    <div className="reservas-page">
      <h1 className="admin-title">Reservas</h1>
      <ReservasControls
        filtro={filtro}
        onFiltroChange={cambiarFiltro}
        busqueda={busqueda}
        onBusquedaChange={(value) => {
          busquedaRef.current = value
          setBusqueda(value)
        }}
        onSearch={buscar}
      />
      {error && <p className="login-error">{error}</p>}
      {loading && <p className="admin-hint">Cargando…</p>}
      {!loading && reservas.length === 0 && <p className="admin-hint">No hay reservas.</p>}
      {!loading && reservas.length > 0 && <ReservasTable reservas={reservas} onAction={accion} />}
    </div>
  )
}

export default ReservasPage
