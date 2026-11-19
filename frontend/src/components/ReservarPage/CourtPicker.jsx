import Button2 from '../ui/button-2'

function CourtPicker({ canchas, cancha, onSelect }) {
  return (
    <div className="reservar-canchas">
      {canchas.map((item) => (
        <Button2 key={item.id} className={`reservar-cancha ${cancha === item.id ? 'activo' : ''}`} aria-pressed={cancha === item.id} onClick={() => onSelect(item.id)}>
          {item.nombre}
        </Button2>
      ))}
    </div>
  )
}

export default CourtPicker
