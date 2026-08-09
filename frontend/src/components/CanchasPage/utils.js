const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

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

export { DIAS, diaDeFecha, sumar90 }
