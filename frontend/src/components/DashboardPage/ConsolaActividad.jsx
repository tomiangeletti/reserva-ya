import { useEffect, useState } from 'react'

import { horaCorta } from './tiempo'

const ETIQUETAS = {
  nueva: 'nueva',
  sena: 'seña',
  vencida: 'vencida',
}

const MS_POR_PASO = 16
const CARACTERES_POR_PASO = 2
const ESCRIBIR_AL_CARGAR = 3

function haceCuanto(segundos) {
  if (segundos < 5) return 'recién'
  if (segundos < 60) return `hace ${Math.floor(segundos)} s`
  return `hace ${Math.floor(segundos / 60)} min`
}

/**
 * Terminal de actividad en vivo. Recibe eventos en orden cronológico
 * ({ id, fecha, tipo, texto }) y escribe letra por letra los que todavía no
 * mostró. Al cargar, los eventos viejos aparecen enteros y solo se escriben
 * los últimos; después se escribe cada evento nuevo que llega.
 */
function ConsolaActividad({ eventos, club, actualizado, ahora }) {
  const [vistos, setVistos] = useState(null)
  const [escritos, setEscritos] = useState(0)

  // Primera carga: marca como vistos todos menos los últimos (ajuste de estado durante el render).
  if (vistos === null && actualizado) {
    setVistos(eventos.slice(0, -ESCRIBIR_AL_CARGAR).map((evento) => evento.id))
  }

  const actual = vistos === null ? null : eventos.find((evento) => !vistos.includes(evento.id))
  const actualId = actual?.id
  const largo = actual?.texto.length ?? 0

  useEffect(() => {
    if (!actualId) return
    const terminado = escritos >= largo
    const id = setTimeout(() => {
      if (terminado) {
        setVistos((ids) => [...ids, actualId])
        setEscritos(0)
      } else {
        setEscritos((n) => n + CARACTERES_POR_PASO)
      }
    }, terminado ? 140 : MS_POR_PASO)
    return () => clearTimeout(id)
  }, [actualId, largo, escritos])

  const visibles = vistos === null ? [] : eventos.filter((evento) => vistos.includes(evento.id) || evento.id === actual?.id)

  return (
    <section className="dash-consola" aria-labelledby="dash-consola-titulo">
      <header className="dash-consola-barra">
        <span className="dash-consola-puntos" aria-hidden="true"><span /><span /><span /></span>
        <h2 className="dash-consola-titulo" id="dash-consola-titulo">actividad</h2>
        <span className="dash-consola-vivo">
          <span className="dash-pulso" aria-hidden="true" />
          <span>en vivo</span>
          {actualizado && <span className="dash-tenue">{haceCuanto((ahora - actualizado) / 1000)}</span>}
        </span>
      </header>

      <div className="dash-consola-cuerpo" role="log" aria-live="polite" aria-busy={Boolean(actual)}>
        <p className="dash-consola-linea sistema">
          <span className="dash-consola-prompt">$</span> conectado a {club}
        </p>
        {actualizado && eventos.length === 0 && (
          <p className="dash-consola-linea sistema">sin actividad reciente</p>
        )}
        {visibles.map((evento) => {
          const escribiendo = evento.id === actual?.id
          return (
            <p key={evento.id} className={`dash-consola-linea ${evento.tipo}`}>
              <span className="dash-consola-hora">{horaCorta(evento.fecha)}</span>
              <span className="dash-consola-tipo">{ETIQUETAS[evento.tipo]}</span>
              <span className="dash-consola-texto">
                {escribiendo ? evento.texto.slice(0, escritos) : evento.texto}
                {escribiendo && <span className="dash-consola-cursor escribiendo" aria-hidden="true" />}
              </span>
            </p>
          )
        })}
        {!actual && (
          <p className="dash-consola-linea sistema">
            <span className="dash-consola-prompt">›</span> esperando eventos<span className="dash-consola-cursor" aria-hidden="true" />
          </p>
        )}
      </div>
    </section>
  )
}

export default ConsolaActividad
