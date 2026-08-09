import { useEffect, useState } from 'react'

import { apiFetch } from '../../api/client'
import ClubSettingsForm from '../../components/ConfiguracionPage/ClubSettingsForm'
import FixedTurnsSection from '../../components/ConfiguracionPage/FixedTurnsSection'
import './ConfiguracionPage.css'

function toTimeInput(value) {
  return value?.slice(0, 5) ?? ''
}

function horasDeGrilla(apertura, cierre) {
  const a = new Date(2000, 0, 1, Number(apertura?.slice(0, 2) ?? 0), Number(apertura?.slice(3, 5) ?? 0))
  let c = new Date(2000, 0, 1, Number(cierre?.slice(0, 2) ?? 0), Number(cierre?.slice(3, 5) ?? 0))
  if (cierre === '23:59') {
    c = new Date(2000, 0, 2, 0, 0)
  } else if (c <= a) {
    c = new Date(2000, 0, 2, c.getHours(), c.getMinutes())
  }
  const horas = []
  const actual = new Date(a)
  while (actual.getTime() + 90 * 60000 <= c.getTime()) {
    horas.push(`${String(actual.getHours()).padStart(2, '0')}:${String(actual.getMinutes()).padStart(2, '0')}`)
    actual.setTime(actual.getTime() + 90 * 60000)
  }
  return horas
}

const TURNO_INICIAL = { cancha_id: '', dia_semana: 1, hora_desde: '', hora_hasta: '', nombre: '' }

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
      .then(([config, canchasData, turnosData]) => {
        setForm({ ...config, hora_apertura: toTimeInput(config.hora_apertura), hora_cierre: toTimeInput(config.hora_cierre) })
        setCanchas(canchasData)
        setTurnos(turnosData)
        if (canchasData.length > 0) setTurnoForm((current) => ({ ...current, cancha_id: canchasData[0].id }))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const horas = horasDeGrilla(form?.hora_apertura, form?.hora_cierre)
  const cierreEsMedianoche = form?.hora_cierre === '00:00' || form?.hora_cierre === '23:59'

  function handleChange(e) {
    const { name, value } = e.target
    setForm((current) => ({ ...current, [name]: value }))
    setSaved(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    const payload = { ...form }
    for (const key of ['hora_apertura', 'hora_cierre']) {
      if (payload[key]) payload[key] = `${payload[key]}:00`
      else delete payload[key]
    }
    try {
      const updated = await apiFetch('/config', { method: 'PATCH', body: payload })
      setForm({ ...updated, hora_apertura: toTimeInput(updated.hora_apertura), hora_cierre: toTimeInput(updated.hora_cierre) })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleTurnoChange(changes) {
    setTurnoForm((current) => {
      if (!('hora_desde' in changes)) return { ...current, ...changes }
      const index = horas.indexOf(changes.hora_desde)
      const siguiente = horas[index + 1] ?? (cierreEsMedianoche ? '00:00' : '')
      return { ...current, ...changes, hora_hasta: siguiente }
    })
  }

  async function guardarTurno(e) {
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
    } catch (err) { setError(err.message) }
  }

  async function alternarTurno(id) {
    setError('')
    try {
      await apiFetch(`/turnos-fijos/${id}`, { method: 'PATCH' })
      setTurnos(await apiFetch('/turnos-fijos'))
    } catch (err) { setError(err.message) }
  }

  async function eliminarTurno(id) {
    setError('')
    try {
      await apiFetch(`/turnos-fijos/${id}`, { method: 'DELETE' })
      setTurnos(await apiFetch('/turnos-fijos'))
    } catch (err) { setError(err.message) }
  }

  if (loading && !form) return <p className="admin-hint">Cargando…</p>
  if (!form) return <p className="admin-error">{error || 'No se pudo cargar la configuración'}</p>

  return (
    <div className="config-page">
      <h1 className="admin-title">Configuración</h1>
      <p className="admin-hint">Precios, seña, horarios, datos del club y turnos fijos.</p>
      <ClubSettingsForm form={form} loading={loading} saved={saved} error={error} onChange={handleChange} onSubmit={handleSubmit} />
      <FixedTurnsSection
        canchas={canchas}
        turnos={turnos}
        showForm={showTurno}
        form={turnoForm}
        horas={horas}
        cierreEsMedianoche={cierreEsMedianoche}
        onToggleForm={() => setShowTurno((visible) => !visible)}
        onChange={handleTurnoChange}
        onSubmit={guardarTurno}
        onToggleTurno={alternarTurno}
        onDeleteTurno={eliminarTurno}
      />
    </div>
  )
}

export default ConfiguracionPage
