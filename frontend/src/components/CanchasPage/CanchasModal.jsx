import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

import Button2 from '../ui/button-2'
import { DIAS, diaDeFecha, sumarMinutos } from './utils'

const ESTADO_LABEL = {
  reserva_pendiente: 'Reserva pendiente',
  reserva_confirmada: 'Reserva confirmada',
}

function Detalle({ filas }) {
  return (
    <dl className="cmodal-detalle">
      {filas.map(([etiqueta, valor, mono]) => (
        <div key={etiqueta} className="cmodal-fila">
          <dt>{etiqueta}</dt>
          <dd className={mono ? 'cmodal-mono' : ''}>{valor}</dd>
        </div>
      ))}
    </dl>
  )
}

function CanchasModal({ modal, fecha, error, duracion, onChange, onClose, onSave, onToggleTurno, onDeleteTurno, onDeleteBloqueo }) {
  const navigate = useNavigate()
  const abierto = Boolean(modal)

  // Escape cierra el modal.
  useEffect(() => {
    if (!abierto) return
    function alTeclear(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [abierto, onClose])

  if (!modal) return null

  const dia = DIAS[diaDeFecha(fecha)].toLowerCase()
  let titulo = ''
  let cuerpo = null
  let acciones = null

  if (modal.tipo === 'nuevo') {
    titulo = 'Ocupar turno'
    cuerpo = (
      <>
        <Detalle filas={[['Cancha', modal.canchaNombre], ['Horario', `${modal.hora} a ${sumarMinutos(modal.hora, duracion)} hs`, true]]} />
        <div className="cmodal-campo">
          <span className="cmodal-label" id="cmodal-tipo">Tipo</span>
          <div className="cmodal-opciones" role="group" aria-labelledby="cmodal-tipo">
            <Button2 className={modal.modo === 'bloqueo' ? 'activo' : ''} aria-pressed={modal.modo === 'bloqueo'} onClick={() => onChange({ ...modal, modo: 'bloqueo' })}>
              Reservada
            </Button2>
            <Button2 className={modal.modo === 'turno_fijo' ? 'activo' : ''} aria-pressed={modal.modo === 'turno_fijo'} onClick={() => onChange({ ...modal, modo: 'turno_fijo' })}>
              Turno fijo
            </Button2>
          </div>
          <p className="cmodal-nota">
            {modal.modo === 'bloqueo'
              ? 'Solo este día, por ejemplo una reserva que llegó por WhatsApp.'
              : `Se repite todos los ${dia} a la misma hora.`}
          </p>
        </div>
        <label className="cmodal-campo">
          <span className="cmodal-label">A nombre de</span>
          <input
            className="cmodal-input"
            placeholder="Juan Pérez"
            value={modal.nombre}
            onChange={(e) => onChange({ ...modal, nombre: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter' && modal.nombre.trim()) onSave() }}
            autoFocus
          />
        </label>
      </>
    )
    acciones = (
      <>
        <Button2 className="btn2-sec" onClick={onClose}>Cancelar</Button2>
        <Button2 className="btn2-primary" onClick={onSave} disabled={!modal.nombre.trim()}>Ocupar turno</Button2>
      </>
    )
  } else if (modal.tipo === 'turno_fijo' && modal.turno) {
    const { turno } = modal
    titulo = 'Turno fijo'
    cuerpo = (
      <Detalle filas={[
        ['A nombre de', turno.nombre || 'Sin nombre'],
        ['Cancha', modal.canchaNombre],
        ['Se repite', `todos los ${DIAS[turno.dia_semana].toLowerCase()}`],
        ['Horario', `${turno.hora_inicio.slice(0, 5)} a ${turno.hora_fin ? turno.hora_fin.slice(0, 5) : '?'} hs`, true],
        ['Estado', turno.activo ? 'Activo' : 'Liberado'],
      ]} />
    )
    acciones = (
      <>
        <Button2 className="btn2-peligro" onClick={() => onDeleteTurno(turno.id)}>Eliminar</Button2>
        <span className="cmodal-espacio" />
        <Button2 className="btn2-sec" onClick={onClose}>Volver</Button2>
        <Button2 className="btn2-sec" onClick={() => onToggleTurno(turno.id)}>{turno.activo ? 'Liberar' : 'Reactivar'}</Button2>
      </>
    )
  } else if (modal.tipo === 'bloqueo' && modal.bloqueo) {
    titulo = 'Reservada'
    cuerpo = (
      <Detalle filas={[
        ['A nombre de', modal.bloqueo.motivo],
        ['Cancha', modal.canchaNombre],
        ['Horario', `${modal.bloqueo.hora_inicio.slice(0, 5)} hs`, true],
      ]} />
    )
    acciones = (
      <>
        <Button2 className="btn2-sec" onClick={onClose}>Volver</Button2>
        <Button2 className="btn2-peligro" onClick={() => onDeleteBloqueo(modal.bloqueo.id)}>Liberar</Button2>
      </>
    )
  } else if (modal.tipo === 'reserva') {
    titulo = ESTADO_LABEL[modal.slot.estado] ?? 'Reserva'
    cuerpo = (
      <>
        <Detalle filas={[
          ['A nombre de', modal.slot.nombre],
          ['Cancha', modal.canchaNombre],
          ['Horario', `${modal.slot.hora_inicio.slice(0, 5)} hs`, true],
        ]} />
        <p className="cmodal-nota">Las reservas online se confirman o cancelan desde Reservas.</p>
      </>
    )
    acciones = (
      <>
        <Button2 className="btn2-sec" onClick={onClose}>Cerrar</Button2>
        <Button2 className="btn2-primary" onClick={() => navigate('/admin/reservas')}>Ir a Reservas</Button2>
      </>
    )
  }

  return (
    <div className="cmodal-fondo" onClick={onClose}>
      <div className="cmodal" role="dialog" aria-modal="true" aria-labelledby="cmodal-titulo" onClick={(e) => e.stopPropagation()}>
        <div className="cmodal-cabecera">
          <h2 className="cmodal-titulo" id="cmodal-titulo">{titulo}</h2>
          <button type="button" className="cmodal-cerrar" aria-label="Cerrar" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        {cuerpo}
        {error && <p className="cmodal-error" role="alert">{error}</p>}
        <div className="cmodal-acciones">{acciones}</div>
      </div>
    </div>
  )
}

export default CanchasModal
