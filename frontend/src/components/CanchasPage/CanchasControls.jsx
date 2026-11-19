import DatePicker from '../ui/date-picker'

function CanchasControls({ fecha, onFechaChange }) {
  return (
    <div className="canchas-controls">
      <div className="config-field">
        <span className="config-label" id="canchas-fecha-label">Fecha</span>
        <DatePicker id="canchas-fecha" aria-labelledby="canchas-fecha-label" value={fecha} onChange={onFechaChange} />
      </div>
    </div>
  )
}

export default CanchasControls
