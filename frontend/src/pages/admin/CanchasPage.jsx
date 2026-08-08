import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../../api/client'
import Grilla from '../../components/Grilla'
import './CanchasPage.css'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const ESTADO_LABEL = {
  reserva_pendiente: 'Reserva pendiente',
  reserva_confirmada: 'Reserva confirmada',
  turno_fijo: 'Turno fijo',
  bloqueo: 'Reservada',
}

function hoyLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function diaDeFecha(fecha) {
  const [y, m, d] = fecha.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

function sumar90(hora) {
  const [h, m] = hora.split(':').map(Number)
  const total = h * 60 + m + 90
  const horas = Math.floor(total / 60) % 24
  return `${String(horas).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
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
    return () => {
      activo = false
    }
  }, [cargarDatos, aplicar, fecha])

  function abrirCelda(cancha, slot) {
    setError('')
    const hora = slot.hora_inicio.slice(0, 5)
    const canchaId = cancha.cancha_id

    if (slot.estado === 'libre') {
      setModal({ tipo: 'nuevo', canchaId, canchaNombre: cancha.cancha_nombre, hora, modo: 'bloqueo', nombre: '' })
      return
    }
    if (slot.estado === 'turno_fijo') {
      const turno = turnos.find(
        (t) => t.cancha_id === canchaId && t.hora_inicio.slice(0, 5) === hora,
      )
      setModal({ tipo: 'turno_fijo', turno, canchaNombre: cancha.cancha_nombre })
      return
    }
    if (slot.estado === 'bloqueo') {
      const bloqueo = bloqueos.find(
        (b) => b.cancha_id === canchaId && b.hora_inicio.slice(0, 5) === hora,
      )
      setModal({ tipo: 'bloqueo', bloqueo, canchaNombre: cancha.cancha_nombre })
      return
    }
    setModal({ tipo: 'reserva', slot, canchaNombre: cancha.cancha_nombre })
  }

  async function guardarNuevo() {
    if (!modal || modal.tipo !== 'nuevo') return
    setError('')
    try {
      if (modal.modo === 'bloqueo') {
        await apiFetch('/bloqueos-puntuales', {
          method: 'POST',
          body: {
            cancha_id: modal.canchaId,
            fecha,
            hora_inicio: `${modal.hora}:00`,
            motivo: modal.nombre,
          },
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
    } catch (e) {
      setError(e.message)
    }
  }

  async function eliminarTurno(id) {
    try {
      await apiFetch(`/turnos-fijos/${id}`, { method: 'DELETE' })
      aplicar(await cargarDatos(fecha))
      setModal(null)
    } catch (e) {
      setError(e.message)
    }
  }

  async function eliminarBloqueo(id) {
    try {
      await apiFetch(`/bloqueos-puntuales/${id}`, { method: 'DELETE' })
      aplicar(await cargarDatos(fecha))
      setModal(null)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="canchas-page">
      <h1 className="admin-title">Canchas y turnos</h1>      <p className="admin-hint">
        Grilla del día: tocá una celda libre para ocuparla (turno fijo o WhatsApp), o una ocupada
        para ver el detalle y liberarla.
      </p>

      <div className="canchas-controls">
        <label className="config-field">
          <span className="config-label">Fecha</span>
          <input
            className="config-input"
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </label>
      </div>

      {error && <p className="login-error">{error}</p>}
      {loading && grilla.length === 0 && <p className="admin-hint">Cargando…</p>}

      {!loading && grilla.length > 0 && (
        <Grilla data={grilla} onCellClick={abrirCelda} />
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modal.tipo === 'nuevo' && (
              <>
                <h3 className="modal-title">
                  Ocupar {modal.hora} hs · {modal.canchaNombre}
                </h3>
                <label className="config-field">
                  <span className="config-label">Tipo</span>
                  <select
                    className="config-input"
                    value={modal.modo}
                    onChange={(e) => setModal((m) => ({ ...m, modo: e.target.value }))}
                  >
                    <option value="bloqueo">Reservada (reserva por WhatsApp)</option>
                    <option value="turno_fijo">
                      Turno fijo todos los {DIAS[diaDeFecha(fecha)]}
                    </option>
                  </select>
                </label>
                <label className="config-field">
                  <span className="config-label">
                    A nombre de
                  </span>
                  <input
                    className="config-input"
                    placeholder="Ej: Juan"
                    value={modal.nombre}
                    onChange={(e) => setModal((m) => ({ ...m, nombre: e.target.value }))}
                  />
                </label>
                {modal.modo === 'turno_fijo' && (
                  <p className="modal-hint">
                    Se repetirá cada {DIAS[diaDeFecha(fecha)]} de {modal.hora} a{' '}
                    {sumar90(modal.hora)} hs.
                  </p>
                )}
                <div className="modal-actions">
                  <button className="mini-btn" onClick={() => setModal(null)}>
                    Cancelar
                  </button>
                  <button className="config-save" onClick={guardarNuevo} disabled={!modal.nombre.trim()}>
                    Ocupar turno
                  </button>
                </div>
              </>
            )}

            {modal.tipo === 'turno_fijo' && modal.turno && (
              <>
                <h3 className="modal-title">
                  Turno fijo · {modal.canchaNombre}
                </h3>
                <p className="modal-hint">
                  <strong>{modal.turno.nombre || 'Sin nombre'}</strong> ·{' '}
                  {DIAS[modal.turno.dia_semana]} de {modal.turno.hora_inicio.slice(0, 5)} a{' '}
                  {modal.turno.hora_fin ? modal.turno.hora_fin.slice(0, 5) : '?'} hs
                  {modal.turno.activo ? '' : ' · inactivo'}
                </p>
                <div className="modal-actions">
                  <button className="mini-btn" onClick={() => setModal(null)}>
                    Volver
                  </button>
                  <button className="mini-btn" onClick={() => alternarTurno(modal.turno.id)}>
                    {modal.turno.activo ? 'Liberar' : 'Reactivar'}
                  </button>
                  <button className="mini-btn danger" onClick={() => eliminarTurno(modal.turno.id)}>
                    Eliminar
                  </button>
                </div>
              </>
            )}

            {modal.tipo === 'bloqueo' && modal.bloqueo && (
              <>
                <h3 className="modal-title">
                  Reservada · {modal.canchaNombre}
                </h3>
                <p className="modal-hint">
                  <strong>{modal.bloqueo.motivo}</strong> · {modal.bloqueo.hora_inicio.slice(0, 5)} hs
                </p>
                <div className="modal-actions">
                  <button className="mini-btn" onClick={() => setModal(null)}>
                    Volver
                  </button>
                  <button className="mini-btn danger" onClick={() => eliminarBloqueo(modal.bloqueo.id)}>
                    Liberar
                  </button>
                </div>
              </>
            )}

            {modal.tipo === 'reserva' && (
              <>
                <h3 className="modal-title">
                  {ESTADO_LABEL[modal.slot.estado]} · {modal.canchaNombre}
                </h3>
                <p className="modal-hint">
                  <strong>{modal.slot.nombre}</strong> · {modal.slot.hora_inicio.slice(0, 5)} hs
                </p>
                <div className="modal-actions">
                  <button className="mini-btn" onClick={() => setModal(null)}>
                    Cerrar
                  </button>
                  <Link className="config-save" to="/admin/reservas">
                    Ir a Reservas
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CanchasPage
