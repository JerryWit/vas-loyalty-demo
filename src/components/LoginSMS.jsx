import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { LENDER } from '../data/vasCatalog.js'

/** legalName — tylko do ewidencji demo; w UI pokazujemy wyłącznie brand. */
const LENDER_BRANDS = [
  { brand: LENDER.name, legalName: 'Demo Financial Services Sp. z o.o.' },
  { brand: 'KredytOK', legalName: 'Capital Service' },
  { brand: 'Szybka Gotówka', legalName: 'Capital Service' },
  { brand: 'PożyczkaPLUS', legalName: 'Funding Circle' },
  { brand: 'ExpressLoan', legalName: 'Funding Circle' },
  { brand: 'GotówkaNow', legalName: 'Profi Credit' },
]

const MIN_QUERY_LEN = 2

function normalizeForMatch(s) {
  return s.trim().toLowerCase()
}

function filterBrands(query) {
  const q = normalizeForMatch(query)
  if (q.length < MIN_QUERY_LEN) return []
  return LENDER_BRANDS.filter((item) => normalizeForMatch(item.brand).includes(q))
}

function findBrandByName(name) {
  const q = normalizeForMatch(name)
  return LENDER_BRANDS.find((item) => normalizeForMatch(item.brand) === q) ?? null
}

export default function LoginSMS({ onLoginSuccess }) {
  const listId = useId()
  const lenderWrapRef = useRef(null)

  const [step, setStep] = useState(1)
  const [lenderInput, setLenderInput] = useState('')
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [loanNumber, setLoanNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const suggestions = useMemo(() => filterBrands(lenderInput), [lenderInput])

  useEffect(() => {
    setHighlightIndex(-1)
  }, [lenderInput, suggestions.length])

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (lenderWrapRef.current && !lenderWrapRef.current.contains(e.target)) {
        setSuggestionsOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [])

  const pickBrand = (brand) => {
    setLenderInput(brand)
    setSelectedBrand(brand)
    setSuggestionsOpen(false)
    setHighlightIndex(-1)
    if (error) setError('')
  }

  const handleLenderChange = (e) => {
    const value = e.target.value
    setLenderInput(value)
    setSelectedBrand(null)
    const next = filterBrands(value)
    setSuggestionsOpen(value.trim().length >= MIN_QUERY_LEN && next.length > 0)
    if (error) setError('')
  }

  const handleLenderKeyDown = (e) => {
    if (!suggestionsOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault()
      pickBrand(suggestions[highlightIndex].brand)
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false)
    }
  }

  const resolveBrand = () => {
    if (selectedBrand) return findBrandByName(selectedBrand)
    return findBrandByName(lenderInput)
  }

  const handleSendSms = (e) => {
    e.preventDefault()
    const brand = resolveBrand()
    if (!brand) {
      setError('Wybierz pożyczkodawcę z listy podpowiedzi (min. 2 znaki).')
      return
    }
    if (!loanNumber.trim()) {
      setError('Podaj numer pożyczki.')
      return
    }
    setSelectedBrand(brand.brand)
    setLenderInput(brand.brand)
    setError('')
    setSuggestionsOpen(false)
    setStep(2)
  }

  const handleOtpChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
    setOtp(digits)
    if (error) setError('')
  }

  const handleLogin = (e) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError('Wpisz 6-cyfrowy kod z SMS.')
      return
    }
    setError('')
    const brand = resolveBrand()
    onLoginSuccess({
      lenderName: brand?.brand ?? lenderInput.trim(),
      loanNumber: loanNumber.trim(),
    })
  }

  const handleBack = () => {
    setStep(1)
    setOtp('')
    setError('')
  }

  if (step === 2) {
    return (
      <div className="vas-login-sms">
        <p className="vas-login-sms-sent" role="status">
          Kod został wysłany na Twój numer telefonu
        </p>
        <form className="vas-form vas-home-login-form" onSubmit={handleLogin}>
          <label htmlFor="login-sms-otp" className="vas-home-login-label">
            Kod z SMS (6 cyfr)
          </label>
          <input
            id="login-sms-otp"
            className="vas-input vas-input-lg vas-login-sms-otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={otp}
            onChange={handleOtpChange}
            maxLength={6}
          />
          {error ? (
            <p className="vas-form-error" role="alert">
              {error}
            </p>
          ) : null}
          <button type="submit" className="vas-btn vas-btn-primary vas-btn-block vas-mt-sm">
            Zaloguj się
          </button>
          <button
            type="button"
            className="vas-btn vas-btn-ghost vas-btn-block vas-mt-sm"
            onClick={handleBack}
          >
            Wróć
          </button>
          <p className="vas-login-demo-hint vas-home-demo-hint">
            Demo: dowolny 6-cyfrowy kod. Numer pożyczki: <strong>SP-1001</strong>,{' '}
            <strong>SP-1002</strong>, <strong>SP-1003</strong>
          </p>
        </form>
      </div>
    )
  }

  return (
    <div className="vas-login-sms">
      <form
        className="vas-form vas-home-login-form"
        onSubmit={handleSendSms}
        aria-labelledby="login-sms-step1-heading"
      >
        <h3 id="login-sms-step1-heading" className="vas-home-login-label">
          Logowanie SMS
        </h3>

        <label htmlFor="login-sms-lender" className="vas-login-sms-label">
          Nazwa pożyczkodawcy
        </label>
        <div className="vas-lender-autocomplete" ref={lenderWrapRef}>
          <input
            id="login-sms-lender"
            className="vas-input vas-input-lg"
            type="text"
            role="combobox"
            aria-expanded={suggestionsOpen}
            aria-controls={listId}
            aria-autocomplete="list"
            placeholder="Zacznij wpisywać nazwę (min. 2 znaki)"
            value={lenderInput}
            onChange={handleLenderChange}
            onFocus={() => {
              if (
                lenderInput.trim().length >= MIN_QUERY_LEN &&
                suggestions.length > 0
              ) {
                setSuggestionsOpen(true)
              }
            }}
            onKeyDown={handleLenderKeyDown}
            autoComplete="off"
          />
          {suggestionsOpen && suggestions.length > 0 ? (
            <ul id={listId} className="vas-lender-suggestions" role="listbox">
              {suggestions.map((item, index) => (
                <li key={item.brand} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={highlightIndex === index}
                    className={`vas-lender-suggestion-item ${
                      highlightIndex === index ? 'is-highlighted' : ''
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickBrand(item.brand)}
                  >
                    {item.brand}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <label htmlFor="login-sms-loan" className="vas-login-sms-label">
          Numer pożyczki
        </label>
        <input
          id="login-sms-loan"
          className="vas-input vas-input-lg"
          placeholder="np. SP-1001"
          value={loanNumber}
          onChange={(e) => {
            setLoanNumber(e.target.value)
            if (error) setError('')
          }}
          autoComplete="off"
          autoCapitalize="characters"
        />
        {error ? (
          <p className="vas-form-error" role="alert">
            {error}
          </p>
        ) : null}
        <button type="submit" className="vas-btn vas-btn-primary vas-btn-block vas-mt-sm">
          Wyślij kod SMS
        </button>
        <p className="vas-login-demo-hint vas-home-demo-hint">
          Demo: np. <strong>KredytOK</strong>, <strong>ExpressLoan</strong> · numer{' '}
          <strong>SP-1001</strong> / <strong>SP-1002</strong> / <strong>SP-1003</strong>
        </p>
      </form>
    </div>
  )
}
