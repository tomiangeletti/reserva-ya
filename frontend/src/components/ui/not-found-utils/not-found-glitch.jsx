import { resolveNotFoundProps } from './not-found-defaults'
import { NotFoundActions, NotFoundCopy, NotFoundStage } from './not-found-shared'

/** El código tiembla con dos copias desfasadas en color de acento y de error. */
export function NotFoundGlitch(props) {
  const { code, title, description, ...links } = resolveNotFoundProps(props)
  return (
    <NotFoundStage className="nf-glitch">
      <p className="nf-code nf-glitch-code" data-text={code} aria-hidden="true">{code}</p>
      <NotFoundCopy title={title} description={description} />
      <NotFoundActions {...links} />
    </NotFoundStage>
  )
}
