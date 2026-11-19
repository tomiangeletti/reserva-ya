/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'

import { apiFetch } from './client'

const ClubContext = createContext(null)

/**
 * Resuelve el club del subdominio actual consultando /api/config.
 *
 * Si el backend responde 404 (club inexistente, suspendido o con la prueba
 * vencida), no se muestra ninguna pantalla de la app: solo un aviso genérico.
 * Otros errores (por ejemplo, backend caído) dejan pasar a las páginas, que
 * muestran su propio mensaje.
 */
export function ClubProvider({ children }) {
  const [estado, setEstado] = useState({ cargando: true, noDisponible: false, club: null })

  useEffect(() => {
    apiFetch('/config', { token: null })
      .then((config) => setEstado({ cargando: false, noDisponible: false, club: config }))
      .catch((err) => setEstado({ cargando: false, noDisponible: err.status === 404, club: null }))
  }, [])

  useEffect(() => {
    if (estado.club?.club_nombre) document.title = `${estado.club.club_nombre} — Reservas online`
  }, [estado.club])

  if (estado.cargando) return null

  if (estado.noDisponible) {
    return (
      <main className="reservar-page">
        <div className="reservar-card">
          <p className="reservar-hint">Este club no está disponible actualmente.</p>
        </div>
      </main>
    )
  }

  return <ClubContext.Provider value={estado.club}>{children}</ClubContext.Provider>
}

/** Configuración pública del club actual (o null si no se pudo cargar). */
export function useClub() {
  return useContext(ClubContext)
}
