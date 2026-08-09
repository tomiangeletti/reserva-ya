function DatePicker({ dias, fecha, onSelect }) {
  return (
    <div className="reservar-dias">
      {dias.map((dia) => (
        <button key={dia.fecha} type="button" className={`reservar-dia ${fecha === dia.fecha ? 'activo' : ''}`} onClick={() => onSelect(dia.fecha)}>
          <span className="reservar-dia-nombre">{dia.nombre}</span>
          <span className="reservar-dia-num">{dia.numero}</span>
        </button>
      ))}
    </div>
  )
}

export default DatePicker
