import './Grilla.css'

const ESTADO_LABEL = {
  reserva_pendiente: 'Pendiente',
  reserva_confirmada: 'Confirmada',
  turno_fijo: 'Fijo',
  bloqueo: 'Reservada',
}

/**
 * Tabla de todas las canchas x todos los horarios del día.
 *
 * - `data`: `[{cancha_id, cancha_nombre, slots: [{hora_inicio, estado, nombre, motivo}]}]`
 * - Cada celda libre muestra "+"; las ocupadas muestran a nombre de quién y el estado.
 * - `onCellClick(cancha, slot)` se dispara al tocar cualquier celda.
 */
function Grilla({ data, onCellClick }) {
  const horas = data[0]?.slots?.map((s) => s.hora_inicio.slice(0, 5)) ?? []

  return (
    <div className="grilla-wrap">
      <table className="grilla">
        <thead>
          <tr>
            <th className="grilla-corner">Cancha</th>
            {horas.map((h) => (
              <th key={h} className="grilla-hora">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cancha) => (
            <tr key={cancha.cancha_id}>
              <th className="grilla-cancha">{cancha.cancha_nombre}</th>
              {cancha.slots.map((slot) => {
                const hora = slot.hora_inicio.slice(0, 5)
                if (slot.estado === 'libre') {
                  return (
                    <td key={hora} className="grilla-cell libre">
                      <button
                        className="grilla-libre"
                        title="Ocupar este turno"
                        onClick={() => onCellClick?.(cancha, slot)}
                      >
                        +
                      </button>
                    </td>
                  )
                }
                return (
                  <td key={hora} className={`grilla-cell ${slot.estado}`}>
                    <button
                      className={`grilla-ocupado ${slot.estado}`}
                      title="Ver detalle / liberar"
                      onClick={() => onCellClick?.(cancha, slot)}
                    >
                      <span className="grilla-nombre">
                        {slot.nombre ?? slot.motivo ?? ESTADO_LABEL[slot.estado]}
                      </span>
                      <span className="grilla-badge">
                        {ESTADO_LABEL[slot.estado] ?? slot.estado}
                      </span>
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Grilla
