function BookingProgress({ paso }) {
  return (
    <div className="reservar-progreso" aria-label={`Paso ${paso} de 3`}>
      {[['1', 'Elegí'], ['2', 'Confirmá'], ['3', 'Listo']].map(([numero, etiqueta], index) => {
        const activo = paso === index + 1
        const completado = paso > index + 1
        return (
          <div className={`reservar-progreso-item ${activo ? 'activo' : ''} ${completado ? 'completado' : ''}`} key={numero}>
            <span className="reservar-progreso-num">{completado ? '✓' : numero}</span>
            <span>{etiqueta}</span>
            {index < 2 && <span className="reservar-progreso-linea" aria-hidden="true" />}
          </div>
        )
      })}
    </div>
  )
}

export default BookingProgress
