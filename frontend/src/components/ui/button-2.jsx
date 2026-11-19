import { useRef, useState } from 'react'

import './button-2.css'

/**
 * Botón con brillo que sigue al mouse (button-2 de 21st.dev, pasado a JSX + CSS plano).
 *
 * Igual que el original: el brillo aparece al entrar el mouse o al enfocar con
 * teclado, y mientras está enfocado deja de seguir al puntero.
 * Agregados para usarlo en la app: recibe `children`, `className`, `disabled`
 * y cualquier prop de <button>; si se pasa `href` se renderiza como enlace.
 *
 * Modificadores de estilo (en button-2.css): `activo`, `btn2-primary`,
 * `btn2-sec`, `btn2-wa` y `btn2-destello` (brillo que gira por el borde).
 */
export function Button2({ children, className = '', href, disabled, ...props }) {
  const divRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e) => {
    if (!divRef.current || isFocused || disabled) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleFocus = () => {
    setIsFocused(true)
    setOpacity(1)
  }

  const handleBlur = () => {
    setIsFocused(false)
    setOpacity(0)
  }

  const handleMouseEnter = () => {
    if (!disabled) setOpacity(1)
  }

  const handleMouseLeave = () => {
    setOpacity(0)
  }

  const Tag = href ? 'a' : 'button'
  const tagProps = href ? { href } : { type: 'button', disabled }

  return (
    <Tag
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`btn2 ${className}`.trim()}
      {...tagProps}
      {...props}
    >
      <div
        className="btn2-glow"
        aria-hidden="true"
        style={{
          opacity,
          background: `radial-gradient(100px circle at ${position.x}px ${position.y}px, var(--btn2-glow), transparent)`,
        }}
      />
      <span className="btn2-content">{children}</span>
    </Tag>
  )
}

/** Nombre original del componente en 21st.dev. */
export const Component = Button2

export default Button2
