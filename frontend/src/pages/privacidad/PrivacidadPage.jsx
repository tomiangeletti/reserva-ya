import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { apiFetch } from '../../api/client'
import './PrivacidadPage.css'

function PrivacidadPage() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    apiFetch('/config').then(setConfig).catch(() => {})
  }, [])

  const telefono = config?.telefono_whatsapp?.replace(/\D/g, '')

  return (
    <main className="privacidad-page">
      <article className="privacidad-card">
        <Link className="privacidad-volver" to="/reservar">← Volver a reservar</Link>
        <p className="privacidad-kicker">INFORMACIÓN LEGAL</p>
        <h1>Política de privacidad</h1>
        <p className="privacidad-intro">
          En El Túnel Padel Club cuidamos la privacidad de las personas que usan este sitio y
          tratamos sus datos de acuerdo con la Ley 25.326 de Protección de los Datos Personales.
        </p>

        <section>
          <h2>1. Responsable</h2>
          <p>
            El responsable del tratamiento de los datos es <strong>El Túnel Padel Club</strong>.
            {config?.direccion && <> El establecimiento se encuentra en {config.direccion}.</>}
          </p>
          <p>
            Para consultas relacionadas con tus datos personales podés comunicarte con el club
            por sus canales oficiales{telefono && <> o por WhatsApp al {config.telefono_whatsapp}</>}.
          </p>
        </section>

        <section>
          <h2>2. Datos que recopilamos</h2>
          <p>Al solicitar una reserva podemos recopilar:</p>
          <ul>
            <li>Nombre y apellido.</li>
            <li>Número de teléfono o WhatsApp.</li>
            <li>Cancha, fecha y horario elegidos.</li>
            <li>Estado de la reserva y datos relacionados con la seña.</li>
          </ul>
          <p>
            No solicitamos datos sensibles ni datos de tarjetas de crédito a través de este sitio.
          </p>
        </section>

        <section>
          <h2>3. Para qué usamos los datos</h2>
          <p>Los datos se utilizan para:</p>
          <ul>
            <li>Crear y administrar la reserva solicitada.</li>
            <li>Contactarte para confirmar, modificar o cancelar un turno.</li>
            <li>Verificar el pago de la seña cuando corresponda.</li>
            <li>Atender consultas y reclamos relacionados con el servicio.</li>
          </ul>
          <p>
            No vendemos ni alquilamos datos personales. No usamos la información para publicidad
            ajena al funcionamiento del club sin una autorización adicional.
          </p>
        </section>

        <section>
          <h2>4. WhatsApp y comprobantes</h2>
          <p>
            El envío del comprobante por WhatsApp es voluntario y se realiza porque vos elegís
            abrir esa aplicación. WhatsApp procesa la información de acuerdo con sus propias
            políticas de privacidad. El club utilizará el comprobante únicamente para verificar
            la seña y gestionar la reserva.
          </p>
        </section>

        <section>
          <h2>5. Conservación y seguridad</h2>
          <p>
            Conservamos los datos durante el tiempo necesario para gestionar la reserva, cumplir
            obligaciones legales y resolver posibles consultas posteriores. Aplicamos medidas
            razonables de seguridad para evitar accesos, modificaciones o divulgaciones no
            autorizadas.
          </p>
        </section>

        <section>
          <h2>6. Tus derechos</h2>
          <p>
            Podés solicitar el acceso a tus datos personales y pedir su actualización, corrección
            o supresión cuando corresponda. Para hacerlo, comunicate con el club por sus canales
            oficiales indicando tu nombre y el teléfono utilizado en la reserva.
          </p>
          <p>
            La Dirección Nacional de Protección de Datos Personales, dependiente de la Agencia de
            Acceso a la Información Pública, es el órgano de control de la Ley 25.326 y recibe
            denuncias y reclamos relacionados con la protección de datos personales.
          </p>
        </section>

        <section>
          <h2>7. Cambios</h2>
          <p>
            Esta política puede actualizarse para reflejar cambios en el servicio o en la
            normativa aplicable. La versión vigente estará siempre disponible en esta página.
          </p>
        </section>

        <p className="privacidad-nota">
          Esta información debe ser revisada y completada por el responsable legal del club antes
          de publicar el sistema, especialmente en lo relativo a la identificación legal y los
          canales formales de contacto.
        </p>
      </article>
    </main>
  )
}

export default PrivacidadPage
