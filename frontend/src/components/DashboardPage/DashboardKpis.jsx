import { aMinutos, duracionLegible, formatoPrecio, minutosDelDia } from './tiempo'

function Kpi({ etiqueta, children, detalle }) {
  return (
    <article className="dash-kpi">
      <p className="dash-kpi-etiqueta">{etiqueta}</p>
      <div className="dash-kpi-valor">{children}</div>
      {detalle && <p className="dash-kpi-detalle">{detalle}</p>}
    </article>
  )
}

/** Indicadores del día: ocupación, por confirmar, próximo turno e ingreso estimado. */
function DashboardKpis({ grilla, pendientes, precio, ahora, cargando }) {
  const slots = grilla.flatMap((cancha) => cancha.slots.map((slot) => ({ ...slot, cancha: cancha.cancha_nombre })))
  const ocupados = slots.filter((slot) => slot.estado !== 'libre')
  const porcentaje = slots.length ? Math.round((ocupados.length / slots.length) * 100) : 0

  const minutoActual = minutosDelDia(ahora)
  const proximo = ocupados
    .filter((slot) => aMinutos(slot.hora_inicio) > minutoActual)
    .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio))[0]

  const senias = pendientes.reduce((total, reserva) => total + Number(reserva.monto_senia), 0)
  const vacio = <span className="dash-mono">—</span>

  return (
    <section className="dash-kpis" aria-label="Resumen del día">
      <Kpi
        etiqueta="Ocupación de hoy"
        detalle={cargando ? null : `${ocupados.length} de ${slots.length} turnos`}
      >
        {cargando ? vacio : <span className="dash-mono">{porcentaje}%</span>}
        <div className="dash-barra" role="presentation">
          <div className="dash-barra-relleno" style={{ width: `${cargando ? 0 : porcentaje}%` }} />
        </div>
      </Kpi>

      <Kpi
        etiqueta="Por confirmar"
        detalle={cargando ? null : pendientes.length ? `${formatoPrecio(senias)} en señas` : 'Todo al día'}
      >
        {cargando ? vacio : <span className={`dash-mono ${pendientes.length ? 'dash-alerta' : ''}`}>{pendientes.length}</span>}
      </Kpi>

      <Kpi
        etiqueta="Próximo turno"
        detalle={cargando ? null : proximo ? `${proximo.cancha}, ${proximo.nombre ?? proximo.motivo ?? 'sin nombre'}` : 'No hay más turnos hoy'}
      >
        {cargando || !proximo ? vacio : (
          <>
            <span className="dash-mono">{proximo.hora_inicio.slice(0, 5)}</span>
            <span className="dash-kpi-chip">en {duracionLegible(aMinutos(proximo.hora_inicio) - minutoActual)}</span>
          </>
        )}
      </Kpi>

      <Kpi
        etiqueta="Ingreso estimado de hoy"
        detalle={cargando || !precio ? null : `${ocupados.length} turnos a ${formatoPrecio(precio)}`}
      >
        {cargando || !precio ? vacio : <span className="dash-mono">{formatoPrecio(ocupados.length * Number(precio))}</span>}
      </Kpi>
    </section>
  )
}

export default DashboardKpis
