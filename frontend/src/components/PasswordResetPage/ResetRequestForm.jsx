function ResetRequestForm({ email, loading, error, success, onEmailChange, onSubmit }) {
  return (
    <form className="password-card" onSubmit={onSubmit}>
      <div className="password-brand-mark">RY</div>
      <p className="password-kicker">RESERVAS YA</p>
      <h1>Recuperar contraseña</h1>
      <p className="password-description">Ingresá el email del administrador y te enviaremos un enlace para crear una nueva contraseña.</p>
      <label className="password-field">
        <span>Email del administrador</span>
        <input type="email" autoComplete="email" placeholder="admin@ejemplo.com" value={email} onChange={(e) => onEmailChange(e.target.value)} required />
      </label>
      {error && <p className="password-error">{error}</p>}
      {success && <p className="password-success">{success}</p>}
      <button className="password-button" type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar enlace'}</button>
      <a className="password-back" href="/admin/login">Volver al inicio de sesión</a>
    </form>
  )
}

export default ResetRequestForm
