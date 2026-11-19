import NotFound from '../../components/ui/not-found'
import './NotFoundPage.css'

/** Página para cualquier ruta que no existe. Cambiá `variant` para usar otra animación. */
function NotFoundPage() {
  return (
    <main className="notfound-page">
      <NotFound variant="glitch" />
    </main>
  )
}

export default NotFoundPage
