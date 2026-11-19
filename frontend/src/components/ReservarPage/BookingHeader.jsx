import { useClub } from '../../api/club'

function BookingHeader({ paso }) {
  const club = useClub()
  const nombre = club?.club_nombre || 'Reservas ya'

  return (
    <header className="reservar-header">
      <div className="reservar-brand-mark" aria-hidden="true">{nombre.slice(0, 2).toUpperCase()}</div>
      <div className="reservar-header-info">
        <h1 className="reservar-title">{nombre}</h1>
        {club?.direccion && <p className="reservar-subtitle">{club.direccion}</p>}
      </div>
      <span className="reservar-contador reservar-mono" aria-hidden="true">{paso}/3</span>
    </header>
  )
}

export default BookingHeader
