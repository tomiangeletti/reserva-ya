import { useEffect, useState } from 'react'

import { apiFetch } from '../../api/client'
import './ConfiguracionPage.css'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function toTimeInput(value) {
  return value?.slice(0, 5) ?? ''
}

function horasDeGrilla(apertura, cierre) {
  const a = new Date(2000, 0, 1, Number(apertura?.slice(0, 2) ?? 0), Number(apertura?.slice(3, 5) ?? 0))
  let c = new Date(2000, 0, 1, Number(cierre?.slice(0, 2) ?? 0), Number(cierre?.slice(3, 5) ?? 0))
  if (cierre === '23:59') {
    // '23:59' se usa en la config como 'cierra a la medianoche' (00:00).
    c = new Date(2000, 0, 2, 0, 0)
  } else if (c <= a) {
    // Cierre pasada la medianoche (00:00) o una hora menor que la apertura.
    c = new Date(2000, 0, 2, c.getHours(), c.getMinutes())
  }
  const horas = []
  const cur = new Date(a)
  while (cur.getTime() + 90 * 60000 <= c.getTime()) {
    horas.push(
      `${String(cur.getHours()).padStart(2, '0')}:${String(cur.getMinutes()).padStart(2, '0')}`,
    )
    cur.setTime(cur.getTime() + 90 * 60000)
  }
  return horas
}

const TURNO_INICIAL = {
  cancha_id: '',
  dia_semana: 1,
  hora_desde: '',
  hora_hasta: '',
  nombre: '',
}

