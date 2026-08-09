function HelpStatuses() {
  return (
    <div className="ayuda-estados">
      <div><span className="ayuda-estado-dot pendiente" /> <strong>Pendiente:</strong> falta verificar la seña.</div>
      <div><span className="ayuda-estado-dot confirmada" /> <strong>Confirmada:</strong> la seña fue recibida.</div>
      <div><span className="ayuda-estado-dot reservada" /> <strong>Reservada:</strong> cargada manualmente, generalmente por WhatsApp.</div>
      <div><span className="ayuda-estado-dot fijo" /> <strong>Turno fijo:</strong> ocupa ese horario todas las semanas.</div>
    </div>
  )
}

export default HelpStatuses
