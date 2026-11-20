import { useCallback, useEffect, useState } from 'react'

import { apiFetch } from '../../api/client'
import { useClub } from '../../api/club'
import CanchasAhora from '../../components/DashboardPage/CanchasAhora'
import ConsolaActividad from '../../components/DashboardPage/ConsolaActividad'
import DashboardKpis from '../../components/DashboardPage/DashboardKpis'
import PorConfirmar from '../../components/DashboardPage/PorConfirmar'
import RestoDelDia from '../../components/DashboardPage/RestoDelDia'
import { diaRelativo, hoyISO, useAhora } from '../../components/DashboardPage/tiempo'
import './DashboardPage.css'

const REFRESCO_MS = 30000
const MAX_EVENTOS = 14

function saludo(date) {
  const hora = date.getHours()
  if (hora < 6 || hora >= 20) return 'Buenas noches'
  if (hora < 13) return 'Buen día'
  return 'Buenas tardes'
}

function fechaLarga(date) {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date)
}

/** Eventos de la consola a partir de las marcas de tiempo de cada reserva. */
function armarEventos(reservas) {
  const eventos = []
  for (const r of reservas) {
    const turno = `${r.cancha_nombre}, ${diaRelativo(r.fecha)} ${r.hora_inicio.slice(0, 5)}`
    eventos.push({ id: `${r.id}-nueva`, fecha: new Date(r.creado_en), tipo: 'nueva', texto: `${r.nombre_cliente} reservó ${turno}` })
    if (r.confirmado_en) {
      eventos.push({ id: `${r.id}-sena`, fecha: new Date(r.confirmado_en), tipo: 'sena', texto: `seña confirmada de ${r.nombre_cliente}, ${turno}` })
    }
    if (r.estado === 'EXPIRADA' && r.expira_en) {
      eventos.push({ id: `${r.id}-vencida`, fecha: new Date(r.expira_en), tipo: 'vencida', texto: `${r.nombre_cliente} no envió la seña, se liberó ${turno}` })
    }
  }
  return eventos.sort((a, b) => a.fecha - b.fecha).slice(-MAX_EVENTOS)
}

function DashboardPage() {
  const club = useClub()
  const ahora = useAhora(1000)
  const [datos, setDatos] = useState({ reservas: [], grilla: [], config: null })
  const [actualizado, setActualizado] = useState(null)
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const cargar = useCallback(async () => {
    const [reservas, grilla, config] = await Promise.all([
      apiFetch('/reservas?filtro=proximas'),
      apiFetch(`/canchas/grilla?fecha=${hoyISO()}`),
      apiFetch('/config'),
    ])
    setDatos({ reservas, grilla, config })
    setActualizado(new Date())
    setError('')
  }, [])

  useEffect(() => {
    let activo = true
    const refrescar = () => cargar().catch((e) => { if (activo) setError(e.message) })
    refrescar()
    const id = setInterval(refrescar, REFRESCO_MS)
    return () => {
      activo = false
      clearInterval(id)
    }
  }, [cargar])

  async function accion(id, nombre) {
    setOcupado(true)
    try {
      await apiFetch(`/reservas/${id}/${nombre}`, { method: 'PATCH' })
      window.dispatchEvent(new Event('reservas-cambiaron'))
      await cargar()
    } catch (e) {
      setError(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const cargando = actualizado === null
  const duracion = datos.config?.duracion_turno ?? 90
  const pendientes = datos.reservas
    .filter((r) => r.estado === 'PENDIENTE')
    .sort((a, b) => new Date(a.expira_en ?? 0) - new Date(b.expira_en ?? 0))
  const nombreClub = club?.club_nombre || 'tu club'

  return (
    <div className="dash">
      <header className="dash-cabecera">
        <div>
          <h1 className="dash-titulo">{saludo(ahora)}</h1>
          <p className="dash-fecha">{fechaLarga(ahora)}</p>
        </div>
        <time className="dash-reloj" dateTime={ahora.toISOString()} aria-label="Hora actual">
          {ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
        </time>
      </header>

      {error && <p className="dash-error" role="alert">{error}</p>}

      <DashboardKpis grilla={datos.grilla} pendientes={pendientes} precio={datos.config?.precio_cancha_default} ahora={ahora} cargando={cargando} />

      <div className="dash-columnas">
        <div className="dash-principal">
          {!cargando && datos.grilla.length > 0 && <CanchasAhora grilla={datos.grilla} duracion={duracion} ahora={ahora} />}
          <PorConfirmar
            pendientes={pendientes}
            club={nombreClub}
            ahora={ahora}
            ocupado={ocupado}
            onConfirmar={(id) => accion(id, 'confirmar')}
            onCancelar={(id) => accion(id, 'cancelar')}
          />
          {!cargando && <RestoDelDia grilla={datos.grilla} duracion={duracion} ahora={ahora} />}
        </div>
        <ConsolaActividad eventos={armarEventos(datos.reservas)} club={nombreClub} actualizado={actualizado} ahora={ahora} />
      </div>
    </div>
  )
}

export default DashboardPage
