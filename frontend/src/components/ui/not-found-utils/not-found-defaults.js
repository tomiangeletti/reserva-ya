/**
 * Valores por defecto compartidos por las cinco variantes del 404.
 * Cualquier prop que se pase a <NotFound /> pisa estos valores.
 */
export const NOT_FOUND_DEFAULTS = {
  code: '404',
  title: 'No encontramos esta página',
  description: 'Puede que el enlace esté mal escrito o que la página ya no exista.',
  homeHref: '/reservar',
  homeLabel: 'Reservar un turno',
  browseHref: null,
  browseLabel: 'Ver otra página',
}

/** Mezcla los props recibidos con los valores por defecto, ignorando los `undefined`. */
export function resolveNotFoundProps(props) {
  const resolved = { ...NOT_FOUND_DEFAULTS }
  for (const [key, value] of Object.entries(props)) {
    if (value !== undefined) resolved[key] = value
  }
  return resolved
}

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
