import { useCallback, useEffect, useState } from 'react'

import { apiFetch } from '../../api/client'
import CanchasControls from '../../components/CanchasPage/CanchasControls'
import CanchasModal from '../../components/CanchasPage/CanchasModal'
import Grilla from '../../components/CanchasPage/Grilla'
import { diaDeFecha, sumar90 } from '../../components/CanchasPage/utils'
import './CanchasPage.css'

function hoyLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function CanchasPage() {
  const [fecha, setFecha] = useState(hoyLocal())
  const [grilla, setGrilla] = useState([])
  const [turnos, setTurnos] = useState([])
  const [bloqueos, setBloqueos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const cargarDatos = useCallback(async (f) => {
    const [g, t, b] = await Promise.all([
      apiFetch(`/canchas/grilla?fecha=${f}`),
      apiFetch('/turnos-fijos'),
      apiFetch(`/bloqueos-puntuales?fecha=${f}`),
    ])
    return { g, t, b }
  }, [])

  const aplicar = useCallback(({ g, t, b }) => {
    setError('')
    setGrilla(g)
    setTurnos(t)
    setBloqueos(b)
  }, [])

  useEffect(() => {
    let activo = true
    cargarDatos(fecha)
      .then((datos) => {
        if (activo) aplicar(datos)
      })
      .catch((e) => {
        if (activo) setError(e.message)
      })
      .finally(() => {
        if (activo) setLoading(false)
      })
    return () => { activo = false }
  }, [cargarDatos, aplicar, fecha])

  function abrirCelda(cancha, slot) {
    setError('')
    const hora = slot.hora_inicio.slice(0, 5)
    const canchaId = cancha.cancha_id

    if (slot.estado === 'libre') {
      setModal({ tipo: 'nuevo', canchaId, canchaNombre: cancha.cancha_nombre, hora, modo: 'bloqueo', nombre: '' })
    } else if (slot.estado === 'turno_fijo') {
      const turno = turnos.find((t) => t.cancha_id === canchaId && t.hora_inicio.slice(0, 5) === hora)
      setModal({ tipo: 'turno_fijo', turno, canchaNombre: cancha.cancha_nombre })
    } else if (slot.estado === 'bloqueo') {
      const bloqueo = bloqueos.find((b) => b.cancha_id === canchaId && b.hora_inicio.slice(0, 5) === hora)
      setModal({ tipo: 'bloqueo', bloqueo, canchaNombre: cancha.cancha_nombre })
    } else {
      setModal({ tipo: 'reserva', slot, canchaNombre: cancha.cancha_nombre })
    }
  }

  async function guardarNuevo() {
    if (!modal || modal.tipo !== 'nuevo') return
    setError('')
    try {
      if (modal.modo === 'bloqueo') {
        await apiFetch('/bloqueos-puntuales', {
          method: 'POST',
          body: { cancha_id: modal.canchaId, fecha, hora_inicio: `${modal.hora}:00`, motivo: modal.nombre },
        })
      } else {
        await apiFetch('/turnos-fijos', {
          method: 'POST',
          body: {
            cancha_id: modal.canchaId,
            dia_semana: diaDeFecha(fecha),
            hora_inicio: `${modal.hora}:00`,
            hora_fin: `${sumar90(modal.hora)}:00`,
            nombre: modal.nombre,
          },
        })
      }
      setModal(null)
      aplicar(await cargarDatos(fecha))
    } catch (e) {
      setError(e.message)
    }
  }

  async function alternarTurno(id) {
    try {
      await apiFetch(`/turnos-fijos/${id}`, { method: 'PATCH' })
      aplicar(await cargarDatos(fecha))
      setModal(null)
    } catch (e) { setError(e.message) }
  }

  async function eliminarTurno(id) {
    try {
      await apiFetch(`/turnos-fijos/${id}`, { method: 'DELETE' })
      aplicar(await cargarDatos(fecha))
      setModal(null)
    } catch (e) { setError(e.message) }
  }

  async function eliminarBloqueo(id) {
    try {
      await apiFetch(`/bloqueos-puntuales/${id}`, { method: 'DELETE' })
      aplicar(await cargarDatos(fecha))
      setModal(null)
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="canchas-page">
      <h1 className="admin-title">Canchas y turnos</h1>
      <p className="admin-hint">Grilla del día: tocá una celda libre para ocuparla (turno fijo o WhatsApp), o una ocupada para ver el detalle y liberarla.</p>
      <CanchasControls fecha={fecha} onFechaChange={setFecha} />
      {error && <p className="login-error">{error}</p>}
      {loading && grilla.length === 0 && <p className="admin-hint">Cargando…</p>}
      {!loading && grilla.length > 0 && <Grilla data={grilla} onCellClick={abrirCelda} />}
      <CanchasModal
        modal={modal}
        fecha={fecha}
        onChange={setModal}
        onClose={() => setModal(null)}
        onSave={guardarNuevo}
        onToggleTurno={alternarTurno}
        onDeleteTurno={eliminarTurno}
        onDeleteBloqueo={eliminarBloqueo}
      />
    </div>
  )
}

export default CanchasPage
