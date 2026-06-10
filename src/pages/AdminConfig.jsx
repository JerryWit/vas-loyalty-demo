import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LENDER_ADMIN_TABS,
  saveLenderPointsConfig,
  VAS_PRODUCTS,
} from '../data/vasCatalog.js'
import './AdminConfig.css'

const LENDERS = LENDER_ADMIN_TABS.map((t) => t.label)
const LENDER_PRICES_CONFIG_KEY = 'lenderPricesConfig'
const LENDER_POINTS_CONFIG_KEY = 'lenderPointsConfig'
const LENDER_POINTS_EXPIRY_KEY = 'lenderPointsExpiry'
const DEFAULT_LENDER_POINTS_EXPIRY = {
  ekspres: 365,
  kredytok: 730,
  szybkagotowka: 365,
  pozyczkaplus: null,
}
const LENDER_POINTS_EXPIRY_OPTIONS = [
  { value: 'never', label: 'Nigdy nie wygasają', days: null },
  { value: '365', label: 'Po 365 dniach', days: 365 },
  { value: '730', label: 'Po 730 dniach (2 lata)', days: 730 },
]
const DEFAULT_LENDER_POINTS_CONFIG = {
  ekspres: { p1: 60, p2: 120, p3: 200, p4: 45, p5: 60, p6: 40 },
  kredytok: { p1: 65, p2: 130, p3: 210, p4: 50, p5: 65, p6: 45 },
  szybkagotowka: { p1: 55, p2: 110, p3: 190, p4: 40, p5: 55, p6: 35 },
  pozyczkaplus: { p1: 70, p2: 140, p3: 220, p4: 55, p5: 70, p6: 50 },
}
const DEFAULT_LENDER_PRICES_CONFIG = {
  ekspres: { p1: 120, p2: 240, p3: 400, p4: 180, p5: 240, p6: 160 },
  kredytok: { p1: 120, p2: 240, p3: 400, p4: 180, p5: 240, p6: 160 },
  szybkagotowka: { p1: 120, p2: 240, p3: 400, p4: 180, p5: 240, p6: 160 },
  pozyczkaplus: { p1: 120, p2: 240, p3: 400, p4: 180, p5: 240, p6: 160 },
}

function loadLenderPointsConfig() {
  try {
    const raw = localStorage.getItem(LENDER_POINTS_CONFIG_KEY)
    if (!raw) return { ...DEFAULT_LENDER_POINTS_CONFIG }
    const parsed = JSON.parse(raw)
    const merged = { ...DEFAULT_LENDER_POINTS_CONFIG }
    Object.keys(merged).forEach((lenderKey) => {
      merged[lenderKey] = { ...merged[lenderKey], ...parsed[lenderKey] }
    })
    return merged
  } catch {
    return { ...DEFAULT_LENDER_POINTS_CONFIG }
  }
}

function loadLenderPointsExpiryConfig() {
  try {
    const raw = localStorage.getItem(LENDER_POINTS_EXPIRY_KEY)
    if (!raw) return { ...DEFAULT_LENDER_POINTS_EXPIRY }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_LENDER_POINTS_EXPIRY, ...parsed }
  } catch {
    return { ...DEFAULT_LENDER_POINTS_EXPIRY }
  }
}

function loadLenderPricesConfig() {
  try {
    const raw = localStorage.getItem(LENDER_PRICES_CONFIG_KEY)
    if (!raw) return { ...DEFAULT_LENDER_PRICES_CONFIG }
    const parsed = JSON.parse(raw)
    const merged = { ...DEFAULT_LENDER_PRICES_CONFIG }
    Object.keys(merged).forEach((lenderKey) => {
      merged[lenderKey] = { ...merged[lenderKey], ...parsed[lenderKey] }
    })
    return merged
  } catch {
    return { ...DEFAULT_LENDER_PRICES_CONFIG }
  }
}

function buildProducts(overrides) {
  const base = Object.fromEntries(
    VAS_PRODUCTS.map((p) => [p.id, { active: p.id === 'p1', price: p.pricePln }]),
  )
  return { ...base, ...overrides }
}

function buildBenefits(overrides) {
  const base = {
    prolong7: { active: true, points: 70 },
    prolong14: { active: true, points: 120 },
    prolong30: { active: true, points: 180 },
    partialPayment: { active: true, points: 500 },
    expressLoan: { active: false, points: 200 },
  }
  return { ...base, ...overrides }
}

