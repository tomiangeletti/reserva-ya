function SummaryRow({ etiqueta, valor }) {
  return (
    <div className="reservar-fila">
      <span className="reservar-fila-etiq">{etiqueta}</span>
      <span className="reservar-fila-valor">{valor}</span>
    </div>
  )
}

function BookingSummary({ turno, config, formatoDia, formatoPrecio }) {
  const total = Number(config.precio_cancha_default) + Number(config.adicional_pelotas)
  return (
    <div className="reservar-resumen">
      <SummaryRow etiqueta="Cancha" valor={turno.cancha_nombre} />
      <SummaryRow etiqueta="Día" valor={formatoDia(turno.fecha)} />
      <SummaryRow etiqueta="Horario" valor={`${turno.hora} hs`} />
      <SummaryRow etiqueta="Precio" valor={formatoPrecio(config.precio_cancha_default)} />
      <SummaryRow etiqueta="Adicional pelotas" valor={formatoPrecio(config.adicional_pelotas)} />
      <SummaryRow etiqueta="Total" valor={formatoPrecio(total)} />
    </div>
  )
}

export { SummaryRow }
export default BookingSummary
