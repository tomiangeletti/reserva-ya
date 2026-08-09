function TimeSlots({ loading, horarios, onSelect }) {
  if (loading) return <p className="reservar-hint">Cargando horarios…</p>
  if (horarios.length === 0) return <p className="reservar-hint">No hay horarios disponibles para este día.</p>

  return (
    <div className="reservar-horarios">
      {horarios.map((horario) => (
        <button key={horario.hora} type="button" className={`reservar-hora ${horario.disponible ? '' : 'ocupado'}`} disabled={!horario.disponible} onClick={() => onSelect(horario.hora)}>
          {horario.hora}
          {!horario.disponible && <span className="reservar-hora-ocu">Ocupado</span>}
        </button>
      ))}
    </div>
  )
}

export default TimeSlots
