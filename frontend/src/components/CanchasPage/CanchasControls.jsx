function CanchasControls({ fecha, onFechaChange }) {
  return (
    <div className="canchas-controls">
      <label className="config-field">
        <span className="config-label">Fecha</span>
        <input className="config-input" type="date" value={fecha} onChange={(e) => onFechaChange(e.target.value)} />
      </label>
    </div>
  )
}

export default CanchasControls
