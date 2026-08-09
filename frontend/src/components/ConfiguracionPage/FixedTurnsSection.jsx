const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function FixedTurnForm({ form, canchas, horas, cierreEsMedianoche, onChange, onSubmit }) {
  return (
    <form className="turno-form" onSubmit={onSubmit}>
      <label className="config-field">
        <span className="config-label">Cancha</span>
        <select className="config-input" value={form.cancha_id} onChange={(e) => onChange({ cancha_id: e.target.value })} required>
          {canchas.map((cancha) => <option key={cancha.id} value={cancha.id}>{cancha.nombre}</option>)}
        </select>
      </label>
      <label className="config-field">
        <span className="config-label">Día</span>
        <select className="config-input" value={form.dia_semana} onChange={(e) => onChange({ dia_semana: e.target.value })}>
          {DIAS.map((dia, index) => <option key={dia} value={index}>{dia}</option>)}
        </select>
      </label>
      <label className="config-field">
        <span className="config-label">Desde</span>
        <select className="config-input" value={form.hora_desde} onChange={(e) => onChange({ hora_desde: e.target.value })} required>
          <option value="">—</option>
          {horas.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
        </select>
      </label>
      <label className="config-field">
        <span className="config-label">Hasta</span>
        <select className="config-input" value={form.hora_hasta} onChange={(e) => onChange({ hora_hasta: e.target.value })} required>
          <option value="">—</option>
          {horas.filter((hora) => hora > form.hora_desde).map((hora) => <option key={hora} value={hora}>{hora}</option>)}
          {cierreEsMedianoche && <option value="00:00">00:00</option>}
        </select>
      </label>
      <label className="config-field">
        <span className="config-label">A nombre de</span>
        <input className="config-input" value={form.nombre} onChange={(e) => onChange({ nombre: e.target.value })} placeholder="Ej: Liga de Fulano" required />
      </label>
      <div className="config-actions">
        <button className="config-save" type="submit" disabled={!form.nombre.trim() || !form.hora_desde || !form.hora_hasta}>Guardar turno fijo</button>
      </div>
    </form>
  )
}

function FixedTurnsSection({ canchas, turnos, showForm, form, horas, cierreEsMedianoche, onToggleForm, onChange, onSubmit, onToggleTurno, onDeleteTurno }) {
  return (
    <section className="config-card">
      <div className="config-card-header">
        <div>
          <h2 className="config-section-title">Turnos fijos</h2>
          <p className="admin-hint">Ocupan la cancha todas las semanas en ese horario.</p>
        </div>
        <button className="config-save" type="button" onClick={onToggleForm}>{showForm ? 'Cancelar' : 'Agregar turno fijo'}</button>
      </div>

      {showForm && (
        <FixedTurnForm
          form={form}
          canchas={canchas}
          horas={horas}
          cierreEsMedianoche={cierreEsMedianoche}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      )}

      {turnos.length === 0 ? (
        <p className="admin-hint">Todavía no hay turnos fijos cargados.</p>
      ) : (
        <ul className="turno-list">
          {turnos.map((turno) => {
            const cancha = canchas.find((item) => item.id === turno.cancha_id)
            return (
              <li key={turno.id} className="turno-item">
                <div className="turno-info">
                  <strong>{turno.nombre || 'Sin nombre'}</strong>
                  <span>{DIAS[turno.dia_semana]} · {turno.hora_inicio.slice(0, 5)} – {turno.hora_fin ? turno.hora_fin.slice(0, 5) : '?'} hs · {cancha?.nombre ?? `Cancha ${turno.cancha_id}`}</span>
                  {!turno.activo && <span className="estado-badge cancelada">inactivo</span>}
                </div>
                <div className="config-actions">
                  <button className="mini-btn" onClick={() => onToggleTurno(turno.id)}>{turno.activo ? 'Liberar' : 'Reactivar'}</button>
                  <button className="mini-btn danger" onClick={() => onDeleteTurno(turno.id)}>Eliminar</button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export { DIAS }
export default FixedTurnsSection
