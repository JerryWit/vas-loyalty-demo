import { useMemo, useRef, useState } from 'react'
import './AdminPlatform.css'

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Dziś' },
  { id: 'month', label: 'Ten miesiąc' },
  { id: 'prevMonth', label: 'Poprzedni miesiąc' },
  { id: 'all', label: 'Od początku współpracy' },
]

const DEMO_STATIC = {
  alerts: {
    failedWebhooks: 2,
    expiringPoints: { pts: 45, clients: 3 },
    csvDeadline: { days: 8, date: '05.06.2026' },
  },
  kpis: {
    totalSales: '2 340 zł',
    netRevenue: '1 890 zł',
    avgBasket: '195 zł',
  },
  lenders: [
    {
      name: 'EkspresPożyczka',
      active: 5,
      purchases: 4,
      sales: '960 zł',
      platform: '776 zł',
      commissionPts: 412,
      conversion: '80%',
    },
    {
      name: 'KredytOK',
      active: 4,
      purchases: 3,
      sales: '840 zł',
      platform: '672 zł',
      commissionPts: 360,
      conversion: '75%',
    },
    {
      name: 'PożyczkaPLUS',
      active: 3,
      purchases: 1,
      sales: '540 zł',
      platform: '432 zł',
      commissionPts: 231,
      conversion: '33%',
    },
  ],
}

const TELEMEDI_ROWS = [
  { variant: 'Telemedycyna Basic (500–999 zł)', count: 3, revenue: '360 zł', platform: '306 zł' },
  {
    variant: 'Telemedycyna Rozszerzona (1000–1999 zł)',
    count: 2,
    revenue: '480 zł',
    platform: '408 zł',
  },
  { variant: 'Telemedycyna Premium (2000+ zł)', count: 1, revenue: '400 zł', platform: '340 zł' },
]

const TELEMEDI_TOTAL = { count: 6, revenue: '1 240 zł', platform: '1 054 zł' }

const TU_ALFA_ROWS = [
  { product: 'CPI', variant: 'Wariant 1', count: 4, premium: '480 zł', platform: '96 zł' },
  { product: 'Życie NNW', variant: 'Wariant 1', count: 2, premium: '240 zł', platform: '48 zł' },
  { product: 'Życie NNW', variant: 'Wariant 2', count: 1, premium: '180 zł', platform: '36 zł' },
]

const TU_ALFA_TOTAL = { count: 7, premium: '900 zł', platform: '180 zł' }

const TU_BETA_ROWS = [
  { product: 'Home Assistance', variant: 'Wariant 1', count: 3, premium: '360 zł', platform: '72 zł' },
  { product: 'Home Assistance', variant: 'Wariant 2', count: 1, premium: '180 zł', platform: '36 zł' },
  { product: 'Home Assistance', variant: 'Wariant 3', count: 1, premium: '240 zł', platform: '48 zł' },
]

const TU_BETA_TOTAL = { count: 5, premium: '780 zł', platform: '156 zł' }

const INSURANCE_GRAND_TOTAL = { count: 12, premium: '1 680 zł', platform: '336 zł' }

const EVENT_FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'failed', label: 'Failed webhooki' },
  { id: 'chargeback', label: 'Chargebacki' },
  { id: 'expiry', label: 'Wygaśnięcia punktów' },
]

function formatTxDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRedemptionPointsCost(redemption) {
  return redemption.pointsCost ?? redemption.points ?? 0
}

function buildLiveKpis(purchases, lenderRedemptions, lenderPointsTotal) {
  const uniqueClientIds = new Set(purchases.map((p) => p.clientId).filter(Boolean))
  const loggedIn = uniqueClientIds.size
  const withPurchase = loggedIn
  const conversion =
    loggedIn > 0 ? `${Math.round((withPurchase / loggedIn) * 100)}%` : '0%'
  const pointsGranted = purchases.reduce((s, p) => s + (p.pointsEarned ?? 0), 0)
  const pointsUsed = lenderRedemptions.reduce(
    (s, r) => s + getRedemptionPointsCost(r),
    0,
  )

  return {
    loggedIn: String(loggedIn),
    withPurchase: String(withPurchase),
    conversion,
    pointsGranted: `${pointsGranted} pkt`,
    pointsUsed: `${pointsUsed} pkt`,
    lenderPoints: `${lenderPointsTotal} pkt`,
  }
}

