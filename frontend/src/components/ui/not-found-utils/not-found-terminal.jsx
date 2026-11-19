import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { prefersReducedMotion, resolveNotFoundProps } from './not-found-defaults'
import { NotFoundActions, NotFoundStage } from './not-found-shared'

const MS_POR_CARACTER = 28

/** Una terminal escribe el intento de abrir la ruta actual y el error que devuelve. */
export function NotFoundTerminal(props) {
  const { code, title, description, ...links } = resolveNotFoundProps(props)
  const { pathname } = useLocation()

  const lineas = [
    { tipo: 'comando', texto: `abrir ${pathname}` },
    { tipo: 'error', texto: `error ${code}: ${title}` },
    { tipo: 'salida', texto: description ?? '' },
  ]
  const total = lineas.reduce((suma, linea) => suma + linea.texto.length, 0)
  const [escritos, setEscritos] = useState(() => (prefersReducedMotion() ? Infinity : 0))

  useEffect(() => {
    if (escritos >= total) return
    const id = setTimeout(() => setEscritos((n) => n + 1), MS_POR_CARACTER)
    return () => clearTimeout(id)
  }, [escritos, total])

  let restantes = escritos
  const visibles = lineas.map((linea) => {
    const texto = linea.texto.slice(0, Math.max(0, restantes))
    restantes -= linea.texto.length
    return { ...linea, texto }
  })
  const terminado = escritos >= total

  return (
    <NotFoundStage className="nf-terminal">
      <h1 className="nf-sr-only">{title}</h1>
      <div className="nf-terminal-window" aria-hidden="true">
        <div className="nf-terminal-bar">
          <span /><span /><span />
        </div>
        <pre className="nf-terminal-body">
          {visibles.map((linea, i) => (
            <div key={i} className={`nf-terminal-line nf-terminal-${linea.tipo}`}>
              {linea.tipo === 'comando' && <span className="nf-terminal-prompt">$ </span>}
              {linea.texto}
            </div>
          ))}
          <span className={`nf-terminal-cursor ${terminado ? 'listo' : ''}`} />
        </pre>
      </div>
      <p className="nf-sr-only">{description}</p>
      <NotFoundActions {...links} />
    </NotFoundStage>
  )
}
