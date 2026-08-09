import { Link } from 'react-router-dom'

import { DIAS, diaDeFecha, sumar90 } from './utils'

const ESTADO_LABEL = {
  reserva_pendiente: 'Reserva pendiente',
  reserva_confirmada: 'Reserva confirmada',
}

function CanchasModal({ modal, fecha, onChange, onClose, onSave, onToggleTurno, onDeleteTurno, onDeleteBloqueo }) {
  if (!modal) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {modal.tipo === 'nuevo' && (
          <>
            <h3 className="modal-title">Ocupar {modal.hora} hs · {modal.canchaNombre}</h3>
            <label className="config-field">
              <span className="config-label">Tipo</span>
              <select className="config-input" value={modal.modo} onChange={(e) => onChange({ ...modal, modo: e.target.value })}>
                <option value="bloqueo">Reservada (reserva por WhatsApp)</option>
                <option value="turno_fijo">Turno fijo todos los {DIAS[diaDeFecha(fecha)]}</option>
              </select>
            </label>
            <label className="config-field">
              <span className="config-label">A nombre de</span>
              <input className="config-input" placeholder="Ej: Juan" value={modal.nombre} onChange={(e) => onChange({ ...modal, nombre: e.target.value })} />
            </label>
            {modal.modo === 'turno_fijo' && <p className="modal-hint">Se repetirá cada {DIAS[diaDeFecha(fecha)]} de {modal.hora} a {sumar90(modal.hora)} hs.</p>}
            <div className="modal-actions">
              <button className="mini-btn" onClick={onClose}>Cancelar</button>
              <button className="config-save" onClick={onSave} disabled={!modal.nombre.trim()}>Ocupar turno</button>
            </div>
          </>
        )}

        {modal.tipo === 'turno_fijo' && modal.turno && (
          <>
            <h3 className="modal-title">Turno fijo · {modal.canchaNombre}</h3>
            <p className="modal-hint"><strong>{modal.turno.nombre || 'Sin nombre'}</strong> · {DIAS[modal.turno.dia_semana]} de {modal.turno.hora_inicio.slice(0, 5)} a {modal.turno.hora_fin ? modal.turno.hora_fin.slice(0, 5) : '?'} hs{modal.turno.activo ? '' : ' · inactivo'}</p>
            <div className="modal-actions">
              <button className="mini-btn" onClick={onClose}>Volver</button>
              <button className="mini-btn" onClick={() => onToggleTurno(modal.turno.id)}>{modal.turno.activo ? 'Liberar' : 'Reactivar'}</button>
              <button className="mini-btn danger" onClick={() => onDeleteTurno(modal.turno.id)}>Eliminar</button>
            </div>
          </>
        )}

        {modal.tipo === 'bloqueo' && modal.bloqueo && (
          <>
            <h3 className="modal-title">Reservada · {modal.canchaNombre}</h3>
            <p className="modal-hint"><strong>{modal.bloqueo.motivo}</strong> · {modal.bloqueo.hora_inicio.slice(0, 5)} hs</p>
            <div className="modal-actions">
              <button className="mini-btn" onClick={onClose}>Volver</button>
              <button className="mini-btn danger" onClick={() => onDeleteBloqueo(modal.bloqueo.id)}>Liberar</button>
            </div>
          </>
        )}

        {modal.tipo === 'reserva' && (
          <>
            <h3 className="modal-title">{ESTADO_LABEL[modal.slot.estado]} · {modal.canchaNombre}</h3>
            <p className="modal-hint"><strong>{modal.slot.nombre}</strong> · {modal.slot.hora_inicio.slice(0, 5)} hs</p>
            <div className="modal-actions">
              <button className="mini-btn" onClick={onClose}>Cerrar</button>
              <Link className="config-save" to="/admin/reservas">Ir a Reservas</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CanchasModal
