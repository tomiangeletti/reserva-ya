import { useState } from 'react'
import { MessageCircle } from 'lucide-react'

import Button2 from '../ui/button-2'
import { cuentaRegresiva, diaRelativo, formatoPrecio } from './tiempo'

/** Link de WhatsApp: los números locales de 10 dígitos llevan el prefijo de Argentina (549). */
function linkWhatsApp(reserva, club) {
  const digitos = reserva.telefono_cliente.replace(/\D/g, '')
  const numero = digitos.length === 10 ? `549${digitos}` : digitos
  const texto = `Hola ${reserva.nombre_cliente}, te escribimos de ${club} por tu reserva del ${diaRelativo(reserva.fecha)} a las ${reserva.hora_inicio.slice(0, 5)} hs.`
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`
}

function Fila({ reserva, club, ahora, ocupado, onConfirmar, onCancelar }) {
  const [preguntando, setPreguntando] = useState(false)
  const restante = reserva.expira_en ? (new Date(reserva.expira_en) - ahora) / 1000 : null
  const urgente = restante !== null && restante < 5 * 60

  return (
    <li className="dash-pendiente">
      <div className="dash-pendiente-info">
        <span className="dash-pendiente-nombre">{reserva.nombre_cliente}</span>
        <span className="dash-tenue">
          {reserva.cancha_nombre}, <span className="dash-mono">{diaRelativo(reserva.fecha)} {reserva.hora_inicio.slice(0, 5)}</span>, seña {formatoPrecio(reserva.monto_senia)}
        </span>
      </div>

      {restante !== null && (
        <span className={`dash-vence dash-mono ${urgente ? 'urgente' : ''}`} title="Si no se confirma, la reserva se libera sola">
          {restante > 0 ? `vence en ${cuentaRegresiva(restante)}` : 'venciendo…'}
        </span>
      )}

      <div className="dash-pendiente-acciones">
        {preguntando ? (
          <>
            <span className="dash-tenue">¿Cancelar la reserva?</span>
            <Button2 className="btn2-sec dash-btn" onClick={() => setPreguntando(false)}>No</Button2>
            <Button2 className="btn2-peligro dash-btn" disabled={ocupado} onClick={() => onCancelar(reserva.id)}>Sí, cancelar</Button2>
          </>
        ) : (
          <>
            <a className="dash-icono-btn" href={linkWhatsApp(reserva, club)} target="_blank" rel="noreferrer" aria-label={`Escribirle a ${reserva.nombre_cliente} por WhatsApp`} title="WhatsApp">
              <MessageCircle size={16} aria-hidden="true" />
            </a>
            <Button2 className="btn2-sec dash-btn" disabled={ocupado} onClick={() => setPreguntando(true)}>Cancelar</Button2>
            <Button2 className="btn2-primary dash-btn" disabled={ocupado} onClick={() => onConfirmar(reserva.id)}>Confirmar seña</Button2>
          </>
        )}
      </div>
    </li>
  )
}

/** Reservas pendientes de seña, con vencimiento y acciones. */
function PorConfirmar({ pendientes, club, ahora, ocupado, onConfirmar, onCancelar }) {
  return (
    <section className="dash-panel" aria-labelledby="dash-pendientes">
      <header className="dash-panel-cabecera">
        <h2 className="dash-panel-titulo" id="dash-pendientes">Por confirmar</h2>
        <span className="dash-tenue">Se liberan solas si la seña no llega a tiempo</span>
      </header>
      {pendientes.length === 0 ? (
        <p className="dash-vacio">No hay señas esperando. Las reservas nuevas aparecen acá.</p>
      ) : (
        <ul className="dash-pendientes">
          {pendientes.map((reserva) => (
            <Fila key={reserva.id} reserva={reserva} club={club} ahora={ahora} ocupado={ocupado} onConfirmar={onConfirmar} onCancelar={onCancelar} />
          ))}
        </ul>
      )}
    </section>
  )
}

export default PorConfirmar
