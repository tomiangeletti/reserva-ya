import Button2 from '../ui/button-2'

import BookingSummary from './BookingSummary'

function BookingSuccess({ turno, config, formatoDia, formatoPrecio, whatsappUrl, onRestart }) {
  return (
    <section className="reservar-step">
      <div className="reservar-ok" aria-hidden="true">✓</div>
      <h2 className="reservar-step-title">Reserva pendiente</h2>
      <p className="reservar-pendiente">
        Tu turno quedó reservado pero <strong>no está confirmado</strong> hasta que el club reciba la seña de <strong>{formatoPrecio(config.monto_senia_default)}</strong> por transferencia al alias <strong className="reservar-mono">{config.alias_transferencia}</strong>.
      </p>
      <BookingSummary turno={turno} config={config} formatoDia={formatoDia} formatoPrecio={formatoPrecio} />
      <Button2 className="reservar-btn btn2-wa" href={whatsappUrl} target="_blank" rel="noreferrer">Enviar comprobante por WhatsApp</Button2>
      <Button2 className="reservar-btn-sec btn2-sec" onClick={onRestart}>Hacer otra reserva</Button2>
    </section>
  )
}

export default BookingSuccess
