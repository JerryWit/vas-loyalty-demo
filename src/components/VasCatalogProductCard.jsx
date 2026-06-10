export default function VasCatalogProductCard({
  product,
  displayPrice,
  displayPoints,
  formatMoney,
  ack,
  onAckChange,
  onBuy,
}) {
  const isTelemedicine = product.category === 'telemedicine'
  const isInsurance = product.category === 'insurance'
  const canBuy = isTelemedicine
    ? ack?.contract === true
    : isInsurance
      ? ack?.ipid === true && ack?.owu === true
      : true
  const disabledTooltip = isTelemedicine
    ? 'Pobierz i zapoznaj się z umową aby kontynuować'
    : 'Pobierz i zapoznaj się z IPID i OWU aby kontynuować'

  return (
    <article className="vas-product-card">
      <div className="vas-product-icon" aria-hidden>
        {product.icon}
      </div>
      <h3 className="vas-h3">{product.name}</h3>
      <p className="vas-muted vas-text-sm">{product.description}</p>
      <div className="vas-product-price-row">
        <div>
          <div className="vas-price">{formatMoney(displayPrice)}</div>
        </div>
        <div className="vas-points-badge">+{displayPoints} pkt</div>
      </div>

      {isTelemedicine ? (
        <div className="vas-product-card-prebuy">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="vas-product-card-link"
            onClick={(e) => e.preventDefault()}
          >
            Pobierz wzór umowy (PDF)
          </a>
          <label className="vas-product-card-checkbox">
            <input
              type="checkbox"
              checked={ack?.contract === true}
              onChange={(e) => onAckChange('contract', e.target.checked)}
            />
            <span>Zapoznałem/am się z treścią umowy</span>
          </label>
        </div>
      ) : null}

      {isInsurance ? (
        <div className="vas-product-card-prebuy">
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="vas-product-card-link"
            onClick={(e) => e.preventDefault()}
          >
            Pobierz kartę produktu IPID (PDF)
          </a>
          <a
            href="#"
            target="_blank"
            rel="noopener noreferrer"
            className="vas-product-card-link"
            onClick={(e) => e.preventDefault()}
          >
            Pobierz Ogólne Warunki Ubezpieczenia OWU (PDF)
          </a>
          <label className="vas-product-card-checkbox">
            <input
              type="checkbox"
              checked={ack?.ipid === true}
              onChange={(e) => onAckChange('ipid', e.target.checked)}
            />
            <span>Zapoznałem/am się z kartą produktu (IPID)</span>
          </label>
          <label className="vas-product-card-checkbox">
            <input
              type="checkbox"
              checked={ack?.owu === true}
              onChange={(e) => onAckChange('owu', e.target.checked)}
            />
            <span>Zapoznałem/am się z Ogólnymi Warunkami Ubezpieczenia (OWU)</span>
          </label>
        </div>
      ) : null}

      <button
        type="button"
        className="vas-btn vas-btn-secondary vas-btn-block vas-product-card-buy"
        disabled={!canBuy}
        title={!canBuy ? disabledTooltip : undefined}
        onClick={onBuy}
      >
        Kup VAS
      </button>
    </article>
  )
}
