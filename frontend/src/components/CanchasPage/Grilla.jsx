import { Plus } from 'lucide-react'

import './Grilla.css'

const ESTADOS = {
  reserva_confirmada: 'Confirmada',
  reserva_pendiente: 'Pendiente',
  bloqueo: 'Reservada',
  turno_fijo: 'Turno fijo',
}

/** Leyenda de colores de la grilla. */
export function GrillaLeyenda() {
  return (
    <ul className="grilla-leyenda" aria-label="Referencias">
      {Object.entries(ESTADOS).map(([estado, etiqueta]) => (
        <li key={estado} className={`grilla-leyenda-item ${estado}`}>{etiqueta}</li>
      ))}
    </ul>
  )
}

function Grilla({ data, onCellClick }) {
  const horas = data[0]?.slots?.map((s) => s.hora_inicio.slice(0, 5)) ?? []

  return (
    <div className="grilla-wrap">
      <table className="grilla" style={{ '--g-horas': horas.length }}>
        <thead>
          <tr>
            <th className="grilla-corner" scope="col">Cancha</th>
            {horas.map((hora) => <th key={hora} className="grilla-hora" scope="col">{hora}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map((cancha) => (
            <tr key={cancha.cancha_id}>
              <th className="grilla-cancha" scope="row">{cancha.cancha_nombre}</th>
              {cancha.slots.map((slot) => {
                const hora = slot.hora_inicio.slice(0, 5)
                if (slot.estado === 'libre') {
                  return (
                    <td key={hora} className="grilla-cell libre">
                      <button className="grilla-libre" aria-label={`Ocupar ${cancha.cancha_nombre} a las ${hora}`} onClick={() => onCellClick?.(cancha, slot)}>
                        <Plus size={16} aria-hidden="true" />
                      </button>
                    </td>
                  )
                }
                const etiqueta = ESTADOS[slot.estado] ?? slot.estado
                const nombre = slot.nombre ?? slot.motivo ?? etiqueta
                return (
                  <td key={hora} className={`grilla-cell ${slot.estado}`}>
                    <button className={`grilla-ocupado ${slot.estado}`} title={nombre} aria-label={`${cancha.cancha_nombre}, ${hora}: ${nombre}, ${etiqueta}. Ver detalle`} onClick={() => onCellClick?.(cancha, slot)}>
                      <span className="grilla-nombre">{nombre}</span>
                      <span className="grilla-badge">{etiqueta}</span>
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
