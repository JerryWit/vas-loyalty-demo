import { useEffect, useState } from 'react'

const TELEMEDICINE_DETAILS = {
  p1: {
    features: [
      'Telekonsultacje z lekarzem rodzinnym',
      '2 specjalizacje: pediatria, interna',
      'Do 3 wizyt w roku',
    ],
  },
  p2: {
    features: [
      'Telekonsultacje i badania podstawowe',
      '5 specjalizacji: interna, pediatria, dermatologia, ginekologia, laryngologia',
      'Do 6 wizyt w roku',
    ],
  },
  p3: {
    features: [
      'Pełna opieka telemedyczna 24/7',
      'Wszystkie specjalizacje bez limitu',
      'Do 12 wizyt w roku + badania rozszerzone',
    ],
  },
}

const IPID_CONTENT = {
  p4: {
    covered: 'utrata pracy',
    sum: 'równa kwocie pożyczki',
    period: 'czas trwania pożyczki',
    exclusions: 'wypowiedzenie z winy pracownika, działalność gospodarcza',
  },
  p5: {
    covered: 'życie i następstwa wypadków',
    sum: 'zgodnie z wariantem',
    period: '12 miesięcy',
    exclusions: 'choroby przewlekłe, sporty ekstremalne',
  },
  p6: {
    covered: 'awarie w domu',
    scope: 'hydraulik, elektryk, ślusarz, stolarz',
    limit: 'zgodnie z wariantem',
    exclusions: 'szkody budowlane, umyślne uszkodzenia',
  },
}

const PROTECTION_PERIOD = {
  p4: 'czas trwania pożyczki',
  p5: '12 miesięcy',
  p6: '12 miesięcy',
}

const TELEMEDI_ACTIVATION_URL =
  'https://register-app.telemedi.com/pl?clinic=37c9bbf8-77dc-46ff-80b0-aba87d3457b9&_gl=1*wn3oqn*_gcl_au*NzI1OTExMTU2LjE3NzU2NDgwMjc.*_ga*ODc1NTE0MTcyLjE3NzU2NDgwMjg.*_ga_6D2X5MH8BC*czE3NzgxNTQ1MTQkbzckZzEkdDE3NzgxNTQ1MjMkajUxJGwwJGgw'

function YesNoQuestion({ label, value, onChange }) {
  return (
    <div className="vas-purchase-apk-question">
      <p className="vas-purchase-apk-label">{label}</p>
      <div className="vas-purchase-yesno">
        <button
          type="button"
          className={`vas-purchase-yesno-btn${value === true ? ' vas-purchase-yesno-btn--active' : ''}`}
          onClick={() => onChange(true)}
        >
          TAK
        </button>
        <button
          type="button"
          className={`vas-purchase-yesno-btn${value === false ? ' vas-purchase-yesno-btn--active' : ''}`}
          onClick={() => onChange(false)}
        >
          NIE
        </button>
      </div>
    </div>
  )
}

