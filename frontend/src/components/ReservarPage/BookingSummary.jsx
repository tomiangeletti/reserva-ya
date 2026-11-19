function SummaryRow({ etiqueta, valor, mono = false, total = false }) {
  return (
    <div className={`reservar-fila ${total ? 'total' : ''}`}>
      <span className="reservar-fila-etiq">{etiqueta}</span>
      <span className={`reservar-fila-valor ${mono ? 'reservar-mono' : ''}`}>{valor}</span>
    </div>
  )
}

function BookingSummary({ turno, config, formatoDia, formatoPrecio }) {
  const total = Number(config.precio_cancha_default) + Number(config.adicional_pelotas)
  return (
    <div className="reservar-resumen">
      <SummaryRow etiqueta="Cancha" valor={turno.cancha_nombre} />
      <SummaryRow etiqueta="Día" valor={formatoDia(turno.fecha)} />
      <SummaryRow etiqueta="Horario" valor={`${turno.hora} hs`} mono />
      <SummaryRow etiqueta="Precio" valor={formatoPrecio(config.precio_cancha_default)} mono />
      <SummaryRow etiqueta="Adicional pelotas" valor={formatoPrecio(config.adicional_pelotas)} mono />
      <SummaryRow etiqueta="Total" valor={formatoPrecio(total)} mono total />
    </div>
  )
}

export { SummaryRow }
export default BookingSummary
