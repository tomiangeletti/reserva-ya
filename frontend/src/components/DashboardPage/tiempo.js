import { useEffect, useState } from 'react'

/** Hora actual que se actualiza cada `cadaMs` (por defecto, cada segundo). */
export function useAhora(cadaMs = 1000) {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), cadaMs)
    return () => clearInterval(id)
  }, [cadaMs])
  return ahora
}

export function hoyISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** "18:30" o "18:30:00" → minutos desde la medianoche. */
export function aMinutos(hora) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function minutosDelDia(date) {
  return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60
}

export function deMinutos(total) {
  const t = Math.round(total) % (24 * 60)
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

/** 75 → "1 h 15 min", 40 → "40 min". */
export function duracionLegible(minutos) {
  const m = Math.max(0, Math.round(minutos))
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const resto = m % 60
  return resto ? `${h} h ${resto} min` : `${h} h`
}

/** Segundos → "12:04". */
export function cuentaRegresiva(segundos) {
  const s = Math.max(0, Math.floor(segundos))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export function horaCorta(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/** "2026-11-20" → "hoy", "mañana" o "vie 20". */
export function diaRelativo(iso, hoy = hoyISO()) {
  if (iso === hoy) return 'hoy'
  const [y, m, d] = iso.split('-').map(Number)
  const fecha = new Date(y, m - 1, d)
  const [hy, hm, hd] = hoy.split('-').map(Number)
  const diff = Math.round((fecha - new Date(hy, hm - 1, hd)) / 86400000)
  if (diff === 1) return 'mañana'
  return `${DIAS[fecha.getDay()]} ${d}`
}

export function formatoPrecio(valor) {
  return `$${Number(valor).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
}
