const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export const TOKEN_KEY = 'eltunel_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(detail)
    this.status = status
  }
}

/**
 * Wrapper de fetch contra la API.
 *
 * - `path` es relativo a la base (ej. "/auth/login" → /api/auth/login).
 * - Si hay token guardado (o lo pasás en `token`), agrega `Authorization: Bearer`.
 * - Si `body` es un objeto, lo manda como JSON.
 * - Ante una respuesta no-OK lanza `ApiError` con `status` y el `detail` del backend.
 * - Si la API responde 401, limpia el token guardado.
 *
 * Ejemplos:
 *   const canchas = await apiFetch('/canchas')
 *   await apiFetch('/auth/login', { method: 'POST', body: { username, password } })
 *   await apiFetch(`/reservas/${id}/confirmar`, { method: 'PATCH' })
 */
export async function apiFetch(
  path,
  { method = 'GET', body, token = getToken(), headers = {} } = {},
) {
  const options = { method, headers: { ...headers } }

  if (token) {
    options.headers.Authorization = `Bearer ${token}`
  }
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, options)
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  if (res.status === 401) {
    clearToken()
  }

  const contentType = res.headers.get('content-type') ?? ''
  let data = null
  if (res.status !== 204 && contentType.includes('application/json')) {
    try {
      data = await res.json()
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    const detail = Array.isArray(data?.detail)
      ? data.detail.map((d) => d.msg).join(', ')
      : (data?.detail ?? res.statusText)
    throw new ApiError(res.status, detail)
  }

  return data
}
