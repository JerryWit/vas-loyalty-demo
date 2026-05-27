import { useMemo, useRef, useState } from 'react'
import { VAS_PRODUCTS } from '../data/vasCatalog.js'
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

function getNextMonthFirstDayLabel() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return firstDay.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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

  const productMetaByName = useMemo(
    () => Object.fromEntries(VAS_PRODUCTS.map((p) => [p.name, p])),
    [],
  )

  const salesByProduct = useMemo(() => {
    const map = new Map()
    purchases.forEach((purchase) => {
      const key = purchase.productName ?? purchase.productId ?? 'Nieznany produkt'
      const current = map.get(key) ?? {
        product: key,
        count: 0,
        gross: 0,
        platform: 0,
      }
      current.count += 1
      current.gross += purchase.pricePln ?? 0
      current.platform += purchase.lenderPoints ?? 0
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [purchases])

  const insuranceByTu = useMemo(() => {
    const map = new Map()
    purchases
      .filter((purchase) => purchase.category === 'insurance')
      .forEach((purchase) => {
        const fallbackTu = productMetaByName[purchase.productName]?.tuName
        const tuName = purchase.tuName ?? fallbackTu ?? 'Inne TU'
        if (!map.has(tuName)) {
          map.set(tuName, { tuName, rows: new Map(), policyCount: 0, gross: 0 })
        }
        const tu = map.get(tuName)
        const productKey = purchase.productName ?? purchase.productId ?? 'Nieznany produkt'
        const row = tu.rows.get(productKey) ?? {
          product: productKey,
          count: 0,
          gross: 0,
          platform: 0,
        }
        row.count += 1
        row.gross += purchase.pricePln ?? 0
        row.platform += purchase.lenderPoints ?? 0
        tu.rows.set(productKey, row)
        tu.policyCount += 1
        tu.gross += purchase.pricePln ?? 0
      })

    return Array.from(map.values())
      .map((tu) => ({
        tuName: tu.tuName,
        rows: Array.from(tu.rows.values()).sort((a, b) => b.count - a.count),
        policyCount: tu.policyCount,
        gross: tu.gross,
      }))
      .sort((a, b) => a.tuName.localeCompare(b.tuName))
  }, [purchases, productMetaByName])

  const csvDeadlineLabel = useMemo(() => getNextMonthFirstDayLabel(), [])

  const downloadTuCsv = (tu) => {
    const header = ['Data', 'KlientID', 'Produkt', 'SkladkaBruttoPLN', 'TU']
    const lines = [header.join(';')]
    purchases
      .filter((purchase) => purchase.category === 'insurance')
      .forEach((purchase) => {
        const fallbackTu = productMetaByName[purchase.productName]?.tuName
        const tuName = purchase.tuName ?? fallbackTu ?? 'Inne TU'
        if (tuName !== tu.tuName) return
        lines.push(
          [
            purchase.at ?? '',
            purchase.clientId ?? '',
            purchase.productName ?? '',
            String(purchase.pricePln ?? 0),
            tuName,
          ].join(';'),
        )
      })

    const blob = new Blob([lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `polisy-${tu.tuName.replaceAll(' ', '-').toLowerCase()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
                <th>Produkt</th>
                <th>Liczba sprzedaży</th>
                <th>Przychód</th>
                <th>Przychód platformy</th>
              </tr>
            </thead>
            <tbody>
              {salesByProduct.map((row) => (
                <tr key={row.product}>
                  <td>{row.product}</td>
                  <td>{row.count}</td>
                  <td>{formatMoney(row.gross)}</td>
                  <td>{formatMoney(row.platform)}</td>
                </tr>
              ))}
              <tr className="ap-table-total">
                <td>
                  <strong>Razem</strong>
                </td>
                <td>
                  <strong>{salesByProduct.reduce((sum, row) => sum + row.count, 0)}</strong>
                </td>
                <td>
                  <strong>
                    {formatMoney(salesByProduct.reduce((sum, row) => sum + row.gross, 0))}
                  </strong>
                </td>
                <td>
                  <strong>
                    {formatMoney(salesByProduct.reduce((sum, row) => sum + row.platform, 0))}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="ap-subsection-title">Ubezpieczenia per ubezpieczyciel</h3>
        {insuranceByTu.map((tu) => (
          <div key={tu.tuName}>
            <h4 className="ap-tu-title">{tu.tuName}</h4>
            <div className="ap-table-wrap ap-mb-md">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>Liczba polis</th>
                    <th>Składka brutto</th>
                    <th>Przychód platformy (prowizja agencyjna)</th>
                  </tr>
                </thead>
                <tbody>
                  {tu.rows.map((row) => (
                    <tr key={`${tu.tuName}-${row.product}`}>
                      <td>{row.product}</td>
                      <td>{row.count}</td>
                      <td>{formatMoney(row.gross)}</td>
                      <td>{formatMoney(row.platform)}</td>
                    </tr>
                  ))}
                  <tr className="ap-table-total">
                    <td>
                      <strong>Razem {tu.tuName}</strong>
                    </td>
                    <td>
                      <strong>{tu.policyCount}</strong>
                    </td>
                    <td>
                      <strong>{formatMoney(tu.gross)}</strong>
                    </td>
                    <td>
                      <strong>
                        {formatMoney(tu.rows.reduce((sum, row) => sum + row.platform, 0))}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Rozliczenia z ubezpieczycielami" badge="TU">
        <div className="ap-tu-cards">
          {insuranceByTu.map((tu) => (
            <article key={`settlement-${tu.tuName}`} className="ap-tu-card">
              <h3 className="ap-tu-card-title">{tu.tuName}</h3>
              <ul className="ap-tu-card-list">
                <li>
                  Polisy w tym miesiącu: <strong>{tu.policyCount}</strong>
                </li>
                <li>
                  Składka do odprowadzenia: <strong>{formatMoney(tu.gross)}</strong>
                </li>
                <li>
                  Termin wysyłki CSV: <strong>{csvDeadlineLabel}</strong>
                </li>
              </ul>
              <div className="ap-tu-card-foot">
                <span className="ap-status-badge ap-status-badge--warn">Oczekuje na wysyłkę</span>
                <button
                  type="button"
                  className="vas-btn vas-btn-secondary vas-btn-sm"
                  onClick={() => downloadTuCsv(tu)}
                >
                  Generuj CSV
                </button>
              </div>
            </article>
          ))}
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
