import { Link } from 'react-router-dom'

import './not-found.css'

/**
 * Props compartidos por todas las variantes:
 * code, title, description, homeHref, homeLabel, browseHref, browseLabel.
 * Si `browseHref` es null no se muestra el botón secundario.
 */

function NotFoundLink({ href, className, children }) {
  if (href.startsWith('/')) return <Link className={className} to={href}>{children}</Link>
  return <a className={className} href={href}>{children}</a>
}

/** Contenedor común: centra el contenido y recibe los eventos de puntero de cada variante. */
export function NotFoundStage({ className = '', children, ...rest }) {
  return (
    <section className={`nf-stage ${className}`.trim()} {...rest}>
      {children}
    </section>
  )
}

/** Título y descripción. El título es el h1 de la página. */
export function NotFoundCopy({ title, description }) {
  return (
    <div className="nf-copy">
      <h1 className="nf-title">{title}</h1>
      {description && <p className="nf-description">{description}</p>}
    </div>
  )
}

/** Botón principal (inicio) y secundario opcional (navegar). */
export function NotFoundActions({ homeHref, homeLabel, browseHref, browseLabel }) {
  return (
    <div className="nf-actions">
      {homeHref && <NotFoundLink className="nf-btn nf-btn-primary" href={homeHref}>{homeLabel}</NotFoundLink>}
      {browseHref && <NotFoundLink className="nf-btn nf-btn-secondary" href={browseHref}>{browseLabel}</NotFoundLink>}
    </div>
  )
}
