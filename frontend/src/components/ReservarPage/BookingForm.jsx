function BookingForm({ form, enviando, error, onChange, onSubmit, onBack }) {
  return (
    <form className="reservar-form" onSubmit={onSubmit}>
      <label className="reservar-campo">
        <span className="reservar-label">Nombre y apellido</span>
        <input className="reservar-input" type="text" autoComplete="name" placeholder="Ej: Juan Pérez" value={form.nombre} onChange={(e) => onChange({ ...form, nombre: e.target.value })} required />
      </label>
      <label className="reservar-campo">
        <span className="reservar-label">WhatsApp</span>
        <input
          className="reservar-input"
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          maxLength={10}
          pattern="[0-9]{6,10}"
          placeholder="Ej: 1155550000"
          value={form.telefono}
          onChange={(e) => onChange({ ...form, telefono: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          required
          minLength={6}
        />
      </label>
      {error && <p className="reservar-error">{error}</p>}
      <div className="reservar-acciones">
        <button type="button" className="reservar-btn-sec" onClick={onBack}>Volver</button>
        <button type="submit" className="reservar-btn" disabled={enviando}>{enviando ? 'Reservando…' : 'Confirmar reserva'}</button>
      </div>
    </form>
  )
}

export default BookingForm
