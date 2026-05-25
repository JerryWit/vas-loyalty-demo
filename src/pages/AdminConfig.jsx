import { useState } from 'react'
import { Link } from 'react-router-dom'
import './AdminConfig.css'

const LENDERS = ['KredytOK', 'Szybka Gotówka', 'PożyczkaPLUS']

const PRODUCT_DEFS = [
  { id: 'telebasic', label: 'Telemedycyna Basic' },
  { id: 'teleroz', label: 'Telemedycyna Rozszerzona' },
  { id: 'telepremium', label: 'Telemedycyna Premium' },
  { id: 'cpi', label: 'Ubezpieczenie CPI' },
  { id: 'zycie', label: 'Ubezpieczenie Życie NNW' },
  { id: 'home', label: 'Ubezpieczenie Home Assistance' },
]

function buildProducts(overrides) {
  const base = {
    telebasic: { active: true, price: 0, points: 0 },
    teleroz: { active: false, price: 0, points: 0 },
    telepremium: { active: false, price: 0, points: 0 },
    cpi: { active: false, price: 0, points: 0 },
    zycie: { active: false, price: 0, points: 0 },
    home: { active: false, price: 0, points: 0 },
  }
  return { ...base, ...overrides }
}

function buildBenefits(overrides) {
  const base = {
    prolong14: { points: 120 },
    prolong30: { points: 180 },
    partialPayment: { active: true, points: 95 },
    expressLoan: { active: false, points: 200 },
  }
  return { ...base, ...overrides }
}

const DEFAULT_LENDER_CONFIGS = {
  KredytOK: {
    products: buildProducts({
      telebasic: { active: true, price: 79, points: 8 },
      teleroz: { active: true, price: 129, points: 13 },
      telepremium: { active: true, price: 199, points: 20 },
      cpi: { active: true, price: 45, points: 5 },
      zycie: { active: false, price: 89, points: 9 },
      home: { active: true, price: 59, points: 6 },
    }),
    benefits: buildBenefits({
      prolong14: { points: 110 },
      prolong30: { points: 170 },
      partialPayment: { active: true, points: 90 },
      expressLoan: { active: true, points: 220 },
    }),
  },
  'Szybka Gotówka': {
    products: buildProducts({
      telebasic: { active: true, price: 69, points: 7 },
      teleroz: { active: true, price: 119, points: 12 },
      telepremium: { active: false, price: 189, points: 19 },
      cpi: { active: true, price: 39, points: 4 },
      zycie: { active: true, price: 99, points: 10 },
      home: { active: false, price: 55, points: 6 },
    }),
    benefits: buildBenefits({
      prolong14: { points: 100 },
      prolong30: { points: 160 },
      partialPayment: { active: true, points: 85 },
      expressLoan: { active: false, points: 190 },
    }),
  },
  PożyczkaPLUS: {
    products: buildProducts({
      telebasic: { active: true, price: 89, points: 9 },
      teleroz: { active: false, price: 139, points: 14 },
      telepremium: { active: true, price: 219, points: 22 },
      cpi: { active: false, price: 49, points: 5 },
      zycie: { active: true, price: 109, points: 11 },
      home: { active: true, price: 65, points: 7 },
    }),
    benefits: buildBenefits({
      prolong14: { points: 130 },
      prolong30: { points: 200 },
      partialPayment: { active: false, points: 100 },
      expressLoan: { active: true, points: 250 },
    }),
  },
}

function cloneConfigs(source) {
  return JSON.parse(JSON.stringify(source))
}

