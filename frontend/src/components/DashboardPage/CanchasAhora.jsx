import { aMinutos, deMinutos, duracionLegible, minutosDelDia } from './tiempo'

const ESTADO_TEXTO = {
  reserva_confirmada: 'Reserva confirmada',
  reserva_pendiente: 'Reserva pendiente',
  bloqueo: 'Reservada por WhatsApp',
  turno_fijo: 'Turno fijo',
}

function nombreDe(slot) {
  return slot.nombre ?? slot.motivo ?? 'Sin nombre'
}

/** Estado actual de cada cancha: en juego (con progreso) o libre (con el próximo turno). */
function CanchasAhora({ grilla, duracion, ahora }) {
  const minuto = minutosDelDia(ahora)

  return (
    <section className="dash-panel" aria-labelledby="dash-ahora">
      <header className="dash-panel-cabecera">
        <h2 className="dash-panel-titulo" id="dash-ahora">Ahora en las canchas</h2>
      </header>
      <ul className="dash-canchas">
        {grilla.map((cancha) => {
          const actual = cancha.slots.find((slot) => {
            const inicio = aMinutos(slot.hora_inicio)
            return minuto >= inicio && minuto < inicio + duracion
          })
          const enJuego = actual && actual.estado !== 'libre'
          const proximo = cancha.slots.find((slot) => slot.estado !== 'libre' && aMinutos(slot.hora_inicio) > minuto)

          if (enJuego) {
            const inicio = aMinutos(actual.hora_inicio)
            const progreso = Math.min(100, ((minuto - inicio) / duracion) * 100)
            return (
              <li key={cancha.cancha_id} className="dash-cancha en-juego">
                <span className="dash-cancha-nombre">{cancha.cancha_nombre}</span>
                <span className="dash-cancha-estado"><span className="dash-pulso" aria-hidden="true" />En juego</span>
                <span className="dash-cancha-quien" title={ESTADO_TEXTO[actual.estado]}>{nombreDe(actual)}</span>
                <div className="dash-cancha-progreso">
                  <div className="dash-barra"><div className="dash-barra-relleno" style={{ width: `${progreso}%` }} /></div>
                  <span className="dash-mono dash-tenue">termina {deMinutos(inicio + duracion)}</span>
                </div>
              </li>
            )
          }

          return (
            <li key={cancha.cancha_id} className="dash-cancha libre">
              <span className="dash-cancha-nombre">{cancha.cancha_nombre}</span>
              <span className="dash-cancha-estado">Libre</span>
              <span className="dash-cancha-quien dash-tenue">
                {proximo ? `Próximo: ${nombreDe(proximo)}` : 'Sin más turnos hoy'}
              </span>
              <div className="dash-cancha-progreso">
                {proximo && (
                  <span className="dash-mono dash-tenue">
                    {proximo.hora_inicio.slice(0, 5)}, en {duracionLegible(aMinutos(proximo.hora_inicio) - minuto)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default CanchasAhora
