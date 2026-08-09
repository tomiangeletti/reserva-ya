import HelpCard from '../../components/AyudaPage/HelpCard'
import HelpHeader from '../../components/AyudaPage/HelpHeader'
import HelpStatuses from '../../components/AyudaPage/HelpStatuses'
import './AyudaPage.css'

function AyudaPage() {
  return (
    <div className="ayuda-page">
      <HelpHeader />
      <div className="ayuda-grid">
        <HelpCard numero="01" title="Revisar una reserva online" className="ayuda-card-destacada">
          <p>Las reservas hechas desde la página aparecen como <strong>Pendientes</strong> hasta que el club recibe y verifica la seña.</p>
          <ol><li>Entrá a <strong>Reservas</strong> y elegí Hoy, Próximas o Todas.</li><li>Buscá al cliente por nombre o teléfono si hace falta.</li><li>Verificá la transferencia y presioná <strong>Confirmar</strong>.</li><li>Si no corresponde tomarla, presioná <strong>Cancelar</strong>.</li></ol>
        </HelpCard>
        <HelpCard numero="02" title="Reserva recibida por WhatsApp">
          <p>Para ocupar manualmente un horario que se reservó por WhatsApp:</p>
          <ol><li>Entrá a <strong>Canchas y turnos</strong>.</li><li>Elegí la fecha correcta.</li><li>Tocá una celda libre de la cancha y horario acordados.</li><li>Elegí <strong>Reservada</strong>, cargá el nombre y ocupá el turno.</li></ol>
          <p className="ayuda-nota">La cancha aparecerá como <strong>Reservada</strong> y no estará disponible para nuevas reservas online.</p>
        </HelpCard>
        <HelpCard numero="03" title="Turnos fijos">
          <p>Usá un turno fijo para una persona o grupo que juega todas las semanas en el mismo día y horario.</p>
          <ol><li>Desde <strong>Canchas y turnos</strong>, tocá una celda libre.</li><li>Elegí el día y horario recurrente.</li><li>Seleccioná el nombre del turno fijo y guardá.</li><li>Para liberar temporalmente, abrí el turno y elegí <strong>Liberar</strong>.</li></ol>
          <p className="ayuda-nota">Un turno fijo se repite automáticamente cada semana.</p>
        </HelpCard>
        <HelpCard numero="04" title="Configuración y precios">
          <p>Desde <strong>Configuración</strong> podés actualizar:</p>
          <ul><li>Precio de la cancha y monto de la seña.</li><li>Adicional por dos pelotas.</li><li>Horarios de apertura y cierre.</li><li>Alias de transferencia y teléfono de WhatsApp.</li><li>Dirección que verá el jugador.</li></ul>
          <p className="ayuda-nota">Los cambios de precios se aplican a las nuevas reservas. Las reservas existentes conservan sus importes originales.</p>
        </HelpCard>
        <HelpCard numero="05" title="Estados y liberación de horarios" className="ayuda-card-ancha">
          <HelpStatuses />
          <p className="ayuda-nota">Para liberar una reserva online, cancelala desde <strong>Reservas</strong>. Para liberar una reserva de WhatsApp o un turno fijo, abrí la celda correspondiente en <strong>Canchas y turnos</strong>.</p>
        </HelpCard>
        <HelpCard numero="06" title="Recomendación diaria" className="ayuda-card-ancha ayuda-card-final">
          <p>Al comenzar el día, revisá las reservas pendientes y la grilla de canchas. Confirmá las señas recibidas y cancelá las reservas que no correspondan. Al finalizar la jornada, verificá que no haya horarios ocupados por error.</p>
          <div className="ayuda-alerta"><strong>¿El sistema no responde?</strong><span>Revisá primero la conexión a Internet. Si el problema continúa, contactá al responsable técnico.</span></div>
        </HelpCard>
      </div>
    </div>
  )
}

export default AyudaPage
