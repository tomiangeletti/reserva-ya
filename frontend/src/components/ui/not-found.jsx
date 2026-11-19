import { NotFoundGlitch } from './not-found-utils/not-found-glitch'
import { NotFoundMagnetic } from './not-found-utils/not-found-magnetic'
import { NotFoundSpotlight } from './not-found-utils/not-found-spotlight'
import { NotFoundStacked } from './not-found-utils/not-found-stacked'
import { NotFoundTerminal } from './not-found-utils/not-found-terminal'
import { NOT_FOUND_DEFAULTS } from './not-found-utils/not-found-defaults'
import { NotFoundActions, NotFoundStage } from './not-found-utils/not-found-shared'

/**
 * Variantes disponibles: "glitch" | "magnetic" | "spotlight" | "stacked" | "terminal".
 *
 * Props compartidos por las cinco (ver NOT_FOUND_DEFAULTS):
 * code, title, description, homeHref, homeLabel, browseHref, browseLabel.
 *
 * Basado en el componente not-found de 21st.dev. Las cinco variantes son
 * una implementación propia en CSS plano, porque el registro original no
 * publica sus archivos.
 */
export default function NotFound({ variant = 'glitch', ...props }) {
  switch (variant) {
    case 'magnetic':
      return <NotFoundMagnetic {...props} />
    case 'spotlight':
      return <NotFoundSpotlight {...props} />
    case 'stacked':
      return <NotFoundStacked {...props} />
    case 'terminal':
      return <NotFoundTerminal {...props} />
    case 'glitch':
    default:
      return <NotFoundGlitch {...props} />
  }
}

export {
  NotFoundGlitch,
  NotFoundMagnetic,
  NotFoundSpotlight,
  NotFoundStacked,
  NotFoundTerminal,
  NotFoundActions,
  NotFoundStage,
  NOT_FOUND_DEFAULTS,
}
