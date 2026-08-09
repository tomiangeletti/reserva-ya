function HelpCard({ numero, title, children, className = '' }) {
  return (
    <section className={`ayuda-card ${className}`}>
      <span className="ayuda-numero">{numero}</span>
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default HelpCard
