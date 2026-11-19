import { useClub } from '../../api/club'

function BookingHeader() {
  const club = useClub()
  const nombre = club?.club_nombre || 'Reservas ya'

  return (
    <header className="reservar-header">
      <div className="reservar-brand-mark" aria-hidden="true">{nombre.slice(0, 2).toUpperCase()}</div>
      <p className="reservar-kicker">RESERVAS ONLINE</p>
      <h1 className="reservar-title">{nombre}</h1>
      <p className="reservar-subtitle">Reservá tu turno en pocos pasos</p>
    </header>
  )
}

export default BookingHeader