export default function AdminConfig() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginUser, setLoginUser] = useState('')
  const [loginPass, setLoginPass] = useState('')
  const [loginError, setLoginError] = useState('')

  const [configs, setConfigs] = useState(() => cloneConfigs(DEFAULT_LENDER_CONFIGS))
  const [selectedLender, setSelectedLender] = useState(LENDERS[0])
  const [saveMessage, setSaveMessage] = useState('')

  const current = configs[selectedLender]

  const handleLogin = (e) => {
    e.preventDefault()
    if (loginUser === 'admin' && loginPass === 'demo') {
      setLoginError('')
      setIsLoggedIn(true)
      setLoginPass('')
    } else {
      setLoginError('Nieprawidłowy login lub hasło.')
    }
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setLoginUser('')
    setLoginPass('')
    setSaveMessage('')
  }

  const updateProduct = (productId, patch) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedLender]: {
        ...prev[selectedLender],
        products: {
          ...prev[selectedLender].products,
          [productId]: {
            ...prev[selectedLender].products[productId],
            ...patch,
          },
        },
      },
    }))
    setSaveMessage('')
  }

  const updateBenefit = (benefitId, patch) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedLender]: {
        ...prev[selectedLender],
        benefits: {
          ...prev[selectedLender].benefits,
          [benefitId]: {
            ...prev[selectedLender].benefits[benefitId],
            ...patch,
          },
        },
      },
    }))
    setSaveMessage('')
  }

  const handleSave = () => {
    setSaveMessage('Konfiguracja zapisana pomyślnie')
  }

  if (!isLoggedIn) {
    return (
      <div className="admin-config">
        <div className="admin-config-login-wrap">
          <div className="admin-config-login-card">
            <h1 className="admin-config-login-logo">LoyalVAS</h1>
            <p className="admin-config-login-sub">
              Panel Administracyjny — Konfiguracja Pożyczkodawców
            </p>
            <form onSubmit={handleLogin}>
              <div className="admin-config-field">
                <label htmlFor="admin-login-user">Login</label>
                <input
                  id="admin-login-user"
                  type="text"
                  value={loginUser}
                  onChange={(e) => setLoginUser(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="admin-config-field">
                <label htmlFor="admin-login-pass">Hasło</label>
                <input
                  id="admin-login-pass"
                  type="password"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              {loginError ? (
                <p className="admin-config-login-error" role="alert">
                  {loginError}
                </p>
              ) : null}
              <button type="submit" className="admin-config-btn admin-config-btn-primary">
                Zaloguj się
              </button>
            </form>
            <p className="admin-config-login-sub" style={{ marginTop: 16, marginBottom: 0 }}>
              Demo: login <strong>admin</strong>, hasło <strong>demo</strong>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-config">
      <div className="admin-config-layout">
        <aside className="admin-config-sidebar">
          <div className="admin-config-sidebar-head">
            <p className="admin-config-sidebar-logo">LoyalVAS</p>
            <p className="admin-config-sidebar-sub">
              Panel Administracyjny — Konfiguracja Pożyczkodawców
            </p>
          </div>
          <ul className="admin-config-nav">
            <li className="admin-config-nav-item">
              <button type="button" className="admin-config-nav-btn is-active">
                Konfiguracja VAS
              </button>
            </li>
            <li className="admin-config-nav-item">
              <button type="button" className="admin-config-nav-btn is-disabled" disabled>
                Pożyczkodawcy
                <span className="admin-config-nav-soon">wkrótce</span>
              </button>
            </li>
            <li className="admin-config-nav-item">
              <button type="button" className="admin-config-nav-btn is-disabled" disabled>
                Raporty
                <span className="admin-config-nav-soon">wkrótce</span>
              </button>
            </li>
          </ul>
          <div className="admin-config-sidebar-foot">
            <Link to="/" className="admin-config-back-demo">
              ← Demo VAS Loyalty
            </Link>
            <button type="button" className="admin-config-logout" onClick={handleLogout}>
              Wyloguj
            </button>
          </div>
        </aside>

        <main className="admin-config-main">
          <h1 className="admin-config-page-title">Konfiguracja VAS</h1>

          <section className="admin-config-section" aria-labelledby="admin-lender-heading">
            <h2 id="admin-lender-heading">Wybór pożyczkodawcy</h2>
            <div className="admin-config-tabs" role="tablist">
              {LENDERS.map((lender) => (
                <button
                  key={lender}
                  type="button"
                  role="tab"
                  aria-selected={selectedLender === lender}
                  className={`admin-config-tab ${selectedLender === lender ? 'is-active' : ''}`}
                  onClick={() => {
                    setSelectedLender(lender)
                    setSaveMessage('')
                  }}
                >
                  {lender}
                </button>
              ))}
            </div>
          </section>

          <section className="admin-config-section" aria-labelledby="admin-products-heading">
            <h2 id="admin-products-heading">Aktywne produkty VAS</h2>
            <div className="admin-config-products">
              {PRODUCT_DEFS.map((def) => {
                const p = current.products[def.id]
                return (
                  <div key={def.id} className="admin-config-product-row">
                    <label className="admin-config-product-check">
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={(e) =>
                          updateProduct(def.id, { active: e.target.checked })
                        }
                      />
                      {def.label}
                    </label>
                    <div className="admin-config-num-field">
                      <div className="admin-config-num-label">Cena (zł)</div>
                      <input
                        type="number"
                        min={0}
                        value={p.price}
                        disabled={!p.active}
                        onChange={(e) =>
                          updateProduct(def.id, {
                            price: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                    <div className="admin-config-num-field">
                      <div className="admin-config-num-label">Punkty za zakup</div>
                      <input
                        type="number"
                        min={0}
                        value={p.points}
                        disabled={!p.active}
                        onChange={(e) =>
                          updateProduct(def.id, {
                            points: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="admin-config-section" aria-labelledby="admin-benefits-heading">
            <h2 id="admin-benefits-heading">Przelicznik punktów na korzyści</h2>
            <table className="admin-config-benefits-table">
              <thead>
                <tr>
                  <th>Korzyść</th>
                  <th>Aktywna</th>
                  <th>Wymagane punkty</th>
                </tr>
              </thead>
              <tbody>
                <tr className="admin-config-benefit-row-mandatory">
                  <td>
                    Prolongata 14 dni{' '}
                    <span className="admin-config-benefit-mandatory">(obowiązkowa)</span>
                  </td>
                  <td>
                    <span className="admin-config-benefit-always" aria-hidden>
                      Zawsze aktywna
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current.benefits.prolong14.points}
                      onChange={(e) =>
                        updateBenefit('prolong14', {
                          points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </td>
                </tr>
                <tr className="admin-config-benefit-row-mandatory">
                  <td>
                    Prolongata 30 dni{' '}
                    <span className="admin-config-benefit-mandatory">(obowiązkowa)</span>
                  </td>
                  <td>
                    <span className="admin-config-benefit-always" aria-hidden>
                      Zawsze aktywna
                    </span>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current.benefits.prolong30.points}
                      onChange={(e) =>
                        updateBenefit('prolong30', {
                          points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Częściowa spłata</td>
                  <td>
                    <label className="admin-config-benefit-check">
                      <input
                        type="checkbox"
                        checked={current.benefits.partialPayment.active}
                        onChange={(e) =>
                          updateBenefit('partialPayment', { active: e.target.checked })
                        }
                      />
                      Tak
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current.benefits.partialPayment.points}
                      disabled={!current.benefits.partialPayment.active}
                      onChange={(e) =>
                        updateBenefit('partialPayment', {
                          points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Ekspresowa pożyczka</td>
                  <td>
                    <label className="admin-config-benefit-check">
                      <input
                        type="checkbox"
                        checked={current.benefits.expressLoan.active}
                        onChange={(e) =>
                          updateBenefit('expressLoan', { active: e.target.checked })
                        }
                      />
                      Tak
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current.benefits.expressLoan.points}
                      disabled={!current.benefits.expressLoan.active}
                      onChange={(e) =>
                        updateBenefit('expressLoan', {
                          points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="admin-config-save-actions">
              <button
                type="button"
                className="admin-config-btn admin-config-btn-save"
                onClick={handleSave}
              >
                Zapisz konfigurację
              </button>
              {saveMessage ? (
                <p className="admin-config-save-msg" role="status">
                  {saveMessage}
                </p>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
