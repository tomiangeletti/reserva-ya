import Button2 from '../ui/button-2'

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
        <Button2 className="reservar-btn-sec btn2-sec" onClick={onBack}>Volver</Button2>
        <Button2 type="submit" className="reservar-btn btn2-primary btn2-destello" disabled={enviando}>{enviando ? 'Reservando…' : 'Confirmar reserva'}</Button2>
      </div>
    </form>
  )
}

export default BookingForm
