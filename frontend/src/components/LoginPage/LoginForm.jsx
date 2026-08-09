function LoginForm({ username, password, error, loading, onUsernameChange, onPasswordChange, onSubmit, logo }) {
  return (
    <form className="login-card" onSubmit={onSubmit}>
      <img className="login-logo" src={logo} alt="El Túnel" />
      <p className="login-subtitle">Panel de administración</p>
      <label className="login-field">
        <span className="login-label">Usuario</span>
        <input className="login-input" value={username} onChange={(e) => onUsernameChange(e.target.value)} autoFocus autoComplete="username" required />
      </label>
      <label className="login-field">
        <span className="login-label">Contraseña</span>
        <input className="login-input" type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p className="login-error">{error}</p>}
      <button className="login-button" type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
    </form>
  )
}

export default LoginForm
