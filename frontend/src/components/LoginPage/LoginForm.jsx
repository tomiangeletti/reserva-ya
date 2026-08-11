import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

function LoginForm({ username, password, error, loading, onUsernameChange, onPasswordChange, onSubmit }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <form className="login-card" onSubmit={onSubmit}>
      <img className="login-brand-mark" src="/favicon-ry.svg" alt="RY" />
      <h1 className="login-brand-name">Reservas ya</h1>
      <p className="login-subtitle">Panel de administración</p>
      <label className="login-field">
        <span className="login-label">Usuario</span>
        <input className="login-input" value={username} onChange={(e) => onUsernameChange(e.target.value)} autoFocus autoComplete="username" required />
      </label>
      <label className="login-field">
        <span className="login-label">Contraseña</span>
        <div className="login-input-group">
          <input
            className="login-input"
            type={isVisible ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="login-toggle-password"
            onClick={() => setIsVisible(!isVisible)}
            aria-label={isVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </label>
      {error && <p className="login-error">{error}</p>}
      <button className="login-button" type="submit" disabled={loading}>{loading ? 'Ingresando…' : 'Ingresar'}</button>
      <Link className="login-forgot" to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
    </form>
  )
}

export default LoginForm
