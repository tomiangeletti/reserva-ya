import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { apiFetch } from '../../api/client'
import NewPasswordForm from '../../components/PasswordResetPage/NewPasswordForm'
import ResetRequestForm from '../../components/PasswordResetPage/ResetRequestForm'
import './PasswordResetPage.css'

function PasswordResetPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function requestReset(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: { email: email.trim() },
      })
      setSuccess(response.message || 'Si el email existe, recibirás un enlace para restablecer la contraseña.')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const response = await apiFetch('/auth/password/reset', {
        method: 'POST',
        body: { token, new_password: password },
      })
      setSuccess(response.message || 'Contraseña actualizada correctamente.')
      setPassword('')
      setConfirmation('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="password-page">
      <div>
        {token ? (
          <NewPasswordForm
            password={password}
            confirmation={confirmation}
            loading={loading}
            error={error}
            success={success}
            onPasswordChange={setPassword}
            onConfirmationChange={setConfirmation}
            onSubmit={resetPassword}
          />
        ) : (
          <ResetRequestForm
            email={email}
            loading={loading}
            error={error}
            success={success}
            onEmailChange={setEmail}
            onSubmit={requestReset}
          />
        )}
        <p className="password-public-link"><Link to="/reservar">Volver a Reservas ya</Link></p>
      </div>
    </main>
  )
}

export default PasswordResetPage
