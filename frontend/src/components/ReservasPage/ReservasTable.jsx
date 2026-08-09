const ESTADO_LABEL = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  EXPIRADA: 'Expirada',
  CANCELADA: 'Cancelada',
}

function ReservasTable({ reservas, onAction }) {
  return (
    <div className="reservas-table-wrap">
      <table className="reservas-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Cancha</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Precio</th>
            <th>Seña</th>
            <th>Estado</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva) => (
            <tr key={reserva.id}>
              <td>{reserva.fecha}</td>
              <td>{reserva.hora_inicio.slice(0, 5)}</td>
              <td>{reserva.cancha_nombre}</td>
              <td>{reserva.nombre_cliente}</td>
              <td>{reserva.telefono_cliente}</td>
              <td>${Number(reserva.precio_cancha).toLocaleString('es-AR')}</td>
              <td>${Number(reserva.monto_senia).toLocaleString('es-AR')}</td>
              <td>
                <span className={`estado-badge ${reserva.estado.toLowerCase()}`}>
                  {ESTADO_LABEL[reserva.estado] ?? reserva.estado}
                </span>
              </td>
              <td>
                <div className="list-actions">
                  {reserva.estado === 'PENDIENTE' && (
                    <button className="mini-btn" onClick={() => onAction(reserva.id, 'confirmar')}>
                      Confirmar
                    </button>
                  )}
                  {(reserva.estado === 'PENDIENTE' || reserva.estado === 'CONFIRMADA') && (
                    <button className="mini-btn danger" onClick={() => onAction(reserva.id, 'cancelar')}>
                      Cancelar
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ReservasTable
