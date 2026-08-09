function CourtPicker({ canchas, cancha, onSelect }) {
  return (
    <div className="reservar-canchas">
      {canchas.map((item) => (
        <button key={item.id} type="button" className={`reservar-cancha ${cancha === item.id ? 'activo' : ''}`} onClick={() => onSelect(item.id)}>
          {item.nombre}
        </button>
      ))}
    </div>
  )
}

export default CourtPicker
