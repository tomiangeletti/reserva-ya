function DepositInfo({ config, formatoPrecio }) {
  return (
    <div className="reservar-senia">
      <p className="reservar-senia-txt">Dejá la seña de <strong>{formatoPrecio(config.monto_senia_default)}</strong> por transferencia al alias:</p>
      <p className="reservar-alias">{config.alias_transferencia}</p>
      <p className="reservar-senia-txt">En {config.direccion}</p>
    </div>
  )
}

export default DepositInfo