function SectionCard({ title, badge, children, id }) {
  return (
    <section className="ap-card" id={id} aria-labelledby={id ? `${id}-title` : undefined}>
      {title ? (
        <div className="ap-section-head">
          <h2 className="ap-section-title" id={id ? `${id}-title` : undefined}>
            {title}
          </h2>
          {badge ? <span className="ap-section-badge">{badge}</span> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export default function AdminPlatform({
  settlementModel,
  formatMoney,
  purchases = [],
  lenderRedemptions = [],
  pointsByClient = {},
  lenderPointsTotal = 0,
  baseClients = [],
}) {
  const [period, setPeriod] = useState('month')
  const [eventFilter, setEventFilter] = useState('all')
  const operationsRef = useRef(null)

  const liveKpis = useMemo(
    () => buildLiveKpis(purchases, lenderRedemptions, lenderPointsTotal),
    [purchases, lenderRedemptions, lenderPointsTotal],
  )

  const clientById = useMemo(
    () => Object.fromEntries(baseClients.map((c) => [c.id, c])),
    [baseClients],
  )

  const operations = useMemo(() => {
    const purchaseRows = purchases.map((p) => ({
      id: p.id,
      date: formatTxDate(p.at),
      client: clientById[p.clientId]?.name ?? p.clientId,
      lender: settlementModel?.lenderName ?? 'EkspresPożyczka',
      type: 'purchase',
      typeLabel: 'Zakup VAS',
      points: `+${p.pointsEarned ?? 0} pkt`,
      status: 'ok',
      statusLabel: 'OK',
      at: p.at,
    }))
    const redemptionRows = lenderRedemptions.map((r) => ({
      id: r.id,
      date: formatTxDate(r.at),
      client: clientById[r.clientId]?.name ?? r.clientId,
      lender: r.lenderName ?? settlementModel?.lenderName ?? 'EkspresPożyczka',
      type: 'redeem',
      typeLabel: r.optionLabel ?? 'Wymiana punktów',
      points: `−${getRedemptionPointsCost(r)} pkt`,
      status: 'ok',
      statusLabel: 'OK',
      at: r.at,
    }))
    return [...purchaseRows, ...redemptionRows].sort(
      (a, b) => new Date(b.at) - new Date(a.at),
    )
  }, [purchases, lenderRedemptions, clientById, settlementModel?.lenderName])

  const lenderTotals = useMemo(() => {
    const rows = DEMO_STATIC.lenders
    return {
      active: rows.reduce((s, r) => s + r.active, 0),
      purchases: rows.reduce((s, r) => s + r.purchases, 0),
      sales: DEMO_STATIC.kpis.totalSales,
      platform: DEMO_STATIC.kpis.netRevenue,
      commissionPts: rows.reduce((s, r) => s + r.commissionPts, 0),
      conversion: '67%',
    }
  }, [])

  const filteredOperations = useMemo(() => {
    if (eventFilter === 'all') return operations
    if (eventFilter === 'failed') return operations.filter((o) => o.status === 'failed')
    if (eventFilter === 'expiry') return operations.filter((o) => o.type === 'expiry')
    return operations.filter((o) => o.type === 'chargeback')
  }, [eventFilter, operations])

  const scrollToOperations = () => {
    operationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setEventFilter('failed')
  }

  const kpiRow1 = [
    {
      id: 'sales',
      label: 'Całkowita sprzedaż VAS',
      value: DEMO_STATIC.kpis.totalSales,
      foot: 'Przychód brutto w wybranym okresie',
      dark: true,
    },
    {
      id: 'net',
      label: 'Przychód netto platformy',
      value: DEMO_STATIC.kpis.netRevenue,
      foot: 'Po odliczeniu prowizji partnerów',
    },
    {
      id: 'lender',
      label: 'Punkty Pożyczkodawcy',
      value: liveKpis.lenderPoints,
      foot: 'Suma punktów pożyczkodawcy w wybranym okresie',
    },
    {
      id: 'basket',
      label: 'Średnia wartość koszyka',
      value: DEMO_STATIC.kpis.avgBasket,
      foot: 'Na transakcję VAS',
    },
  ]

  const kpiRow2 = [
    {
      id: 'logged',
      label: 'Klienci zalogowani',
      value: liveKpis.loggedIn,
      foot: 'Unikalnych w wybranym okresie',
    },
    {
      id: 'buyers',
      label: 'Klienci z zakupem VAS',
      value: liveKpis.withPurchase,
      foot: `Konwersja: ${liveKpis.conversion}`,
    },
    {
      id: 'granted',
      label: 'Punkty przyznane',
      value: liveKpis.pointsGranted,
      foot: 'Naliczone klientom',
    },
    {
      id: 'used',
      label: 'Punkty wykorzystane',
      value: liveKpis.pointsUsed,
      foot: 'Wymienione na korzyści',
    },
  ]

  const { alerts } = DEMO_STATIC
  const showAlerts =
    alerts.failedWebhooks > 0 || alerts.expiringPoints || alerts.csvDeadline

  return (
    <div className="ap-dashboard">
      <div className="ap-period-filter" role="group" aria-label="Filtr okresu">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            className={`ap-period-btn ${period === opt.id ? 'is-active' : ''}`}
            onClick={() => setPeriod(opt.id)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {showAlerts ? (
        <SectionCard title="Alerty operacyjne" badge="LIVE">
          <div className="ap-alerts">
            {alerts.failedWebhooks > 0 ? (
              <button
                type="button"
                className="ap-alert ap-alert--danger"
                onClick={scrollToOperations}
              >
                <span className="ap-alert-icon" aria-hidden>
                  ⚠
                </span>
                <span>
                  Failed webhooki: <strong>{alerts.failedWebhooks}</strong> — wymagają ręcznej
                  obsługi
                </span>
              </button>
            ) : null}
            {alerts.expiringPoints ? (
              <div className="ap-alert ap-alert--warn">
                <span className="ap-alert-icon" aria-hidden>
                  ⏳
                </span>
                <span>
                  Punkty wygasające w ciągu 30 dni:{' '}
                  <strong>
                    {alerts.expiringPoints.pts} pkt ({alerts.expiringPoints.clients} klientów)
                  </strong>
                </span>
              </div>
            ) : null}
            {alerts.csvDeadline ? (
              <div className="ap-alert ap-alert--warn">
                <span className="ap-alert-icon" aria-hidden>
                  📅
                </span>
                <span>
                  Termin wysyłki CSV do TU: za <strong>{alerts.csvDeadline.days} dni</strong>{' '}
                  (do {alerts.csvDeadline.date})
                </span>
              </div>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard>
        <div className="ap-kpi-grid">
          {kpiRow1.map((tile) => (
            <article
              key={tile.id}
              className={`vas-kpi ap-kpi ${tile.dark ? 'ap-kpi--dark' : ''}`}
            >
              <div className="vas-kpi-label">{tile.label}</div>
              <div className="vas-kpi-value">{tile.value}</div>
              <div className="vas-kpi-foot">{tile.foot}</div>
            </article>
          ))}
        </div>
        <div className="ap-kpi-grid ap-kpi-grid--row2">
          {kpiRow2.map((tile) => (
            <article key={tile.id} className="vas-kpi ap-kpi">
              <div className="vas-kpi-label">{tile.label}</div>
              <div className="vas-kpi-value">{tile.value}</div>
              <div className="vas-kpi-foot">{tile.foot}</div>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Wyniki per pożyczkodawca" badge={PERIOD_OPTIONS.find((p) => p.id === period)?.label}>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Pożyczkodawca</th>
                <th>Aktywni klienci</th>
                <th>Zakupy VAS</th>
                <th>Sprzedaż VAS (zł)</th>
                <th>Przychód platformy (zł)</th>
                <th>Punkty Pożyczkodawcy (pkt)</th>
                <th>Konwersja (%)</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_STATIC.lenders.map((row) => (
                <tr key={row.name}>
                  <td>
                    <strong>{row.name}</strong>
                  </td>
                  <td>{row.active}</td>
                  <td>{row.purchases}</td>
                  <td>{row.sales}</td>
                  <td>{row.platform}</td>
                  <td>{row.commissionPts} pkt</td>
                  <td>{row.conversion}</td>
                </tr>
              ))}
              <tr className="ap-table-total">
                <td>
                  <strong>Razem</strong>
                </td>
                <td>
                  <strong>{lenderTotals.active}</strong>
                </td>
                <td>
                  <strong>{lenderTotals.purchases}</strong>
                </td>
                <td>
                  <strong>{lenderTotals.sales}</strong>
                </td>
                <td>
                  <strong>{lenderTotals.platform}</strong>
                </td>
                <td>
                  <strong>{lenderTotals.commissionPts} pkt</strong>
                </td>
                <td>
                  <strong>{lenderTotals.conversion}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Sprzedaż per produkt VAS" badge="SKU">
        <h3 className="ap-subsection-title">Telemedycyna (Telemedi)</h3>
        <div className="ap-table-wrap ap-mb-lg">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Wariant</th>
                <th>Liczba sprzedaży</th>
                <th>Przychód</th>
                <th>Przychód platformy (85%)</th>
              </tr>
            </thead>
            <tbody>
              {TELEMEDI_ROWS.map((row) => (
                <tr key={row.variant}>
                  <td>{row.variant}</td>
                  <td>{row.count}</td>
                  <td>{row.revenue}</td>
                  <td>{row.platform}</td>
                </tr>
              ))}
              <tr className="ap-table-total">
                <td>
                  <strong>Razem Telemedi</strong>
                </td>
                <td>
                  <strong>{TELEMEDI_TOTAL.count}</strong>
                </td>
                <td>
                  <strong>{TELEMEDI_TOTAL.revenue}</strong>
                </td>
                <td>
                  <strong>{TELEMEDI_TOTAL.platform}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="ap-subsection-title">Ubezpieczenia per ubezpieczyciel</h3>
        <h4 className="ap-tu-title">TU Alfa</h4>
        <div className="ap-table-wrap ap-mb-md">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Wariant</th>
                <th>Liczba polis</th>
                <th>Składka brutto</th>
                <th>Przychód platformy (prowizja agencyjna)</th>
              </tr>
            </thead>
            <tbody>
              {TU_ALFA_ROWS.map((row, i) => (
                <tr key={i}>
                  <td>{row.product}</td>
                  <td>{row.variant}</td>
                  <td>{row.count}</td>
                  <td>{row.premium}</td>
                  <td>{row.platform}</td>
                </tr>
              ))}
              <tr className="ap-table-total">
                <td colSpan={2}>
                  <strong>Razem TU Alfa</strong>
                </td>
                <td>
                  <strong>{TU_ALFA_TOTAL.count}</strong>
                </td>
                <td>
                  <strong>{TU_ALFA_TOTAL.premium}</strong>
                </td>
                <td>
                  <strong>{TU_ALFA_TOTAL.platform}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h4 className="ap-tu-title">TU Beta</h4>
        <div className="ap-table-wrap ap-mb-md">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Produkt</th>
                <th>Wariant</th>
                <th>Liczba polis</th>
                <th>Składka brutto</th>
                <th>Przychód platformy (prowizja agencyjna)</th>
              </tr>
            </thead>
            <tbody>
              {TU_BETA_ROWS.map((row, i) => (
                <tr key={i}>
                  <td>{row.product}</td>
                  <td>{row.variant}</td>
                  <td>{row.count}</td>
                  <td>{row.premium}</td>
                  <td>{row.platform}</td>
                </tr>
              ))}
              <tr className="ap-table-total">
                <td colSpan={2}>
                  <strong>Razem TU Beta</strong>
                </td>
                <td>
                  <strong>{TU_BETA_TOTAL.count}</strong>
                </td>
                <td>
                  <strong>{TU_BETA_TOTAL.premium}</strong>
                </td>
                <td>
                  <strong>{TU_BETA_TOTAL.platform}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="ap-table-wrap">
          <table className="ap-table">
            <tbody>
              <tr className="ap-table-total">
                <td>
                  <strong>Razem Ubezpieczenia</strong>
                </td>
                <td />
                <td>
                  <strong>{INSURANCE_GRAND_TOTAL.count}</strong>
                </td>
                <td>
                  <strong>{INSURANCE_GRAND_TOTAL.premium}</strong>
                </td>
                <td>
                  <strong>{INSURANCE_GRAND_TOTAL.platform}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Rozliczenia z ubezpieczycielami" badge="TU">
        <div className="ap-tu-cards">
          <article className="ap-tu-card">
            <h3 className="ap-tu-card-title">TU Alfa</h3>
            <ul className="ap-tu-card-list">
              <li>
                Polisy w tym miesiącu: <strong>7</strong>
              </li>
              <li>
                Składka do odprowadzenia: <strong>900 zł</strong>
              </li>
              <li>
                Termin wysyłki CSV: <strong>05.06.2026</strong>
              </li>
            </ul>
            <div className="ap-tu-card-foot">
              <span className="ap-status-badge ap-status-badge--warn">Oczekuje na wysyłkę</span>
              <button type="button" className="vas-btn vas-btn-secondary vas-btn-sm">
                Generuj CSV
              </button>
            </div>
          </article>
          <article className="ap-tu-card">
            <h3 className="ap-tu-card-title">TU Beta</h3>
            <ul className="ap-tu-card-list">
              <li>
                Polisy w tym miesiącu: <strong>5</strong>
              </li>
              <li>
                Składka do odprowadzenia: <strong>780 zł</strong>
              </li>
              <li>
                Termin wysyłki CSV: <strong>05.06.2026</strong>
              </li>
            </ul>
            <div className="ap-tu-card-foot">
              <span className="ap-status-badge ap-status-badge--warn">Oczekuje na wysyłkę</span>
              <button type="button" className="vas-btn vas-btn-secondary vas-btn-sm">
                Generuj CSV
              </button>
            </div>
          </article>
        </div>
      </SectionCard>

      <SectionCard
        title="Rejestr operacji"
        badge="AUDYT"
        id="ap-operations"
      >
        <div ref={operationsRef} className="ap-ops-anchor" />
        <div className="ap-event-filter" role="group" aria-label="Filtr typu zdarzenia">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`ap-period-btn ap-period-btn--sm ${eventFilter === f.id ? 'is-active' : ''}`}
              onClick={() => setEventFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="ap-table-wrap ap-mt-md">
          <table className="ap-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Klient</th>
                <th>Typ zdarzenia</th>
                <th>Punkty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOperations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="ap-muted-cell">
                    Brak zdarzeń dla wybranego filtra.
                  </td>
                </tr>
              ) : (
                filteredOperations.map((row) => (
                  <tr key={row.id ?? `${row.at}-${row.type}`}>
                    <td className="ap-td-nowrap">{row.date}</td>
                    <td>
                      {row.client} ({row.lender})
                    </td>
                    <td>
                      <span className={`ap-event-badge ap-event-badge--${row.type}`}>
                        {row.typeLabel}
                      </span>
                    </td>
                    <td>{row.points}</td>
                    <td>
                      <span className={`ap-status-badge ap-status-badge--${row.status}`}>
                        {row.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {settlementModel ? (
        <div className="ap-card ap-card-tint">
          <div className="ap-section-head">
            <h2 className="ap-section-title">Model rozliczeń (demo)</h2>
          </div>
          <ul className="vas-checklist">
            <li>
              Sprzedaż VAS: <strong>{formatMoney(settlementModel.totalVasRevenue)}</strong>
            </li>
            <li>
              Prowizja pożyczkodawcy {settlementModel.lenderName} (
              {settlementModel.commissionPercent}%):{' '}
              <strong>{formatMoney(settlementModel.lenderCommissionTotal)}</strong>
            </li>
            <li>
              Punkty Pożyczkodawcy:{' '}
              <strong>{settlementModel.lenderPointsTotal ?? 0}</strong>
            </li>
            <li>
              Pozostałość na platformę:{' '}
              <strong>{formatMoney(settlementModel.platformNetRevenue)}</strong>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
