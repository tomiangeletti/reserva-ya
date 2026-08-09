import './Grilla.css'

const ESTADO_LABEL = {
  reserva_pendiente: 'Pendiente',
  reserva_confirmada: 'Confirmada',
  turno_fijo: 'Fijo',
  bloqueo: 'Reservada',
}

function Grilla({ data, onCellClick }) {
  const horas = data[0]?.slots?.map((s) => s.hora_inicio.slice(0, 5)) ?? []

  return (
    <div className="grilla-wrap">
      <table className="grilla">
        <thead>
          <tr>
            <th className="grilla-corner">Cancha</th>
            {horas.map((hora) => <th key={hora} className="grilla-hora">{hora}</th>)}
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
                      <button className="grilla-libre" title="Ocupar este turno" onClick={() => onCellClick?.(cancha, slot)}>
                        +
                      </button>
                    </td>
                  )
                }
                return (
                  <td key={hora} className={`grilla-cell ${slot.estado}`}>
                    <button className={`grilla-ocupado ${slot.estado}`} title="Ver detalle / liberar" onClick={() => onCellClick?.(cancha, slot)}>
                      <span className="grilla-nombre">{slot.nombre ?? slot.motivo ?? ESTADO_LABEL[slot.estado]}</span>
                      <span className="grilla-badge">{ESTADO_LABEL[slot.estado] ?? slot.estado}</span>
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