export default function VasPurchaseModal({
  product,
  sessionClient,
  displayPrice,
  displayPoints,
  formatMoney,
  onClose,
  onPurchaseComplete,
}) {
  const isTelemedicine = product.category === 'telemedicine'
  const totalSteps = isTelemedicine ? 2 : 3

  const [step, setStep] = useState(1)
  const [phase, setPhase] = useState('form')
  const [teleContractChecked, setTeleContractChecked] = useState(false)
  const [pdfDemoMessage, setPdfDemoMessage] = useState(false)
  const [hasExistingInsurance, setHasExistingInsurance] = useState(null)
  const [meetsNeeds, setMeetsNeeds] = useState(null)
  const [apkConfirmed, setApkConfirmed] = useState(false)
  const [propertyAddress, setPropertyAddress] = useState(sessionClient?.address ?? '')
  const [owuAccepted, setOwuAccepted] = useState(false)

  const resetState = () => {
    setStep(1)
    setPhase('form')
    setTeleContractChecked(false)
    setPdfDemoMessage(false)
    setHasExistingInsurance(null)
    setMeetsNeeds(null)
    setApkConfirmed(false)
    setPropertyAddress(sessionClient?.address ?? '')
    setOwuAccepted(false)
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleClose()
  }

  const runPayment = () => {
    setPhase('processing')
    setTimeout(() => {
      onPurchaseComplete(product)
      setPhase('success')
    }, 1500)
  }

  useEffect(() => {
    if (isTelemedicine && step === 2 && phase === 'form') {
      runPayment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTelemedicine, step, phase])

  const teleStep1Valid = teleContractChecked
  const insuranceStep1Valid = true
  const insuranceStep2Valid =
    hasExistingInsurance !== null &&
    meetsNeeds !== null &&
    apkConfirmed &&
    (product.id !== 'p6' || propertyAddress.trim().length > 0)
  const insuranceStep3Valid = owuAccepted

  const canProceed = () => {
    if (phase !== 'form') return false
    if (isTelemedicine) {
      if (step === 1) return teleStep1Valid
      return false
    }
    if (step === 1) return insuranceStep1Valid
    if (step === 2) return insuranceStep2Valid
    if (step === 3) return insuranceStep3Valid
    return false
  }

  const getPrimaryLabel = () => {
    if (isTelemedicine && step === 1) return `Kup za ${displayPrice} zł →`
    if (!isTelemedicine && step === 1) return 'Dalej →'
    if (!isTelemedicine && step === 2) return 'Przejdź do płatności →'
    if (!isTelemedicine && step === 3) return `Zapłać ${displayPrice} zł`
    return 'Dalej'
  }

  const handlePrimary = () => {
    if (!canProceed()) return
    if (isTelemedicine && step === 1) {
      setStep(2)
      return
    }
    if (!isTelemedicine && step < 3) {
      setStep(step + 1)
      return
    }
    if (!isTelemedicine && step === 3) {
      runPayment()
    }
  }

  const handleBack = () => {
    if (step > 1 && phase === 'form') setStep(step - 1)
  }

  const teleDetails = TELEMEDICINE_DETAILS[product.id]
  const ipid = IPID_CONTENT[product.id]
  const processingMessage = isTelemedicine ? 'Przetwarzamy płatność...' : 'Wystawiamy polisę...'

  const showFooter = phase === 'form' && !(isTelemedicine && step === 2)

  return (
    <div
      className="vas-purchase-overlay"
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div
        className="vas-purchase-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vas-purchase-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="vas-purchase-close"
          onClick={handleClose}
          aria-label="Zamknij"
        >
          ×
        </button>

        {phase === 'success' ? (
          <div className="vas-purchase-success">
            <div className="vas-purchase-success-icon" aria-hidden>
              ✓
            </div>
            <h2 id="vas-purchase-title" className="vas-purchase-title">
              {isTelemedicine ? 'Zakup zakończony' : 'Polisa wystawiona'}
            </h2>
            <p className="vas-purchase-success-text">
              {isTelemedicine
                ? `Dodano ${product.name}. Otrzymujesz +${displayPoints} pkt.`
                : 'Polisa została wystawiona. Potwierdzenie i dokument polisy otrzymasz na email.'}
            </p>
            <div className="vas-purchase-success-actions">
              {isTelemedicine ? (
                <>
                  <a
                    href={TELEMEDI_ACTIVATION_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vas-btn vas-btn-primary vas-btn-block vas-purchase-success-cta"
                  >
                    Aktywuj pakiet telemedyczny →
                  </a>
                  <p className="vas-purchase-success-hint">
                    Link aktywacyjny zostanie również wysłany na Twój email.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="vas-btn vas-btn-secondary vas-btn-block vas-purchase-success-cta"
                    onClick={() => setPdfDemoMessage(true)}
                  >
                    Pobierz potwierdzenie ubezpieczenia (PDF)
                  </button>
                  {pdfDemoMessage ? (
                    <p className="vas-purchase-demo-notice" role="status">
                      Dokument zostanie wygenerowany przez system. W wersji produkcyjnej pobierze się
                      automatycznie.
                    </p>
                  ) : null}
                  <p className="vas-purchase-success-hint">
                    Polisa zostanie również wysłana na Twój adres email.
                  </p>
                </>
              )}
              <button
                type="button"
                className="vas-btn vas-btn-ghost vas-btn-block"
                onClick={handleClose}
              >
                Wróć do swojego konta
              </button>
            </div>
          </div>
        ) : (
          <>
            {phase === 'form' && (
              <div className="vas-purchase-progress">
                <div className="vas-purchase-progress-bar">
                  <div
                    className="vas-purchase-progress-fill"
                    style={{ width: `${(step / totalSteps) * 100}%` }}
                  />
                </div>
                <span className="vas-purchase-progress-label">
                  Krok {step} z {totalSteps}
                </span>
              </div>
            )}

            <div className="vas-purchase-body">
              {isTelemedicine && step === 1 && (
                <>
                  <h2 id="vas-purchase-title" className="vas-purchase-title">
                    {product.name}
                  </h2>
                  <div className="vas-purchase-icon-lg" aria-hidden>
                    {product.icon}
                  </div>
                  <ul className="vas-purchase-features">
                    {teleDetails?.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                  <div className="vas-purchase-price-box">
                    Cena: {displayPrice} zł | Otrzymasz: +{displayPoints} pkt
                  </div>
                  <div className="vas-purchase-legal-text">
                    <p className="vas-purchase-legal-intro">Dokonując płatności:</p>
                    <ul>
                      <li>zawierasz umowę na usługę telemedyczną z RANTHERI SERVICE OÜ</li>
                      <li>
                        wyrażasz zgodę na przeprowadzenie badania dobrostanu z wykorzystaniem
                        algorytmów AI — wynik ma charakter wyłącznie informacyjny i wspomagający
                        wskazanie specjalizacji lekarza
                      </li>
                      <li>
                        zgadzasz się na rozpoczęcie usługi telemedycznej przed upływem terminu do
                        odstąpienia i przyjmujesz do wiadomości, że powoduje to utratę prawa do
                        odstąpienia od umowy
                      </li>
                      <li>akceptujesz warunki umowy z RANTHERI SERVICE OÜ</li>
                    </ul>
                  </div>
                  <label className="vas-purchase-checkbox vas-mt-md">
                    <input
                      type="checkbox"
                      checked={teleContractChecked}
                      onChange={(e) => setTeleContractChecked(e.target.checked)}
                    />
                    <span>
                      Potwierdzam, że pobrałem/am i zapoznałem/am się z treścią umowy
                    </span>
                  </label>
                </>
              )}

              {isTelemedicine && step === 2 && (
                <>
                  <h2 id="vas-purchase-title" className="vas-purchase-title">
                    Potwierdzenie zakupu
                  </h2>
                  <div className="vas-purchase-summary">
                    <div className="vas-purchase-summary-row">
                      <span>Produkt</span>
                      <strong>{product.name}</strong>
                    </div>
                    <div className="vas-purchase-summary-row">
                      <span>Cena</span>
                      <strong>{formatMoney(displayPrice)}</strong>
                    </div>
                    <div className="vas-purchase-summary-row">
                      <span>Punkty</span>
                      <strong>+{displayPoints} pkt</strong>
                    </div>
                  </div>
                  {phase === 'processing' && (
                    <div className="vas-purchase-processing">
                      <div className="vas-purchase-spinner" aria-hidden />
                      <p>{processingMessage}</p>
                    </div>
                  )}
                </>
              )}

              {!isTelemedicine && step === 1 && (
                <>
                  <h2 id="vas-purchase-title" className="vas-purchase-title">
                    Karta produktu ubezpieczeniowego (IPID)
                  </h2>
                  <p className="vas-purchase-subtitle">
                    Przeczytaj przed zakupem — wymagane prawnie
                  </p>
                  <dl className="vas-purchase-ipid">
                    <div>
                      <dt>Co jest ubezpieczone</dt>
                      <dd>{ipid.covered}</dd>
                    </div>
                    {ipid.sum ? (
                      <div>
                        <dt>Suma ubezpieczenia</dt>
                        <dd>{ipid.sum}</dd>
                      </div>
                    ) : null}
                    {ipid.scope ? (
                      <div>
                        <dt>Zakres</dt>
                        <dd>{ipid.scope}</dd>
                      </div>
                    ) : null}
                    {ipid.period ? (
                      <div>
                        <dt>Okres ochrony</dt>
                        <dd>{ipid.period}</dd>
                      </div>
                    ) : null}
                    {ipid.limit ? (
                      <div>
                        <dt>Limit interwencji</dt>
                        <dd>{ipid.limit}</dd>
                      </div>
                    ) : null}
                    <div>
                      <dt>Główne wyłączenia</dt>
                      <dd>{ipid.exclusions}</dd>
                    </div>
                  </dl>
                </>
              )}

              {!isTelemedicine && step === 2 && (
                <>
                  <h2 id="vas-purchase-title" className="vas-purchase-title">
                    Arkusz potrzeb klienta
                  </h2>
                  <p className="vas-purchase-subtitle">
                    Wymagany przez ustawę o dystrybucji ubezpieczeń (IDD)
                  </p>
                  <div className="vas-purchase-client-data">
                    <div className="vas-purchase-client-row">
                      <span>Imię i nazwisko</span>
                      <strong>{sessionClient.name}</strong>
                    </div>
                    <div className="vas-purchase-client-row">
                      <span>PESEL</span>
                      <strong>{sessionClient.pesel}</strong>
                    </div>
                    <div className="vas-purchase-client-row">
                      <span>Adres zamieszkania</span>
                      <strong>{sessionClient.address}</strong>
                    </div>
                  </div>
                  {product.id === 'p6' && (
                    <label className="vas-purchase-field">
                      <span className="vas-purchase-field-label">
                        Adres nieruchomości do ubezpieczenia
                      </span>
                      <input
                        type="text"
                        className="vas-purchase-input"
                        value={propertyAddress}
                        onChange={(e) => setPropertyAddress(e.target.value)}
                      />
                    </label>
                  )}
                  <YesNoQuestion
                    label="Czy posiadasz już ubezpieczenie tego samego typu?"
                    value={hasExistingInsurance}
                    onChange={setHasExistingInsurance}
                  />
                  <YesNoQuestion
                    label="Czy ten produkt odpowiada Twoim aktualnym potrzebom?"
                    value={meetsNeeds}
                    onChange={setMeetsNeeds}
                  />
                  <label className="vas-purchase-checkbox">
                    <input
                      type="checkbox"
                      checked={apkConfirmed}
                      onChange={(e) => setApkConfirmed(e.target.checked)}
                    />
                    <span>
                      Potwierdzam że produkt odpowiada moim potrzebom i sytuacji życiowej
                    </span>
                  </label>
                </>
              )}

              {!isTelemedicine && step === 3 && phase === 'form' && (
                <>
                  <h2 id="vas-purchase-title" className="vas-purchase-title">
                    Podsumowanie zamówienia
                  </h2>
                  <div className="vas-purchase-summary">
                    <div className="vas-purchase-summary-row">
                      <span>Produkt</span>
                      <strong>{product.name}</strong>
                    </div>
                    <div className="vas-purchase-summary-row">
                      <span>Składka</span>
                      <strong>{formatMoney(displayPrice)}</strong>
                    </div>
                    <div className="vas-purchase-summary-row">
                      <span>Okres ochrony</span>
                      <strong>{PROTECTION_PERIOD[product.id]}</strong>
                    </div>
                    <div className="vas-purchase-summary-row">
                      <span>Dane ubezpieczonego</span>
                      <strong>{sessionClient.name}</strong>
                    </div>
                  </div>
                  <label className="vas-purchase-checkbox">
                    <input
                      type="checkbox"
                      checked={owuAccepted}
                      onChange={(e) => setOwuAccepted(e.target.checked)}
                    />
                    <span>
                      Akceptuję Ogólne Warunki Ubezpieczenia (OWU) i wyrażam zgodę na zawarcie
                      umowy ubezpieczenia
                    </span>
                  </label>
                </>
              )}

              {!isTelemedicine && step === 3 && phase === 'processing' && (
                <div className="vas-purchase-processing">
                  <div className="vas-purchase-spinner" aria-hidden />
                  <p>{processingMessage}</p>
                </div>
              )}
            </div>

            {showFooter && (
              <div className="vas-purchase-footer">
                {step > 1 ? (
                  <button type="button" className="vas-btn vas-btn-ghost" onClick={handleBack}>
                    Wstecz
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  className="vas-btn vas-btn-secondary"
                  disabled={!canProceed()}
                  onClick={handlePrimary}
                >
                  {getPrimaryLabel()}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
