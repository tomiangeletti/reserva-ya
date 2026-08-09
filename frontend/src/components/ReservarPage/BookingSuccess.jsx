import { SummaryRow } from './BookingSummary'

function BookingSuccess({ turno, config, formatoDia, formatoPrecio, whatsappUrl, onRestart }) {
  return (
    <section className="reservar-step">
      <div className="reservar-ok">✓</div>
      <h2 className="reservar-step-title">Reserva pendiente</h2>
      <p className="reservar-pendiente">
        Tu turno quedó reservado pero <strong>no está confirmado</strong> hasta que el club reciba la seña de <strong>{formatoPrecio(config.monto_senia_default)}</strong> por transferencia al alias <strong>{config.alias_transferencia}</strong>.
      </p>
      <div className="reservar-resumen">
        <SummaryRow etiqueta="Cancha" valor={turno.cancha_nombre} />
        <SummaryRow etiqueta="Día" valor={formatoDia(turno.fecha)} />
        <SummaryRow etiqueta="Horario" valor={`${turno.hora} hs`} />
        <SummaryRow etiqueta="Precio" valor={formatoPrecio(config.precio_cancha_default)} />
        <SummaryRow etiqueta="Adicional pelotas" valor={formatoPrecio(config.adicional_pelotas)} />
        <SummaryRow etiqueta="Total" valor={formatoPrecio(Number(config.precio_cancha_default) + Number(config.adicional_pelotas))} />
      </div>
      <a className="reservar-btn reservar-wa" href={whatsappUrl} target="_blank" rel="noreferrer">Enviar comprobante por WhatsApp</a>
      <button type="button" className="reservar-btn-sec" onClick={onRestart}>Hacer otra reserva</button>
    </section>
  )
}

export default BookingSuccess
