import Button2 from '../ui/button-2'

function TimeSlots({ loading, horarios, seleccionada, onSelect }) {
  if (loading) {
    return (
      <div className="reservar-horarios" aria-busy="true" aria-label="Cargando horarios">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="reservar-hora-skeleton" />)}
      </div>
    )
  }
  if (horarios.length === 0) return <p className="reservar-hint">No hay horarios disponibles para este día.</p>

  return (
    <div className="reservar-horarios">
      {horarios.map((horario) => (
        <Button2
          key={horario.hora}
          className={`reservar-hora ${seleccionada === horario.hora ? 'activo' : ''}`}
          disabled={!horario.disponible}
          aria-pressed={horario.disponible ? seleccionada === horario.hora : undefined}
          aria-label={horario.disponible ? undefined : `${horario.hora}, ocupado`}
          onClick={() => onSelect(horario.hora)}
        >
          {horario.hora}
        </Button2>
      ))}
    </div>
  )
}

export default TimeSlots
