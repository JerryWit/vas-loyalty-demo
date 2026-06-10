import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import './LenderDemo.css'

const STORAGE_KEY = 'vas-eksprespozyczka-demo-v1'
const STORAGE_KEY_LEGACY = 'vas-smartpozyczka-demo-v1'
const DEMO_CLIENT_ID = 'c1'
const DEMO_POINTS_FALLBACK = 40
const DEMO_LAST_ACTIVITY = '9.06.2026 — Zakup VAS'

function loadDemoPointsBalance() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY_LEGACY)
    if (!raw) return DEMO_POINTS_FALLBACK
    const data = JSON.parse(raw)
    return data.pointsByClient?.[DEMO_CLIENT_ID] ?? DEMO_POINTS_FALLBACK
  } catch {
    return DEMO_POINTS_FALLBACK
  }
}

function loadLastActivity() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY_LEGACY)
    if (!raw) return DEMO_LAST_ACTIVITY
    const data = JSON.parse(raw)
    const purchases = Array.isArray(data.purchases) ? data.purchases : []
    const latest = purchases
      .filter((p) => p.clientId === DEMO_CLIENT_ID)
      .sort((a, b) => new Date(b.at) - new Date(a.at))[0]
    if (!latest?.at) return DEMO_LAST_ACTIVITY
    const date = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short' }).format(
      new Date(latest.at),
    )
    return `${date} — ${latest.productName ?? 'Zakup VAS'}`
  } catch {
    return DEMO_LAST_ACTIVITY
  }
}

export default function LenderDemo() {
  const widgetRef = useRef(null)
  const pointsBalance = useMemo(() => loadDemoPointsBalance(), [])
  const lastActivity = useMemo(() => loadLastActivity(), [])

  useEffect(() => {
    const timer = setTimeout(() => {
      const iframe = document.querySelector('iframe')
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'LOYALVAS_TOKEN',
            token: 'demo-token-jan-kowalski-wandoo',
          },
          '*',
        )
      }
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  const scrollToWidget = () => {
    widgetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    widgetRef.current?.focus({ preventScroll: true })
  }

  return (
    <div className="lender-demo">
      <header className="lender-demo-header">
        <div className="lender-demo-header-inner">
          <h1 className="lender-demo-logo">Wandoo</h1>
          <p className="lender-demo-header-sub">Panel Klienta</p>
          <nav className="lender-demo-nav" aria-label="Menu panelu klienta">
            <span className="lender-demo-nav-item">Moje pożyczki</span>
            <span className="lender-demo-nav-item">Historia spłat</span>
            <span className="lender-demo-nav-item">Dokumenty</span>
            <span className="lender-demo-nav-item is-active" aria-current="page">
              LoyalVAS
            </span>
          </nav>
        </div>
      </header>

      <main className="lender-demo-main">
        <Link to="/" className="lender-demo-back-link">
          ← Powrót do demo VAS Loyalty
        </Link>

        <section className="lender-demo-welcome" aria-label="Podsumowanie pożyczki">
          <h2>Witaj, Jan Kowalski</h2>
          <p className="lender-demo-loan-meta">
            Twoja pożyczka: SP-1001 | Kwota: 3 500 zł | Termin spłaty: 15.06.2026
          </p>
          <div className="lender-demo-progress-label">
            <span>Postęp spłaty</span>
            <span>50%</span>
          </div>
          <div className="lender-demo-progress-track" role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100}>
            <div className="lender-demo-progress-fill" style={{ width: '50%' }} />
          </div>
        </section>

        <div className="lender-demo-layout">
          <section className="lender-demo-content" aria-labelledby="loyalvas-heading">
            <h2 id="loyalvas-heading" className="lender-demo-section-title">
              Program lojalnościowy LoyalVAS
            </h2>
            <p className="lender-demo-section-lead">
              Kupuj usługi dodatkowe i zbieraj punkty wymienialne na przedłużenie spłaty pożyczki.
            </p>
            <div className="lender-demo-widget-wrap" ref={widgetRef} tabIndex={-1}>
              <iframe src="/" title="LoyalVAS Portal" />
            </div>
          </section>

          <aside className="lender-demo-sidebar" aria-label="Saldo punktów LoyalVAS">
            <div className="lender-demo-points-card">
              <h3>Twoje punkty LoyalVAS</h3>
              <p className="lender-demo-balance">Saldo</p>
              <p className="lender-demo-balance-num">{pointsBalance} pkt</p>
              <p className="lender-demo-last-activity">
                <strong>Ostatnia aktywność</strong>
                {lastActivity}
              </p>
              <button type="button" className="lender-demo-sidebar-btn" onClick={scrollToWidget}>
                Przejdź do portalu LoyalVAS
              </button>
            </div>
          </aside>
        </div>
      </main>

      <footer className="lender-demo-footer">
        <div className="lender-demo-footer-inner">
          <span>© 2026 Wandoo | Powered by LoyalVAS</span>
          <span className="lender-demo-footer-logo">LoyalVAS</span>
        </div>
      </footer>
    </div>
  )
}