const DEFAULT_LENDER_CONFIGS = {
  Wandoo: {
    products: buildProducts({
      p1: { active: true, price: 120 },
      p2: { active: true, price: 240 },
      p3: { active: true, price: 400 },
      p4: { active: true, price: 180 },
      p5: { active: true, price: 240 },
      p6: { active: true, price: 160 },
    }),
    benefits: buildBenefits({
      prolong7: { active: true, points: 70 },
      prolong14: { active: true, points: 120 },
      prolong30: { active: true, points: 180 },
      partialPayment: { active: true, points: 500 },
      expressLoan: { active: false, points: 200 },
    }),
  },
  KredytOK: {
    products: buildProducts({
      p1: { active: true, price: 120 },
      p2: { active: true, price: 240 },
      p3: { active: true, price: 400 },
      p4: { active: true, price: 180 },
      p5: { active: false, price: 240 },
      p6: { active: true, price: 160 },
    }),
    benefits: buildBenefits({
      prolong7: { active: true, points: 65 },
      prolong14: { active: true, points: 110 },
      prolong30: { active: true, points: 170 },
      partialPayment: { active: true, points: 90 },
      expressLoan: { active: true, points: 220 },
    }),
  },
  'Szybka Gotówka': {
    products: buildProducts({
      p1: { active: true, price: 120 },
      p2: { active: true, price: 240 },
      p3: { active: false, price: 400 },
      p4: { active: true, price: 180 },
      p5: { active: true, price: 240 },
      p6: { active: false, price: 160 },
    }),
    benefits: buildBenefits({
      prolong7: { active: false, points: 60 },
      prolong14: { active: true, points: 100 },
      prolong30: { active: false, points: 160 },
      partialPayment: { active: true, points: 85 },
      expressLoan: { active: false, points: 190 },
    }),
  },
  PożyczkaPLUS: {
    products: buildProducts({
      p1: { active: true, price: 120 },
      p2: { active: false, price: 240 },
      p3: { active: true, price: 400 },
      p4: { active: false, price: 180 },
      p5: { active: true, price: 240 },
      p6: { active: true, price: 160 },
    }),
    benefits: buildBenefits({
      prolong7: { active: true, points: 75 },
      prolong14: { active: true, points: 130 },
      prolong30: { active: true, points: 200 },
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
  const [lenderPointsConfig, setLenderPointsConfig] = useState(() => loadLenderPointsConfig())
  const [lenderPricesConfig, setLenderPricesConfig] = useState(() =>
    loadLenderPricesConfig(),
  )
  const [lenderPointsExpiryConfig, setLenderPointsExpiryConfig] = useState(() =>
    loadLenderPointsExpiryConfig(),
  )
  const [saveMessage, setSaveMessage] = useState('')

  const current = configs[selectedLender]
  const selectedLenderKey =
    LENDER_ADMIN_TABS.find((t) => t.label === selectedLender)?.key ?? 'ekspres'

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

  const handleHeaderLogout = () => {
    handleLogout()
    window.location.href = '/'
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

  const updateLenderProductPoints = (productId, points) => {
    setLenderPointsConfig((prev) => ({
      ...prev,
      [selectedLenderKey]: {
        ...prev[selectedLenderKey],
        [productId]: Math.max(0, Number(points) || 0),
      },
    }))
    setSaveMessage('')
  }

  const updateLenderPointsExpiry = (days) => {
    setLenderPointsExpiryConfig((prev) => ({
      ...prev,
      [selectedLenderKey]: days,
    }))
    setSaveMessage('')
  }

  const updateLenderProductPrice = (productId, price) => {
    setLenderPricesConfig((prev) => ({
      ...prev,
      [selectedLenderKey]: {
        ...prev[selectedLenderKey],
        [productId]: Math.max(0, Number(price) || 0),
      },
    }))
    setSaveMessage('')
  }

  const handleSave = () => {
    saveLenderPointsConfig(lenderPointsConfig)
    localStorage.setItem(LENDER_PRICES_CONFIG_KEY, JSON.stringify(lenderPricesConfig))
    localStorage.setItem(
      LENDER_POINTS_EXPIRY_KEY,
      JSON.stringify(lenderPointsExpiryConfig),
    )
    setSaveMessage('Konfiguracja zapisana')
  }

  const selectedExpiryValue =
    lenderPointsExpiryConfig[selectedLenderKey] === null
      ? 'never'
      : String(lenderPointsExpiryConfig[selectedLenderKey] ?? 365)

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <h1 className="admin-config-page-title">Konfiguracja VAS</h1>
            <button
              type="button"
              className="admin-config-btn admin-config-btn-secondary"
              style={{ padding: '6px 10px', fontSize: 12 }}
              onClick={handleHeaderLogout}
            >
              ← Wróć do LoyalVAS
            </button>
          </div>

          <form
            className="admin-config-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSave()
            }}
          >
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
              {VAS_PRODUCTS.map((def) => {
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
                      {def.name}
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
                  </div>
                )
              })}
            </div>
          </section>

          <section
            className="admin-config-section"
            aria-labelledby="admin-points-config-heading"
          >
            <h2 id="admin-points-config-heading">
              Punkty za zakup VAS — {selectedLender}
            </h2>
            <p className="admin-config-section-lead">
              Ile punktów przyznaje klientowi ten pożyczkodawca za zakup każdego produktu VAS
              (wartości mogą się różnić między pożyczkodawcami).
            </p>
            <h3 className="admin-config-subtitle">Ceny produktów VAS dla klienta (zł)</h3>
            <table className="admin-config-benefits-table admin-config-points-table">
              <thead>
                <tr>
                  <th>Produkt VAS</th>
                  <th>Cena (zł)</th>
                </tr>
              </thead>
              <tbody>
                {VAS_PRODUCTS.map((product) => (
                  <tr key={`price-${product.id}`}>
                    <td>{product.name}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={
                          lenderPricesConfig[selectedLenderKey]?.[product.id] ??
                          DEFAULT_LENDER_PRICES_CONFIG[selectedLenderKey]?.[product.id] ??
                          product.pricePln
                        }
                        onChange={(e) =>
                          updateLenderProductPrice(product.id, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="admin-config-subtitle">Punkty za zakup VAS</h3>
            <table className="admin-config-benefits-table admin-config-points-table">
              <thead>
                <tr>
                  <th>Produkt VAS</th>
                  <th>Punkty za zakup</th>
                </tr>
              </thead>
              <tbody>
                {VAS_PRODUCTS.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={
                          lenderPointsConfig[selectedLenderKey]?.[product.id] ??
                          DEFAULT_LENDER_POINTS_CONFIG[selectedLenderKey]?.[product.id] ??
                          0
                        }
                        onChange={(e) =>
                          updateLenderProductPoints(product.id, e.target.value)
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="admin-config-subtitle">Wygasanie punktów nadanych przez pożyczkodawcę</h3>
            <label className="admin-config-field">
              <span>Okres ważności punktów lender</span>
              <select
                value={selectedExpiryValue}
                onChange={(e) => {
                  const option = LENDER_POINTS_EXPIRY_OPTIONS.find(
                    (item) => item.value === e.target.value,
                  )
                  updateLenderPointsExpiry(option?.days ?? null)
                }}
              >
                {LENDER_POINTS_EXPIRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
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
                <tr>
                  <td>Prolongata 7 dni</td>
                  <td>
                    <label className="admin-config-benefit-check">
                      <input
                        type="checkbox"
                        checked={current.benefits.prolong7.active}
                        onChange={(e) =>
                          updateBenefit('prolong7', { active: e.target.checked })
                        }
                      />
                      Tak
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current.benefits.prolong7.points}
                      disabled={!current.benefits.prolong7.active}
                      onChange={(e) =>
                        updateBenefit('prolong7', {
                          points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Prolongata 14 dni</td>
                  <td>
                    <label className="admin-config-benefit-check">
                      <input
                        type="checkbox"
                        checked={current.benefits.prolong14.active}
                        onChange={(e) =>
                          updateBenefit('prolong14', { active: e.target.checked })
                        }
                      />
                      Tak
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current.benefits.prolong14.points}
                      disabled={!current.benefits.prolong14.active}
                      onChange={(e) =>
                        updateBenefit('prolong14', {
                          points: Math.max(0, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </td>
                </tr>
                <tr>
                  <td>Prolongata 30 dni</td>
                  <td>
                    <label className="admin-config-benefit-check">
                      <input
                        type="checkbox"
                        checked={current.benefits.prolong30.active}
                        onChange={(e) =>
                          updateBenefit('prolong30', { active: e.target.checked })
                        }
                      />
                      Tak
                    </label>
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      value={current.benefits.prolong30.points}
                      disabled={!current.benefits.prolong30.active}
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
              <button type="submit" className="admin-config-btn admin-config-btn-save">
                Zapisz konfigurację
              </button>
              {saveMessage ? (
                <p className="admin-config-save-msg" role="status">
                  {saveMessage}
                </p>
              ) : null}
            </div>
          </section>
          </form>
        </main>
      </div>
    </div>
  )
}
