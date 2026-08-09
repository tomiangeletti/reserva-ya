function NewPasswordForm({ password, confirmation, loading, error, success, onPasswordChange, onConfirmationChange, onSubmit }) {
  return (
    <form className="password-card" onSubmit={onSubmit}>
      <div className="password-brand-mark">RY</div>
      <p className="password-kicker">RESERVAS YA</p>
      <h1>Nueva contraseña</h1>
      <p className="password-description">Elegí una contraseña de al menos 8 caracteres para proteger tu cuenta.</p>
      <label className="password-field">
        <span>Nueva contraseña</span>
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => onPasswordChange(e.target.value)} minLength={8} required />
      </label>
      <label className="password-field">
        <span>Repetir contraseña</span>
        <input type="password" autoComplete="new-password" value={confirmation} onChange={(e) => onConfirmationChange(e.target.value)} minLength={8} required />
      </label>
      {error && <p className="password-error">{error}</p>}
      {success && <p className="password-success">{success}</p>}
      <button className="password-button" type="submit" disabled={loading || Boolean(success)}>{loading ? 'Guardando…' : 'Cambiar contraseña'}</button>
      {success && <a className="password-back" href="/admin/login">Ir al inicio de sesión</a>}
    </form>
  )
}

export default NewPasswordForm