function ConfiguracionPage() {
  const [form, setForm] = useState(null)
  const [canchas, setCanchas] = useState([])
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showTurno, setShowTurno] = useState(false)
  const [turnoForm, setTurnoForm] = useState(TURNO_INICIAL)

  useEffect(() => {
    Promise.all([apiFetch('/config'), apiFetch('/canchas'), apiFetch('/turnos-fijos')])
      .then(([cfg, cs, ts]) => {
        setForm({
          ...cfg,
          hora_apertura: toTimeInput(cfg.hora_apertura),
          hora_cierre: toTimeInput(cfg.hora_cierre),
        })
        setCanchas(cs)
        setTurnos(ts)
        if (cs.length > 0) {
          setTurnoForm((f) => ({ ...f, cancha_id: cs[0].id }))
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const horas = horasDeGrilla(form?.hora_apertura, form?.hora_cierre)
  const cierreEsMedianoche = form?.hora_cierre === '00:00' || form?.hora_cierre === '23:59'

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)

    const payload = { ...form }
    for (const key of ['hora_apertura', 'hora_cierre']) {
      if (payload[key]) {
        payload[key] = `${payload[key]}:00`
      } else {
        delete payload[key]
      }
    }

    try {
      const updated = await apiFetch('/config', { method: 'PATCH', body: payload })
      setForm({
        ...updated,
        hora_apertura: toTimeInput(updated.hora_apertura),
        hora_cierre: toTimeInput(updated.hora_cierre),
      })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function guardarTurnoFijo(e) {
    e.preventDefault()
    setError('')
    try {
      await apiFetch('/turnos-fijos', {
        method: 'POST',
        body: {
          cancha_id: Number(turnoForm.cancha_id),
          dia_semana: Number(turnoForm.dia_semana),
          hora_inicio: `${turnoForm.hora_desde}:00`,
          hora_fin: turnoForm.hora_hasta ? `${turnoForm.hora_hasta}:00` : null,
          nombre: turnoForm.nombre,
        },
      })
      setTurnoForm({ ...TURNO_INICIAL, cancha_id: canchas[0]?.id ?? '' })
      setShowTurno(false)
      setTurnos(await apiFetch('/turnos-fijos'))
    } catch (err) {
      setError(err.message)
    }
  }

  async function alternarTurno(id) {
    setError('')
    try {
      await apiFetch(`/turnos-fijos/${id}`, { method: 'PATCH' })
      setTurnos(await apiFetch('/turnos-fijos'))
    } catch (err) {
      setError(err.message)
    }
  }

  async function eliminarTurno(id) {
    setError('')
    try {
      await apiFetch(`/turnos-fijos/${id}`, { method: 'DELETE' })
      setTurnos(await apiFetch('/turnos-fijos'))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading && !form) {
    return <p className="admin-hint">Cargando…</p>
  }

  if (!form) {
    return <p className="admin-error">{error || 'No se pudo cargar la configuración'}</p>
  }

  return (
    <div className="config-page">
      <h1 className="admin-title">Configuración</h1>
      <p className="admin-hint">Precios, seña, horarios, datos del club y turnos fijos.</p>

      <form className="config-card" onSubmit={handleSubmit}>
        <h2 className="config-section-title">Precios y seña</h2>
        <div className="config-grid">
          <label className="config-field">
            <span className="config-label">Precio por turno ($)</span>
            <input
              className="config-input"
              name="precio_cancha_default"
              type="number"
              min="0"
              step="100"
              value={form.precio_cancha_default}
              onChange={handleChange}
              required
            />
          </label>
          <label className="config-field">
            <span className="config-label">Seña ($)</span>
            <input
              className="config-input"
              name="monto_senia_default"
              type="number"
              min="0"
              step="100"
              value={form.monto_senia_default}
              onChange={handleChange}
              required
            />
          </label>
          <label className="config-field">
            <span className="config-label">Adicional pelotas ($)</span>
            <input
              className="config-input"
              name="adicional_pelotas"
              type="number"
              min="0"
              step="100"
              value={form.adicional_pelotas}
              onChange={handleChange}
              required
            />
          </label>
        </div>

        <h2 className="config-section-title">Horarios</h2>
        <div className="config-grid">
          <label className="config-field">
            <span className="config-label">Hora de apertura</span>
            <input
              className="config-input"
              name="hora_apertura"
              type="time"
              value={form.hora_apertura}
              onChange={handleChange}
            />
          </label>
          <label className="config-field">
            <span className="config-label">Hora de cierre</span>
            <input
              className="config-input"
              name="hora_cierre"
              type="time"
              value={form.hora_cierre}
              onChange={handleChange}
            />
          </label>
        </div>

        <h2 className="config-section-title">Datos del club</h2>
        <label className="config-field">
          <span className="config-label">Dirección</span>
          <input
            className="config-input"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
          />
        </label>
        <label className="config-field">
          <span className="config-label">Alias de transferencia</span>
          <input
            className="config-input"
            name="alias_transferencia"
            value={form.alias_transferencia}
            onChange={handleChange}
          />
        </label>
        <label className="config-field">
          <span className="config-label">Teléfono de WhatsApp</span>
          <input
            className="config-input"
            name="telefono_whatsapp"
            type="tel"
            placeholder="Ej: 5491100000000"
            value={form.telefono_whatsapp}
            onChange={handleChange}
          />
        </label>

        {error && <p className="login-error">{error}</p>}
        {saved && <p className="config-saved">Cambios guardados.</p>}

        <div className="config-actions">
          <button className="config-save" type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>

      <section className="config-card">
        <div className="config-card-header">
          <div>
            <h2 className="config-section-title">Turnos fijos</h2>
            <p className="admin-hint">Ocupan la cancha todas las semanas en ese horario.</p>
          </div>
          <button
            className="config-save"
            type="button"
            onClick={() => setShowTurno((v) => !v)}
          >
            {showTurno ? 'Cancelar' : 'Agregar turno fijo'}
          </button>
        </div>

        {showTurno && (
          <form className="turno-form" onSubmit={guardarTurnoFijo}>
            <label className="config-field">
              <span className="config-label">Cancha</span>
              <select
                className="config-input"
                value={turnoForm.cancha_id}
                onChange={(e) => setTurnoForm((f) => ({ ...f, cancha_id: e.target.value }))}
                required
              >
                {canchas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="config-field">
              <span className="config-label">Día</span>
              <select
                className="config-input"
                value={turnoForm.dia_semana}
                onChange={(e) => setTurnoForm((f) => ({ ...f, dia_semana: e.target.value }))}
              >
                {DIAS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="config-field">
              <span className="config-label">Desde</span>
              <select
                className="config-input"
                value={turnoForm.hora_desde}
                onChange={(e) =>
                  setTurnoForm((f) => {
                    const desde = e.target.value
                    const siguiente =
                      horas[horas.indexOf(desde) + 1] ??
                      (cierreEsMedianoche ? '00:00' : '')
                    return { ...f, hora_desde: desde, hora_hasta: siguiente }
                  })
                }
                required
              >
                <option value="">—</option>
                {horas.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
            <label className="config-field">
              <span className="config-label">Hasta</span>
              <select
                className="config-input"
                value={turnoForm.hora_hasta}
                onChange={(e) => setTurnoForm((f) => ({ ...f, hora_hasta: e.target.value }))}
                required
              >
                <option value="">—</option>
                {horas
                  .filter((h) => h > turnoForm.hora_desde)
                  .map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                {cierreEsMedianoche && (
                  <option value="00:00">00:00</option>
                )}
              </select>
            </label>
            <label className="config-field">
              <span className="config-label">A nombre de</span>
              <input
                className="config-input"
                value={turnoForm.nombre}
                onChange={(e) => setTurnoForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Liga de Fulano"
                required
              />
            </label>
            <div className="config-actions">
              <button
                className="config-save"
                type="submit"
                disabled={!turnoForm.nombre.trim() || !turnoForm.hora_desde || !turnoForm.hora_hasta}
              >
                Guardar turno fijo
              </button>
            </div>
          </form>
        )}

        {turnos.length === 0 ? (
          <p className="admin-hint">Todavía no hay turnos fijos cargados.</p>
        ) : (
          <ul className="turno-list">
            {turnos.map((t) => {
              const cancha = canchas.find((c) => c.id === t.cancha_id)
              return (
                <li key={t.id} className="turno-item">
                  <div className="turno-info">
                    <strong>{t.nombre || 'Sin nombre'}</strong>
                    <span>
                      {DIAS[t.dia_semana]} · {t.hora_inicio.slice(0, 5)} –{' '}
                      {t.hora_fin ? t.hora_fin.slice(0, 5) : '?'} hs ·{' '}
                      {cancha?.nombre ?? `Cancha ${t.cancha_id}`}
                    </span>
                    {!t.activo && <span className="estado-badge cancelada">inactivo</span>}
                  </div>
                  <div className="config-actions">
                    <button className="mini-btn" onClick={() => alternarTurno(t.id)}>
                      {t.activo ? 'Liberar' : 'Reactivar'}
                    </button>
                    <button className="mini-btn danger" onClick={() => eliminarTurno(t.id)}>
                      Eliminar
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default ConfiguracionPage
