import { Link } from 'react-router-dom'

import { aMinutos, minutosDelDia } from './tiempo'

const ESTADOS = {
  reserva_confirmada: 'Confirmada',
  reserva_pendiente: 'Pendiente',
  bloqueo: 'Reservada',
  turno_fijo: 'Turno fijo',
}

/** Turnos ocupados que todavía no terminaron hoy, en orden de horario. */
function RestoDelDia({ grilla, duracion, ahora }) {
  const minuto = minutosDelDia(ahora)
  const turnos = grilla
    .flatMap((cancha) => cancha.slots
      .filter((slot) => slot.estado !== 'libre' && aMinutos(slot.hora_inicio) + duracion > minuto)
      .map((slot) => ({ ...slot, cancha: cancha.cancha_nombre, clave: `${cancha.cancha_id}-${slot.hora_inicio}` })))
    .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio) || a.cancha.localeCompare(b.cancha))

  return (
    <section className="dash-panel" aria-labelledby="dash-resto">
      <header className="dash-panel-cabecera">
        <h2 className="dash-panel-titulo" id="dash-resto">Lo que queda hoy</h2>
        <Link className="dash-link" to="/admin/canchas">Ver grilla</Link>
      </header>
      {turnos.length === 0 ? (
        <p className="dash-vacio">No quedan turnos ocupados por hoy.</p>
      ) : (
        <ol className="dash-agenda">
          {turnos.map((turno) => {
            const enCurso = aMinutos(turno.hora_inicio) <= minuto
            return (
              <li key={turno.clave} className={`dash-agenda-fila ${turno.estado} ${enCurso ? 'en-curso' : ''}`}>
                <span className="dash-mono dash-agenda-hora">{turno.hora_inicio.slice(0, 5)}</span>
                <span className="dash-agenda-punto" aria-hidden="true" />
                <span className="dash-agenda-nombre">{turno.nombre ?? turno.motivo ?? 'Sin nombre'}</span>
                <span className="dash-tenue">{turno.cancha}</span>
                <span className="dash-agenda-estado">{enCurso ? 'En juego' : ESTADOS[turno.estado]}</span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

export default RestoDelDia
