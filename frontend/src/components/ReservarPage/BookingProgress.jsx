const ETIQUETAS = ['Elegí tu turno', 'Confirmá tus datos', 'Listo']

function BookingProgress({ paso }) {
  return (
    <div className="reservar-progreso" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={paso} aria-valuetext={`Paso ${paso} de 3: ${ETIQUETAS[paso - 1]}`}>
      {ETIQUETAS.map((etiqueta, index) => (
        <span key={etiqueta} className={`reservar-progreso-seg ${paso > index ? 'hecho' : ''}`} />
      ))}
    </div>
  )
}

export default BookingProgress
