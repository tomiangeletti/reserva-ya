import { useEffect, useId, useRef, useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

import './date-picker.css'

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom']
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

function aISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function deISO(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function sumarDias(iso, dias) {
  const date = deISO(iso)
  date.setDate(date.getDate() + dias)
  return aISO(date)
}

function sumarMeses(iso, meses) {
  const date = deISO(iso)
  const dia = date.getDate()
  date.setDate(1)
  date.setMonth(date.getMonth() + meses)
  // Si el mes destino es más corto (31 → 30), queda en su último día.
  const ultimo = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  date.setDate(Math.min(dia, ultimo))
  return aISO(date)
}

/** 42 celdas (6 semanas) que empiezan en lunes y contienen el mes de `iso`. */
function celdasDelMes(iso) {
  const date = deISO(iso)
  const primero = new Date(date.getFullYear(), date.getMonth(), 1)
  const desfase = (primero.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => {
    const celda = new Date(primero.getFullYear(), primero.getMonth(), 1 - desfase + i)
    return { iso: aISO(celda), dia: celda.getDate(), delMes: celda.getMonth() === primero.getMonth() }
  })
}

function textoCorto(iso) {
  const date = deISO(iso)
  return `${DIAS_LARGOS[date.getDay()].slice(0, 3)} ${date.getDate()} ${MESES[date.getMonth()].slice(0, 3)} ${date.getFullYear()}`
}

function textoLargo(iso) {
  const date = deISO(iso)
  return `${DIAS_LARGOS[date.getDay()]} ${date.getDate()} de ${MESES[date.getMonth()]} de ${date.getFullYear()}`
}

/**
 * Selector de fecha con calendario propio (reemplaza el desplegable nativo).
 *
 * `value` y `onChange` usan el mismo formato que <input type="date">: "YYYY-MM-DD".
 * Teclado en el calendario: flechas (día / semana), Inicio y Fin (semana),
 * RePág y AvPág (mes), Enter para elegir y Escape para cerrar.
 */
export function DatePicker({ value, onChange, id, 'aria-labelledby': labelledBy }) {
  const [abierto, setAbierto] = useState(false)
  const [foco, setFoco] = useState(value)
  const raiz = useRef(null)
  const disparador = useRef(null)
  const grilla = useRef(null)
  const panelId = useId()
  const hoy = aISO(new Date())

  function abrir() {
    setFoco(value || hoy)
    setAbierto(true)
  }

  function cerrar({ devolverFoco = true } = {}) {
    setAbierto(false)
    if (devolverFoco) disparador.current?.focus()
  }

  function elegir(iso) {
    onChange(iso)
    cerrar()
  }

  // Cerrar al hacer clic o tocar fuera del componente.
  useEffect(() => {
    if (!abierto) return
    function alClickAfuera(e) {
      if (!raiz.current?.contains(e.target)) setAbierto(false)
    }
    document.addEventListener('pointerdown', alClickAfuera)
    return () => document.removeEventListener('pointerdown', alClickAfuera)
  }, [abierto])

  // Mover el foco del teclado al día activo cuando cambia.
  useEffect(() => {
    if (abierto) grilla.current?.querySelector(`[data-iso="${foco}"]`)?.focus({ preventScroll: true })
  }, [abierto, foco])

  function alTeclear(e) {
    const movimientos = {
      ArrowLeft: (f) => sumarDias(f, -1),
      ArrowRight: (f) => sumarDias(f, 1),
      ArrowUp: (f) => sumarDias(f, -7),
      ArrowDown: (f) => sumarDias(f, 7),
      Home: (f) => sumarDias(f, -((deISO(f).getDay() + 6) % 7)),
      End: (f) => sumarDias(f, 6 - ((deISO(f).getDay() + 6) % 7)),
      PageUp: (f) => sumarMeses(f, -1),
      PageDown: (f) => sumarMeses(f, 1),
    }
    const mover = movimientos[e.key]
    if (mover) {
      e.preventDefault()
      setFoco(mover)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cerrar()
    }
  }

  const vista = deISO(foco || hoy)
  const celdas = celdasDelMes(foco || hoy)

  return (
    <div className="dp" ref={raiz}>
      <button
        ref={disparador}
        id={id}
        type="button"
        className={`dp-disparador ${abierto ? 'abierto' : ''}`}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        aria-controls={abierto ? panelId : undefined}
        aria-labelledby={labelledBy && id ? `${labelledBy} ${id}` : labelledBy}
        onClick={() => (abierto ? cerrar() : abrir())}
      >
        <Calendar size={16} aria-hidden="true" />
        <span className="dp-valor">{value ? textoCorto(value) : 'Elegí una fecha'}</span>
      </button>

      {abierto && (
        <div id={panelId} className="dp-panel" role="dialog" aria-label="Elegir fecha" onKeyDown={alTeclear}>
          <div className="dp-cabecera">
            <button type="button" className="dp-nav" aria-label="Mes anterior" onClick={() => setFoco((f) => sumarMeses(f, -1))}>
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <p className="dp-mes" aria-live="polite">{MESES[vista.getMonth()]} <span className="dp-mono">{vista.getFullYear()}</span></p>
            <button type="button" className="dp-nav" aria-label="Mes siguiente" onClick={() => setFoco((f) => sumarMeses(f, 1))}>
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="dp-semana" aria-hidden="true">
            {DIAS_CORTOS.map((dia) => <span key={dia}>{dia}</span>)}
          </div>

          <div className="dp-grilla" ref={grilla}>
            {celdas.map((celda) => {
              const elegido = celda.iso === value
              return (
                <button
                  key={celda.iso}
                  type="button"
                  data-iso={celda.iso}
                  tabIndex={celda.iso === foco ? 0 : -1}
                  className={['dp-dia', celda.delMes ? '' : 'fuera', elegido ? 'elegido' : '', celda.iso === hoy ? 'hoy' : ''].join(' ').trim()}
                  aria-label={textoLargo(celda.iso)}
                  aria-pressed={elegido}
                  aria-current={celda.iso === hoy ? 'date' : undefined}
                  onClick={() => elegir(celda.iso)}
                >
                  {celda.dia}
                </button>
              )
            })}
          </div>

          <div className="dp-pie">
            <button type="button" className="dp-hoy" onClick={() => elegir(hoy)}>Hoy</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
