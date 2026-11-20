import Button2 from '../ui/button-2'

function DatePicker({ dias, fecha, onSelect }) {
  return (
    <div className="reservar-dias">
      {dias.map((dia) => (
        <Button2 key={dia.fecha} className={`reservar-dia ${fecha === dia.fecha ? 'activo' : ''}`} aria-pressed={fecha === dia.fecha} onClick={() => onSelect(dia.fecha)}>
          <span className="reservar-dia-nombre">{dia.nombre}</span>
          <span className="reservar-dia-num">{dia.numero}</span>
        </Button2>
      ))}
    </div>
  )
}

export default DatePicker
