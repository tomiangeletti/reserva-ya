import { useRef } from 'react'

import { prefersReducedMotion, resolveNotFoundProps } from './not-found-defaults'
import { NotFoundActions, NotFoundCopy, NotFoundStage } from './not-found-shared'

const RADIO = 320
const FUERZA = 0.35

/** Cada dígito se acerca al puntero cuando pasa cerca y vuelve a su lugar al salir. */
export function NotFoundMagnetic(props) {
  const { code, title, description, ...links } = resolveNotFoundProps(props)
  const digitos = useRef([])

  function mover(e) {
    if (prefersReducedMotion()) return
    for (const el of digitos.current) {
      if (!el) continue
      // offsetLeft/offsetTop ignoran el transform actual, así el centro no "persigue" al dígito.
      const base = el.offsetParent.getBoundingClientRect()
      const cx = base.left + el.offsetLeft + el.offsetWidth / 2
      const cy = base.top + el.offsetTop + el.offsetHeight / 2
      const dx = e.clientX - cx
      const dy = e.clientY - cy
      const tiron = Math.max(0, 1 - Math.hypot(dx, dy) / RADIO)
      el.style.transform = `translate(${dx * tiron * FUERZA}px, ${dy * tiron * FUERZA}px)`
    }
  }

  function soltar() {
    for (const el of digitos.current) if (el) el.style.transform = ''
  }

  return (
    <NotFoundStage className="nf-magnetic" onPointerMove={mover} onPointerLeave={soltar}>
      <p className="nf-code nf-magnetic-code" aria-hidden="true">
        {code.split('').map((caracter, i) => (
          <span key={i} className="nf-magnetic-digit" ref={(el) => { digitos.current[i] = el }}>{caracter}</span>
        ))}
      </p>
      <NotFoundCopy title={title} description={description} />
      <NotFoundActions {...links} />
    </NotFoundStage>
  )
}
