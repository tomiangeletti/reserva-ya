function ReservasControls({ filtro, onFiltroChange, busqueda, onBusquedaChange, onSearch }) {
  return (
    <div className="reservas-controls">
      <div className="reservas-tabs">
        {[
          ['hoy', 'Hoy'],
          ['proximas', 'Próximas'],
          ['todas', 'Todas'],
        ].map(([valor, etiqueta]) => (
          <button
            className={`reserva-tab${filtro === valor ? ' active' : ''}`}
            onClick={() => onFiltroChange(valor)}
            key={valor}
          >
            {etiqueta}
          </button>
        ))}
      </div>
      <form className="reservas-search" onSubmit={onSearch}>
        <input
          className="config-input"
          placeholder="Buscar por cliente o teléfono"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
        />
        <button className="mini-btn" type="submit">Buscar</button>
      </form>
    </div>
  )
}

export default ReservasControls
