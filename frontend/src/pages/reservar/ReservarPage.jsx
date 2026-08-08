import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../../api/client'
import './ReservarPage.css'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS_PREVISTOS = 14

function fechaLocalISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatoDiaLargo(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${DIAS[dt.getDay()]} ${d} de ${MESES[m - 1]}`
}

function formatoPrecio(n) {
  return `$${Number(n).toLocaleString('es-AR')}`
}

function proximosDias(cantidad) {
  const hoy = new Date()
  const out = []
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i)
    out.push({
      fecha: fechaLocalISO(d),
      nombre: i === 0 ? 'Hoy' : DIAS_CORTOS[d.getDay()],
      numero: d.getDate(),
    })
  }
  return out
}

function Fila({ etiqueta, valor }) {
  return (
    <div className="reservar-fila">
      <span className="reservar-fila-etiq">{etiqueta}</span>
      <span className="reservar-fila-valor">{valor}</span>
    </div>
  )
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
        setFecha((f) => f || dias[0].fecha)
        setCancha((c) => c ?? cs[0]?.id ?? null)
      })
      .catch((e) => setError(e.message))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!fecha || !cancha) return
    let activo = true
    apiFetch(`/disponibilidad?cancha_id=${cancha}&fecha=${fecha}`)
      .then((slots) => {
        if (activo) setDisponibilidad(slots)
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
  }, [fecha, cancha, refreshKey])

  const esHoy = fecha === dias[0].fecha

  const horarios = useMemo(() => {
    if (!disponibilidad) return []
    const ahora = new Date()
    const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes()
    return disponibilidad
      .map((s) => ({ hora: s.hora_inicio.slice(0, 5), disponible: s.disponible }))
      .filter((s) => {
        if (!esHoy) return true
        const [h, m] = s.hora.split(':').map(Number)
        return h * 60 + m > ahoraMin
      })
  }, [disponibilidad, esHoy])

  function elegirTurno(hora) {
    const nombre = canchas.find((c) => c.id === cancha)?.nombre
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
      const r = await apiFetch('/reservas', {
        method: 'POST',
        body: {
          cancha_id: turno.cancha_id,
          fecha: turno.fecha,
          hora_inicio: `${turno.hora}:00`,
          nombre_cliente: form.nombre.trim(),
          telefono_cliente: form.telefono.trim(),
        },
      })
      setReserva(r)
      setPaso(3)
    } catch (err) {
      setError(err.message)
      if (err.status === 409) {
        setTurno(null)
        setPaso(1)
        setLoading(true)
        setRefreshKey((k) => k + 1)
      }
    } finally {
      setEnviando(false)
    }
  }

  function volverInicio() {
    setPaso(1)
    setTurno(null)
    setReserva(null)
    setForm({ nombre: '', telefono: '' })
    setError('')
    setRefreshKey((k) => k + 1)
  }

  function linkWhatsApp() {
    const numero = (config?.telefono_whatsapp ?? '').replace(/\D/g, '')
    const texto = `Hola! ${form.nombre.trim()} acaba de reservar la ${turno.cancha_nombre} el ${formatoDiaLargo(turno.fecha)} a las ${turno.hora} hs. Adjunto el comprobante de la seña de ${formatoPrecio(config?.monto_senia_default)}.`
    const base = numero ? `https://wa.me/${numero}` : 'https://wa.me/'
    return `${base}?text=${encodeURIComponent(texto)}`
  }

  if (!config || canchas.length === 0) {
    return (
      <main className="reservar-page">
        <div className="reservar-card">
          {error ? <p className="reservar-error">{error}</p> : <p className="reservar-hint">Cargando…</p>}
        </div>
      </main>
    )
  }

  return (
    <main className="reservar-page">
      <div className="reservar-wrap">
        <header className="reservar-header">
          <div className="reservar-brand-mark" aria-hidden="true">ET</div>
          <p className="reservar-kicker">PADEL CLUB · LA PLATA</p>
          <h1 className="reservar-title">El Túnel</h1>
          <p className="reservar-subtitle">Reservá tu turno en pocos pasos</p>
        </header>

        <div className="reservar-progreso" aria-label={`Paso ${paso} de 3`}>
          {[['1', 'Elegí'], ['2', 'Confirmá'], ['3', 'Listo']].map(([numero, etiqueta], index) => {
            const activo = paso === index + 1
            const completado = paso > index + 1
            return (
              <div className={`reservar-progreso-item ${activo ? 'activo' : ''} ${completado ? 'completado' : ''}`} key={numero}>
                <span className="reservar-progreso-num">{completado ? '✓' : numero}</span>
                <span>{etiqueta}</span>
                {index < 2 && <span className="reservar-progreso-linea" aria-hidden="true" />}
              </div>
            )
          })}
        </div>

        {paso === 1 && (
          <section className="reservar-step">
            <h2 className="reservar-step-title">1 · Elegí día y horario</h2>

            <div className="reservar-dias">
              {dias.map((d) => (
                <button
                  key={d.fecha}
                  type="button"
                  className={`reservar-dia ${fecha === d.fecha ? 'activo' : ''}`}
                  onClick={() => {
                    setFecha(d.fecha)
                    setTurno(null)
                    setError('')
                    setLoading(true)
                  }}
                >
                  <span className="reservar-dia-nombre">{d.nombre}</span>
                  <span className="reservar-dia-num">{d.numero}</span>
                </button>
              ))}
            </div>

            <div className="reservar-canchas">
              {canchas.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`reservar-cancha ${cancha === c.id ? 'activo' : ''}`}
                  onClick={() => {
                    setCancha(c.id)
                    setTurno(null)
                    setError('')
                    setLoading(true)
                  }}
                >
                  {c.nombre}
                </button>
              ))}
            </div>

            {error && <p className="reservar-error">{error}</p>}

            {loading && <p className="reservar-hint">Cargando horarios…</p>}
            {!loading && horarios.length === 0 && (
              <p className="reservar-hint">No hay horarios disponibles para este día.</p>
            )}
            {!loading && horarios.length > 0 && (
              <div className="reservar-horarios">
                {horarios.map((h) => (
                  <button
                    key={h.hora}
                    type="button"
                    className={`reservar-hora ${h.disponible ? '' : 'ocupado'}`}
                    disabled={!h.disponible}
                    onClick={() => elegirTurno(h.hora)}
                  >
                    {h.hora}
                    {!h.disponible && <span className="reservar-hora-ocu">Ocupado</span>}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {paso === 2 && turno && (
          <section className="reservar-step">
            <h2 className="reservar-step-title">2 · Confirmá y señá</h2>

            <div className="reservar-resumen">
              <Fila etiqueta="Cancha" valor={turno.cancha_nombre} />
              <Fila etiqueta="Día" valor={formatoDiaLargo(turno.fecha)} />
              <Fila etiqueta="Horario" valor={`${turno.hora} hs`} />
              <Fila etiqueta="Precio" valor={formatoPrecio(config.precio_cancha_default)} />
              <Fila etiqueta="Adicional pelotas" valor={formatoPrecio(config.adicional_pelotas)} />
              <Fila
                etiqueta="Total"
                valor={formatoPrecio(Number(config.precio_cancha_default) + Number(config.adicional_pelotas))}
              />
            </div>

            <div className="reservar-senia">
              <p className="reservar-senia-txt">
                Dejá la seña de <strong>{formatoPrecio(config.monto_senia_default)}</strong> por
                transferencia al alias:
              </p>
              <p className="reservar-alias">{config.alias_transferencia}</p>
              <p className="reservar-senia-txt">En {config.direccion}</p>
            </div>

            <form className="reservar-form" onSubmit={confirmar}>
              <label className="reservar-campo">
                <span className="reservar-label">Nombre y apellido</span>
                <input
                  className="reservar-input"
                  type="text"
                  autoComplete="name"
                  placeholder="Ej: Juan Pérez"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  required
                />
              </label>
              <label className="reservar-campo">
                <span className="reservar-label">WhatsApp</span>
                <input
                  className="reservar-input"
                  type="tel"
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{6,10}"
                  placeholder="Ej: 1155550000"
                  value={form.telefono}
                  onChange={(e) => {
                    const telefono = e.target.value.replace(/\D/g, '').slice(0, 10)
                    setForm((f) => ({ ...f, telefono }))
                  }}
                  required
                  minLength={6}
                />
              </label>

              {error && <p className="reservar-error">{error}</p>}

              <div className="reservar-acciones">
                <button type="button" className="reservar-btn-sec" onClick={() => setPaso(1)}>
                  Volver
                </button>
                <button type="submit" className="reservar-btn" disabled={enviando}>
                  {enviando ? 'Reservando…' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          </section>
        )}

        {paso === 3 && reserva && (
          <section className="reservar-step">
            <div className="reservar-ok">✓</div>
            <h2 className="reservar-step-title">Reserva pendiente</h2>
            <p className="reservar-pendiente">
              Tu turno quedó reservado pero <strong>no está confirmado</strong> hasta que el club
              reciba la seña de <strong>{formatoPrecio(config.monto_senia_default)}</strong> por
              transferencia al alias <strong>{config.alias_transferencia}</strong>.
            </p>

            <div className="reservar-resumen">
              <Fila etiqueta="Cancha" valor={turno.cancha_nombre} />
              <Fila etiqueta="Día" valor={formatoDiaLargo(turno.fecha)} />
              <Fila etiqueta="Horario" valor={`${turno.hora} hs`} />
              <Fila etiqueta="Precio" valor={formatoPrecio(config.precio_cancha_default)} />
              <Fila etiqueta="Adicional pelotas" valor={formatoPrecio(config.adicional_pelotas)} />
              <Fila
                etiqueta="Total"
                valor={formatoPrecio(Number(config.precio_cancha_default) + Number(config.adicional_pelotas))}
              />
            </div>

            <a className="reservar-btn reservar-wa" href={linkWhatsApp()} target="_blank" rel="noreferrer">
              Enviar comprobante por WhatsApp
            </a>
            <button type="button" className="reservar-btn-sec" onClick={volverInicio}>
              Hacer otra reserva
            </button>
          </section>
        )}
      </div>
      <footer className="reservar-footer">
        <span>El Túnel Padel Club</span>
        <Link to="/privacidad">Privacidad</Link>
      </footer>
    </main>
  )
}

export default ReservarPage
