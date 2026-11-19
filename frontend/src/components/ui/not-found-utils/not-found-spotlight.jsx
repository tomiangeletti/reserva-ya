import { resolveNotFoundProps } from './not-found-defaults'
import { NotFoundActions, NotFoundCopy, NotFoundStage } from './not-found-shared'

/** El código está apagado y una linterna que sigue al puntero lo ilumina. */
export function NotFoundSpotlight(props) {
  const { code, title, description, ...links } = resolveNotFoundProps(props)

  function mover(e) {
    const caja = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--nf-x', `${e.clientX - caja.left}px`)
    e.currentTarget.style.setProperty('--nf-y', `${e.clientY - caja.top}px`)
  }

  return (
    <NotFoundStage className="nf-spotlight" onPointerMove={mover}>
      <div className="nf-spotlight-code" aria-hidden="true">
        <p className="nf-code nf-spotlight-dim">{code}</p>
        <p className="nf-code nf-spotlight-lit">{code}</p>
      </div>
      <NotFoundCopy title={title} description={description} />
      <NotFoundActions {...links} />
    </NotFoundStage>
  )
}
