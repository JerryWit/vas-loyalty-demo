import { useMemo, useRef, useState } from 'react'
import { LENDER, VAS_PRODUCTS } from '../data/vasCatalog.js'
import {
  getRedemptionPointsCost,
  groupLenderGrantedPoints,
  sumPointsHistoryBySource,
} from '../data/pointsStats.js'
import './AdminPlatform.css'

const PERIOD_OPTIONS = [
  { id: 'today', label: 'Dziś' },
  { id: 'month', label: 'Ten miesiąc' },
  { id: 'prevMonth', label: 'Poprzedni miesiąc' },
  { id: 'all', label: 'Od początku współpracy' },
]

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

function getNextMonthFirstDayLabel() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return firstDay.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function resolveTuName(purchase, productMetaByName) {
  const fallbackTu = productMetaByName[purchase.productName]?.tuName
  return purchase.tuName ?? fallbackTu ?? 'Inne TU'
}

function isCurrentMonth(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function getPurchasePlatformRevenue(purchase) {
  return purchase.platformRevenue ?? purchase.lenderPoints ?? 0
}

function getCurrentMonthLabel() {
  const now = new Date()
  return now.toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })
}

function buildInsuranceByTu(purchases, productMetaByName) {
  const map = new Map()
  purchases
    .filter((purchase) => purchase.category === 'insurance')
    .forEach((purchase) => {
      const tuName = resolveTuName(purchase, productMetaByName)
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
      row.platform += getPurchasePlatformRevenue(purchase)
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
}

function buildLiveKpis(purchases, pointsHistory, lenderRedemptions, lenderPointsTotal) {
  const uniqueClientIds = new Set(purchases.map((p) => p.clientId).filter(Boolean))
  const loggedIn = uniqueClientIds.size
  const withPurchase = loggedIn
  const conversion =
    loggedIn > 0 ? `${Math.round((withPurchase / loggedIn) * 100)}%` : '0%'
  const pointsGranted = sumPointsHistoryBySource(pointsHistory, 'vas_purchase')
  const pointsGrantedByLenders = sumPointsHistoryBySource(pointsHistory, 'lender')
  const pointsUsed = lenderRedemptions.reduce(
    (s, r) => s + getRedemptionPointsCost(r),
    0,
  )

  return {
    loggedIn: String(loggedIn),
    withPurchase: String(withPurchase),
    conversion,
    pointsGranted: `${pointsGranted} pkt`,
    pointsGrantedByLenders: `${pointsGrantedByLenders} pkt`,
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
  pointsHistory = [],
  lenderRedemptions = [],
  pointsByClient = {},
  lenderPointsTotal = 0,
  baseClients = [],
}) {
  const [period, setPeriod] = useState('month')
  const [eventFilter, setEventFilter] = useState('all')
  const operationsRef = useRef(null)

  const liveKpis = useMemo(
    () => buildLiveKpis(purchases, pointsHistory, lenderRedemptions, lenderPointsTotal),
    [purchases, pointsHistory, lenderRedemptions, lenderPointsTotal],
  )

  const lenderGrantedGroups = useMemo(
    () => groupLenderGrantedPoints(pointsHistory),
    [pointsHistory],
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
      lender: settlementModel?.lenderName ?? LENDER.name,
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
      lender: r.lenderName ?? settlementModel?.lenderName ?? LENDER.name,
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
      current.platform += getPurchasePlatformRevenue(purchase)
      map.set(key, current)
    })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [purchases])

  const telemedicineSalesByProduct = useMemo(
    () =>
      salesByProduct.filter(
        (row) => productMetaByName[row.product]?.category !== 'insurance',
      ),
    [salesByProduct, productMetaByName],
  )

  const insuranceByTu = useMemo(
    () => buildInsuranceByTu(purchases, productMetaByName),
    [purchases, productMetaByName],
  )

  const insuranceSettlementByTu = useMemo(
    () =>
      buildInsuranceByTu(
        purchases.filter((purchase) => isCurrentMonth(purchase.at)),
        productMetaByName,
      ),
    [purchases, productMetaByName],
  )

  const csvDeadlineLabel = useMemo(() => getNextMonthFirstDayLabel(), [])

  const downloadTuCsv = (tu) => {
    const header = ['Data', 'KlientID', 'Produkt', 'SkladkaBruttoPLN', 'TU']
    const lines = [header.join(';')]
    purchases
      .filter(
        (purchase) =>
          purchase.category === 'insurance' && isCurrentMonth(purchase.at),
      )
      .forEach((purchase) => {
        const tuName = resolveTuName(purchase, productMetaByName)
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

  const lenderRows = useMemo(() => {
    const map = new Map()
    purchases.forEach((purchase) => {
      const lenderId = purchase.lenderId ?? 'unknown'
      const lenderName =
        purchase.lenderName ?? settlementModel?.lenderName ?? purchase.lenderId ?? 'Nieznany'
      const current = map.get(lenderId) ?? {
        lenderId,
        name: lenderName,
        activeClients: new Set(),
        purchases: 0,
        sales: 0,
        platform: 0,
        commissionPts: 0,
        conversion: '—',
      }
      if (purchase.clientId) current.activeClients.add(purchase.clientId)
      current.purchases += 1
      current.sales += purchase.pricePln ?? 0
      current.platform += purchase.platformRevenue ?? 0
      current.commissionPts += purchase.lenderPoints ?? 0
      map.set(lenderId, current)
    })

    return Array.from(map.values())
      .map((row) => ({
        ...row,
        active: row.activeClients.size,
      }))
      .sort((a, b) => b.purchases - a.purchases)
  }, [purchases, settlementModel?.lenderName])

  const lenderTotals = useMemo(() => {
    const rows = lenderRows
    return {
      active: rows.reduce((s, r) => s + r.active, 0),
      purchases: rows.reduce((s, r) => s + r.purchases, 0),
      sales: rows.reduce((s, r) => s + r.sales, 0),
      platform: rows.reduce((s, r) => s + r.platform, 0),
      commissionPts: rows.reduce((s, r) => s + r.commissionPts, 0),
      conversion: '—',
    }
  }, [lenderRows])

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

  const netPlatformRevenueValue =
    (settlementModel?.totalPlatformRevenue ?? 0) > 0
      ? formatMoney(settlementModel.totalPlatformRevenue)
      : '0 zł'
  const avgBasketValue =
    purchases.length > 0
      ? formatMoney((settlementModel?.totalVasRevenue ?? 0) / purchases.length)
      : '—'

  const totalVasRevenueValue = formatMoney(settlementModel?.totalVasRevenue ?? 0)

  const kpiRow1 = [
    {
      id: 'sales',
      label: 'Całkowita sprzedaż VAS',
      value: totalVasRevenueValue,
      foot: 'Przychód brutto z usług dodatkowych',
      accent: true,
    },
    {
      id: 'net',
      label: 'Przychód netto platformy',
      value: netPlatformRevenueValue,
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
      value: avgBasketValue,
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
      label: 'Punkty przyznane klientom',
      value: liveKpis.pointsGranted,
      foot: 'Suma z zakupów VAS (pointsHistory)',
    },
    {
      id: 'lender-granted',
      label: 'Punkty nadane przez lenderów',
      value: liveKpis.pointsGrantedByLenders,
      foot: 'Suma nadanych przez pożyczkodawców',
    },
    {
      id: 'used',
      label: 'Punkty wykorzystane',
      value: liveKpis.pointsUsed,
      foot: 'Wymienione na korzyści',
    },
  ]

  const failedWebhookCount = useMemo(
    () => lenderRedemptions.filter((r) => r.status === 'failed').length,
    [lenderRedemptions],
  )
  const expiringPointsDemo = { pts: 45, clients: 3 }
  const csvDeadlineDemo = { days: 8, date: '05.06.2026' }
  const showAlerts = failedWebhookCount > 0 || expiringPointsDemo || csvDeadlineDemo
  const invoiceMonthLabel = useMemo(() => getCurrentMonthLabel(), [])
  const lenderInvoiceRows = useMemo(() => {
    const groups = new Map()
    purchases.forEach((purchase) => {
      const lenderName = purchase.lenderName ?? settlementModel?.lenderName ?? 'Nieznany'
      const category = purchase.category === 'telemedicine' ? 'telemedicine' : 'insurance'
      const key = `${lenderName}::${category}`
      const current = groups.get(key) ?? {
        lenderName,
        category,
        transactions: 0,
        net: 0,
        vat: 0,
        gross: 0,
        document: category === 'telemedicine' ? 'Nota księgowa' : 'Faktura VAT',
      }
      current.transactions += 1
      current.net += purchase.lenderCommissionNet ?? 0
      current.vat += purchase.lenderVat ?? 0
      current.gross += purchase.lenderCommissionGross ?? 0
      groups.set(key, current)
    })
    return Array.from(groups.values()).sort((a, b) => {
      const lenderCmp = a.lenderName.localeCompare(b.lenderName)
      if (lenderCmp !== 0) return lenderCmp
      return a.category.localeCompare(b.category)
    })
  }, [purchases, settlementModel?.lenderName])
  const lenderInvoiceTotals = useMemo(
    () => ({
      transactions: lenderInvoiceRows.reduce((sum, row) => sum + row.transactions, 0),
      net: lenderInvoiceRows.reduce((sum, row) => sum + row.net, 0),
      vat: lenderInvoiceRows.reduce((sum, row) => sum + row.vat, 0),
      gross: lenderInvoiceRows.reduce((sum, row) => sum + row.gross, 0),
    }),
    [lenderInvoiceRows],
  )

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
            {failedWebhookCount > 0 ? (
              <button
                type="button"
                className="ap-alert ap-alert--danger"
                onClick={scrollToOperations}
              >
                <span className="ap-alert-icon" aria-hidden>
                  ⚠
                </span>
                <span>
                  Failed webhooki: <strong>{failedWebhookCount}</strong> — wymagają ręcznej
                  obsługi
                </span>
              </button>
            ) : null}
            {expiringPointsDemo ? (
              <div className="ap-alert ap-alert--warn">
                <span className="ap-alert-icon" aria-hidden>
                  ⏳
                </span>
                <span>
                  Punkty wygasające w ciągu 30 dni:{' '}
                  <strong>
                    {expiringPointsDemo.pts} pkt ({expiringPointsDemo.clients} klientów)
                  </strong>
                  {' '}(przykład — w produkcji z bazy danych)
                </span>
              </div>
            ) : null}
            {csvDeadlineDemo ? (
              <div className="ap-alert ap-alert--warn">
                <span className="ap-alert-icon" aria-hidden>
                  📅
                </span>
                <span>
                  Termin wysyłki CSV do TU: za <strong>{csvDeadlineDemo.days} dni</strong> (do{' '}
                  {csvDeadlineDemo.date}) (przykład)
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
              className={`vas-kpi ap-kpi ${tile.accent ? 'vas-kpi-accent' : ''} ${tile.dark ? 'ap-kpi--dark' : ''}`}
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
              {lenderRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="ap-muted-cell">
                    Brak transakcji w wybranym okresie.
                  </td>
                </tr>
              ) : (
                lenderRows.map((row) => (
                  <tr key={row.lenderId}>
                    <td>
                      <strong>{row.name}</strong>
                    </td>
                    <td>{row.active}</td>
                    <td>{row.purchases}</td>
                    <td>{formatMoney(row.sales)}</td>
                    <td>{formatMoney(row.platform)}</td>
                    <td>{row.commissionPts} pkt</td>
                    <td>{row.conversion}</td>
                  </tr>
                ))
              )}
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
                  <strong>{formatMoney(lenderTotals.sales)}</strong>
                </td>
                <td>
                  <strong>{formatMoney(lenderTotals.platform)}</strong>
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
              {telemedicineSalesByProduct.map((row) => (
                <tr key={row.product}>
                  <td>{row.product}</td>
                  <td>{row.count}</td>
                  <td>{formatMoney(row.gross)}</td>
                  <td>{formatMoney(row.platform)}</td>
                </tr>
              ))}
              <tr className="ap-table-total">
                <td>
                  <strong>Razem Telemedi</strong>
                </td>
                <td>
                  <strong>
                    {telemedicineSalesByProduct.reduce((sum, row) => sum + row.count, 0)}
                  </strong>
                </td>
                <td>
                  <strong>
                    {formatMoney(
                      telemedicineSalesByProduct.reduce((sum, row) => sum + row.gross, 0),
                    )}
                  </strong>
                </td>
                <td>
                  <strong>
                    {formatMoney(
                      telemedicineSalesByProduct.reduce((sum, row) => sum + row.platform, 0),
                    )}
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
          {insuranceSettlementByTu.map((tu) => (
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                background: '#f3f4f6',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  paddingBottom: 10,
                  borderBottom: '1px solid #d1d5db',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                Platforma
              </h3>
              <ul
                className="vas-checklist"
                style={{ margin: 0, padding: 0, listStyle: 'none' }}
              >
                <li style={{ marginBottom: 8, color: '#111827' }}>
                  Sprzedaż VAS (przychód brutto):{' '}
                  <strong>{formatMoney(settlementModel.totalVasRevenue)}</strong>
                </li>
                <li style={{ marginBottom: 8, color: '#111827' }}>
                  Koszt dostawców (Telemedi / TU):{' '}
                  <strong style={{ color: '#dc2626' }}>
                    -{formatMoney(settlementModel.totalProviderCost ?? 0)}
                  </strong>
                </li>
                <li style={{ marginBottom: 12, color: '#111827' }}>
                  Prowizja pożyczkodawców netto:{' '}
                  <strong style={{ color: '#dc2626' }}>
                    -{formatMoney(settlementModel.totalLenderCommissionNet ?? 0)}
                  </strong>
                </li>
              </ul>
              <div
                style={{
                  borderTop: '1px solid #d1d5db',
                  paddingTop: 12,
                  color: '#111827',
                }}
              >
                Przychód platformy (marża):{' '}
                <strong
                  style={{
                    color: '#16a34a',
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {formatMoney(settlementModel.totalPlatformRevenue ?? 0)}
                </strong>
              </div>
            </div>

            <div
              style={{
                background: '#f3f4f6',
                borderRadius: 12,
                padding: '16px 18px',
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  paddingBottom: 10,
                  borderBottom: '1px solid #d1d5db',
                  fontSize: 15,
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                Pożyczkodawcy
              </h3>
              <ul
                className="vas-checklist"
                style={{ margin: 0, padding: 0, listStyle: 'none' }}
              >
                <li style={{ marginBottom: 8, color: '#111827' }}>
                  Prowizja brutto należna pożyczkodawcom:{' '}
                  <strong style={{ color: '#dc2626' }}>
                    {formatMoney(settlementModel.totalLenderCommissionGross ?? 0)}
                  </strong>
                </li>
                <li
                  style={{
                    marginBottom: 6,
                    marginLeft: 16,
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  w tym VAT od prowizji:{' '}
                  <strong style={{ color: '#6b7280', fontWeight: 600 }}>
                    {formatMoney(settlementModel.totalLenderVat ?? 0)}
                  </strong>
                </li>
                <li
                  style={{
                    marginBottom: 8,
                    marginLeft: 16,
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  prowizja netto:{' '}
                  <strong style={{ color: '#6b7280', fontWeight: 600 }}>
                    {formatMoney(settlementModel.totalLenderCommissionNet ?? 0)}
                  </strong>
                </li>
                <li style={{ color: '#111827' }}>
                  Punkty Pożyczkodawcy:{' '}
                  <strong>{settlementModel.lenderPointsTotal ?? 0} pkt</strong>
                </li>
                <li
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  Punkty nadane przez pożyczkodawców:{' '}
                  <strong style={{ color: '#6b7280', fontWeight: 600 }}>
                    {settlementModel.totalLenderGrantedPoints ?? 0} pkt
                  </strong>{' '}
                  (poza modelem prowizyjnym)
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      <SectionCard
        title="Punkty nadane przez pożyczkodawców"
        badge="LENDER GRANTS"
        id="ap-lender-grants"
      >
        {lenderGrantedGroups.length === 0 ? (
          <p className="ap-muted-cell">Brak nadań punktów przez pożyczkodawców.</p>
        ) : (
          <div className="ap-table-wrap ap-mt-md">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Pożyczkodawca</th>
                  <th>Liczba zdarzeń</th>
                  <th>Suma punktów</th>
                  <th>Powody</th>
                </tr>
              </thead>
              <tbody>
                {lenderGrantedGroups.map((group) => (
                  <tr key={group.lenderId}>
                    <td>{group.lenderName}</td>
                    <td>{group.events}</td>
                    <td>{group.totalPoints} pkt</td>
                    <td>
                      {group.reasons
                        .map((item) => `${item.reason} (${item.count})`)
                        .join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Zestawienie do faktur — prowizje pożyczkodawców" badge="FAKTURY">
        <p className="vas-muted vas-text-sm">
          Na podstawie poniższego zestawienia pożyczkodawca wystawia fakturę VAT (usługi
          marketingowe) lub notę księgową (telemedycyna — zwolnienie z VAT).
        </p>
        {lenderInvoiceRows.length === 0 ? (
          <p className="ap-muted-cell">Brak transakcji w wybranym okresie.</p>
        ) : (
          <div className="ap-table-wrap ap-mt-md">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Pożyczkodawca</th>
                  <th>Produkt (kategoria: Telemedycyna / Ubezpieczenia)</th>
                  <th>Liczba transakcji</th>
                  <th>Prowizja netto (zł)</th>
                  <th>VAT 23% (zł)</th>
                  <th>Prowizja brutto (zł)</th>
                  <th>Dokument</th>
                  <th>Okres</th>
                </tr>
              </thead>
              <tbody>
                {lenderInvoiceRows.map((row) => (
                  <tr key={`${row.lenderName}-${row.category}`}>
                    <td>{row.lenderName}</td>
                    <td>
                      {row.category === 'telemedicine'
                        ? 'Telemedycyna'
                        : 'Ubezpieczenia'}
                    </td>
                    <td>{row.transactions}</td>
                    <td>{formatMoney(row.net)}</td>
                    <td>{formatMoney(row.vat)}</td>
                    <td>{formatMoney(row.gross)}</td>
                    <td>{row.document}</td>
                    <td>{invoiceMonthLabel}</td>
                  </tr>
                ))}
                <tr className="ap-table-total">
                  <td>
                    <strong>Razem</strong>
                  </td>
                  <td>
                    <strong>—</strong>
                  </td>
                  <td>
                    <strong>{lenderInvoiceTotals.transactions}</strong>
                  </td>
                  <td>
                    <strong>{formatMoney(lenderInvoiceTotals.net)}</strong>
                  </td>
                  <td>
                    <strong>{formatMoney(lenderInvoiceTotals.vat)}</strong>
                  </td>
                  <td>
                    <strong>{formatMoney(lenderInvoiceTotals.gross)}</strong>
                  </td>
                  <td>
                    <strong>—</strong>
                  </td>
                  <td>
                    <strong>{invoiceMonthLabel}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
