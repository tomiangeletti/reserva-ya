import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../../api/client'
import BookingForm from '../../components/ReservarPage/BookingForm'
import BookingHeader from '../../components/ReservarPage/BookingHeader'
import BookingProgress from '../../components/ReservarPage/BookingProgress'
import BookingSuccess from '../../components/ReservarPage/BookingSuccess'
import BookingSummary from '../../components/ReservarPage/BookingSummary'
import CourtPicker from '../../components/ReservarPage/CourtPicker'
import DatePicker from '../../components/ReservarPage/DatePicker'
import DepositInfo from '../../components/ReservarPage/DepositInfo'
import TimeSlots from '../../components/ReservarPage/TimeSlots'
import './ReservarPage.css'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS_PREVISTOS = 14

function fechaLocalISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatoDiaLargo(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return `${DIAS[new Date(year, month - 1, day).getDay()]} ${day} de ${MESES[month - 1]}`
}

function formatoPrecio(value) {
  return `$${Number(value).toLocaleString('es-AR')}`
}

function proximosDias(cantidad) {
  const hoy = new Date()
  return Array.from({ length: cantidad }, (_, index) => {
    const date = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + index)
    return { fecha: fechaLocalISO(date), nombre: index === 0 ? 'Hoy' : DIAS_CORTOS[date.getDay()], numero: date.getDate() }
  })
}

function ReservarPage() {
  const dias = useMemo(() => proximosDias(DIAS_PREVISTOS), [])
  const [config, setConfig] = useState(null)
  const [canchas, setCanchas] = useState([])
  const [fecha, setFecha] = useState('')
  const [cancha, setCancha] = useState(null)
  const [disponibilidad, setDisponibilidad] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [paso, setPaso] = useState(1)
  const [turno, setTurno] = useState(null)
  const [form, setForm] = useState({ nombre: '', telefono: '' })
  const [enviando, setEnviando] = useState(false)
  const [reserva, setReserva] = useState(null)

  useEffect(() => {
    Promise.all([apiFetch('/config'), apiFetch('/canchas')])
      .then(([cfg, cs]) => {
        setConfig(cfg)
        setCanchas(cs)
        setFecha((current) => current || dias[0].fecha)
        setCancha((current) => current ?? cs[0]?.id ?? null)
      })
      .catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!fecha || !cancha) return
    let activo = true
    apiFetch(`/disponibilidad?cancha_id=${cancha}&fecha=${fecha}`)
      .then((slots) => { if (activo) setDisponibilidad(slots) })
      .catch((e) => { if (activo) setError(e.message) })
      .finally(() => { if (activo) setLoading(false) })
    return () => { activo = false }
  }, [fecha, cancha, refreshKey])

  const horarios = useMemo(() => {
    if (!disponibilidad) return []
    const ahora = new Date()
    const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes()
    return disponibilidad
      .map((slot) => ({ hora: slot.hora_inicio.slice(0, 5), disponible: slot.disponible }))
      .filter((slot) => {
        if (fecha !== dias[0].fecha) return true
        const [hours, minutes] = slot.hora.split(':').map(Number)
        return hours * 60 + minutes > ahoraMin
      })
  }, [disponibilidad, fecha, dias])

  function seleccionarFecha(nuevaFecha) {
    setFecha(nuevaFecha)
    setTurno(null)
    setError('')
    setLoading(true)
  }

  function seleccionarCancha(nuevaCancha) {
    setCancha(nuevaCancha)
    setTurno(null)
    setError('')
    setLoading(true)
  }

  function elegirTurno(hora) {
    const nombre = canchas.find((item) => item.id === cancha)?.nombre
    setTurno({ cancha_id: cancha, cancha_nombre: nombre, fecha, hora })
    setError('')
    setPaso(2)
  }

  async function confirmar(e) {
    e.preventDefault()
    if (!turno) return
    setError('')
    setEnviando(true)
    try {
      const nuevaReserva = await apiFetch('/reservas', {
        method: 'POST',
        body: { cancha_id: turno.cancha_id, fecha: turno.fecha, hora_inicio: `${turno.hora}:00`, nombre_cliente: form.nombre.trim(), telefono_cliente: form.telefono.trim() },
      })
      setReserva(nuevaReserva)
      setPaso(3)
    } catch (err) {
      setError(err.message)
      if (err.status === 409) {
        setTurno(null)
        setPaso(1)
        setLoading(true)
        setRefreshKey((key) => key + 1)
      }
    } finally { setEnviando(false) }
  }

  function volverInicio() {
    setPaso(1)
    setTurno(null)
    setReserva(null)
    setForm({ nombre: '', telefono: '' })
    setError('')
    setRefreshKey((key) => key + 1)
  }

  function linkWhatsApp() {
    const numero = (config?.telefono_whatsapp ?? '').replace(/\D/g, '')
    const texto = `Hola! ${form.nombre.trim()} acaba de reservar la ${turno.cancha_nombre} el ${formatoDiaLargo(turno.fecha)} a las ${turno.hora} hs. Adjunto el comprobante de la seña de ${formatoPrecio(config?.monto_senia_default)}.`
    const base = numero ? `https://wa.me/${numero}` : 'https://wa.me/'
    return `${base}?text=${encodeURIComponent(texto)}`
  }

  if (!config || canchas.length === 0) {
    return <main className="reservar-page"><div className="reservar-card">{error ? <p className="reservar-error">{error}</p> : <p className="reservar-hint">Cargando…</p>}</div></main>
  }

  return (
    <main className="reservar-page">
      <div className="reservar-wrap">
        <BookingHeader />
        <BookingProgress paso={paso} />

        {paso === 1 && (
          <section className="reservar-step">
            <h2 className="reservar-step-title">1 · Elegí día y horario</h2>
            <DatePicker dias={dias} fecha={fecha} onSelect={seleccionarFecha} />
            <CourtPicker canchas={canchas} cancha={cancha} onSelect={seleccionarCancha} />
            {error && <p className="reservar-error">{error}</p>}
            <TimeSlots loading={loading} horarios={horarios} onSelect={elegirTurno} />
          </section>
        )}

        {paso === 2 && turno && (
          <section className="reservar-step">
            <h2 className="reservar-step-title">2 · Confirmá y señá</h2>
            <BookingSummary turno={turno} config={config} formatoDia={formatoDiaLargo} formatoPrecio={formatoPrecio} />
            <DepositInfo config={config} formatoPrecio={formatoPrecio} />
            <BookingForm form={form} enviando={enviando} error={error} onChange={setForm} onSubmit={confirmar} onBack={() => setPaso(1)} />
          </section>
        )}

        {paso === 3 && reserva && (
          <BookingSuccess turno={turno} config={config} formatoDia={formatoDiaLargo} formatoPrecio={formatoPrecio} whatsappUrl={linkWhatsApp()} onRestart={volverInicio} />
        )}
      </div>
      <footer className="reservar-footer">
        <span>Desarrollado por <a href="https://github.com/tomiangeletti" target="_blank" rel="noreferrer">Tomas Angeletti</a></span>
        <Link to="/privacidad">Privacidad</Link>
      </footer>
    </main>
  )
}

export default ReservarPage
