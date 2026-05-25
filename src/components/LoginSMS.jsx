import { useState } from 'react'

const LENDER_OPTIONS = ['KredytOK', 'Szybka Gotówka', 'PożyczkaPLUS']

export default function LoginSMS({ onLoginSuccess }) {
  const [step, setStep] = useState(1)
  const [lenderName, setLenderName] = useState('')
  const [loanNumber, setLoanNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')

  const handleSendSms = (e) => {
    e.preventDefault()
    if (!lenderName.trim()) {
      setError('Wybierz lub wpisz nazwę pożyczkodawcy.')
      return
    }
    if (!loanNumber.trim()) {
      setError('Podaj numer pożyczki.')
      return
    }
    setError('')
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
    onLoginSuccess({ lenderName: lenderName.trim(), loanNumber: loanNumber.trim() })
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
          Kod wysłany na Twój numer telefonu
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
        <input
          id="login-sms-lender"
          className="vas-input vas-input-lg"
          list="login-sms-lender-list"
          placeholder="Wybierz lub wpisz"
          value={lenderName}
          onChange={(e) => {
            setLenderName(e.target.value)
            if (error) setError('')
          }}
          autoComplete="organization"
        />
        <datalist id="login-sms-lender-list">
          {LENDER_OPTIONS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
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
          Demo: pożyczkodawca z listy, numer <strong>SP-1001</strong> /{' '}
          <strong>SP-1002</strong> / <strong>SP-1003</strong>
        </p>
      </form>
    </div>
  )
}
