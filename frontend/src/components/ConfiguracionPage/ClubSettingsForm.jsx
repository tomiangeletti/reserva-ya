function ClubSettingsForm({ form, loading, saved, error, onChange, onSubmit }) {
  return (
    <form className="config-card" onSubmit={onSubmit}>
      <h2 className="config-section-title">Precios y seña</h2>
      <div className="config-grid">
        <label className="config-field">
          <span className="config-label">Precio por turno ($)</span>
          <input className="config-input" name="precio_cancha_default" type="number" min="0" step="100" value={form.precio_cancha_default} onChange={onChange} required />
        </label>
        <label className="config-field">
          <span className="config-label">Seña ($)</span>
          <input className="config-input" name="monto_senia_default" type="number" min="0" step="100" value={form.monto_senia_default} onChange={onChange} required />
        </label>
        <label className="config-field">
          <span className="config-label">Adicional pelotas ($)</span>
          <input className="config-input" name="adicional_pelotas" type="number" min="0" step="100" value={form.adicional_pelotas} onChange={onChange} required />
        </label>
      </div>

      <h2 className="config-section-title">Horarios</h2>
      <div className="config-grid">
        <label className="config-field">
          <span className="config-label">Hora de apertura</span>
          <input className="config-input" name="hora_apertura" type="time" value={form.hora_apertura} onChange={onChange} />
        </label>
        <label className="config-field">
          <span className="config-label">Hora de cierre</span>
          <input className="config-input" name="hora_cierre" type="time" value={form.hora_cierre} onChange={onChange} />
        </label>
      </div>

      <h2 className="config-section-title">Datos del club</h2>
      <label className="config-field">
        <span className="config-label">Dirección</span>
        <input className="config-input" name="direccion" value={form.direccion} onChange={onChange} />
      </label>
      <label className="config-field">
        <span className="config-label">Alias de transferencia</span>
        <input className="config-input" name="alias_transferencia" value={form.alias_transferencia} onChange={onChange} />
      </label>
      <label className="config-field">
        <span className="config-label">Teléfono de WhatsApp</span>
        <input className="config-input" name="telefono_whatsapp" type="tel" placeholder="Ej: 5491100000000" value={form.telefono_whatsapp} onChange={onChange} />
      </label>

      {error && <p className="login-error">{error}</p>}
      {saved && <p className="config-saved">Cambios guardados.</p>}
      <div className="config-actions">
        <button className="config-save" type="submit" disabled={loading}>{loading ? 'Guardando…' : 'Guardar cambios'}</button>
      </div>
    </form>
  )
}

export default ClubSettingsForm
