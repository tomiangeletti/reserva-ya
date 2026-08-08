import './AyudaPage.css'

function AyudaPage() {
  return (
    <div className="ayuda-page">
      <div className="ayuda-header">
        <div>
          <p className="ayuda-kicker">CENTRO DE AYUDA</p>
          <h1 className="admin-title">Cómo usar el sistema</h1>
          <p className="admin-hint">
            Una guía rápida para administrar las reservas de El Túnel.
          </p>
        </div>
        <div className="ayuda-header-mark" aria-hidden="true">?</div>
      </div>

      <div className="ayuda-grid">
        <section className="ayuda-card ayuda-card-destacada">
          <span className="ayuda-numero">01</span>
          <h2>Revisar una reserva online</h2>
          <p>
            Las reservas hechas desde la página aparecen como <strong>Pendientes</strong> hasta
            que el club recibe y verifica la seña.
          </p>
          <ol>
            <li>Entrá a <strong>Reservas</strong> y elegí Hoy, Próximas o Todas.</li>
            <li>Buscá al cliente por nombre o teléfono si hace falta.</li>
            <li>Verificá la transferencia y presioná <strong>Confirmar</strong>.</li>
            <li>Si no corresponde tomarla, presioná <strong>Cancelar</strong>.</li>
          </ol>
        </section>

        <section className="ayuda-card">
          <span className="ayuda-numero">02</span>
          <h2>Reserva recibida por WhatsApp</h2>
          <p>
            Para ocupar manualmente un horario que se reservó por WhatsApp:
          </p>
          <ol>
            <li>Entrá a <strong>Canchas y turnos</strong>.</li>
            <li>Elegí la fecha correcta.</li>
            <li>Tocá una celda libre de la cancha y horario acordados.</li>
            <li>Elegí <strong>Reservada</strong>, cargá el nombre y ocupá el turno.</li>
          </ol>
          <p className="ayuda-nota">
            La cancha aparecerá como <strong>Reservada</strong> y no estará disponible para nuevas
            reservas online.
          </p>
        </section>

        <section className="ayuda-card">
          <span className="ayuda-numero">03</span>
          <h2>Turnos fijos</h2>
          <p>
            Usá un turno fijo para una persona o grupo que juega todas las semanas en el mismo
            día y horario.
          </p>
          <ol>
            <li>Desde <strong>Canchas y turnos</strong>, tocá una celda libre.</li>
            <li>Elegí el día y horario recurrente.</li>
            <li>Seleccioná el nombre del turno fijo y guardá.</li>
            <li>Para liberar temporalmente, abrí el turno y elegí <strong>Liberar</strong>.</li>
          </ol>
          <p className="ayuda-nota">Un turno fijo se repite automáticamente cada semana.</p>
        </section>

        <section className="ayuda-card">
          <span className="ayuda-numero">04</span>
          <h2>Configuración y precios</h2>
          <p>Desde <strong>Configuración</strong> podés actualizar:</p>
          <ul>
            <li>Precio de la cancha y monto de la seña.</li>
            <li>Adicional por dos pelotas.</li>
            <li>Horarios de apertura y cierre.</li>
            <li>Alias de transferencia y teléfono de WhatsApp.</li>
            <li>Dirección que verá el jugador.</li>
          </ul>
          <p className="ayuda-nota">
            Los cambios de precios se aplican a las nuevas reservas. Las reservas existentes
            conservan sus importes originales.
          </p>
        </section>

        <section className="ayuda-card ayuda-card-ancha">
          <span className="ayuda-numero">05</span>
          <h2>Estados y liberación de horarios</h2>
          <div className="ayuda-estados">
            <div><span className="ayuda-estado-dot pendiente" /> <strong>Pendiente:</strong> falta verificar la seña.</div>
            <div><span className="ayuda-estado-dot confirmada" /> <strong>Confirmada:</strong> la seña fue recibida.</div>
            <div><span className="ayuda-estado-dot reservada" /> <strong>Reservada:</strong> cargada manualmente, generalmente por WhatsApp.</div>
            <div><span className="ayuda-estado-dot fijo" /> <strong>Turno fijo:</strong> ocupa ese horario todas las semanas.</div>
          </div>
          <p className="ayuda-nota">
            Para liberar una reserva online, cancelala desde <strong>Reservas</strong>. Para
            liberar una reserva de WhatsApp o un turno fijo, abrí la celda correspondiente en
            <strong> Canchas y turnos</strong>.
          </p>
        </section>

        <section className="ayuda-card ayuda-card-ancha ayuda-card-final">
          <span className="ayuda-numero">06</span>
          <h2>Recomendación diaria</h2>
          <p>
            Al comenzar el día, revisá las reservas pendientes y la grilla de canchas. Confirmá
            las señas recibidas y cancelá las reservas que no correspondan. Al finalizar la
            jornada, verificá que no haya horarios ocupados por error.
          </p>
          <div className="ayuda-alerta">
            <strong>¿El sistema no responde?</strong>
            <span>Revisá primero la conexión a Internet. Si el problema continúa, contactá al responsable técnico.</span>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AyudaPage
