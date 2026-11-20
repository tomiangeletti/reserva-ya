import { resolveNotFoundProps } from './not-found-defaults'
import { NotFoundActions, NotFoundCopy, NotFoundStage } from './not-found-shared'

const CAPAS = 4

/** El código se apila en capas contorneadas que flotan desfasadas detrás de la principal. */
export function NotFoundStacked(props) {
  const { code, title, description, ...links } = resolveNotFoundProps(props)
  return (
    <NotFoundStage className="nf-stacked">
      <div className="nf-stacked-code" aria-hidden="true">
        {Array.from({ length: CAPAS }, (_, i) => CAPAS - i).map((nivel) => (
          <p key={nivel} className="nf-code nf-stacked-layer" style={{ '--nf-nivel': nivel }}>{code}</p>
        ))}
        <p className="nf-code nf-stacked-top">{code}</p>
      </div>
      <NotFoundCopy title={title} description={description} />
      <NotFoundActions {...links} />
    </NotFoundStage>
  )
}
