import { useMemo, useState } from 'react'
import {
  getClientStats,
  getRedemptionPointsCost,
  sumPointsHistoryBySource,
} from '../data/pointsStats.js'
import './LenderDashboard.css'

const STATS_ROW_1_TEMPLATE = [
  {
    id: 'clients',
    label: 'Klienci aktywni w tym miesiącu',
    foot: 'Klienci aktywni łącznie od początku współpracy',
  },
  {
    id: 'vas',
    label: 'Zakupy VAS w tym miesiącu',
    foot: 'Łącznie od początku współpracy',
  },
  {
    id: 'first-login',
    label: 'Pierwsze logowanie do LoyalVAS',
    foot: 'Data pierwszego zakupu VAS klienta pożyczkodawcy',
  },
]

const STATS_ROW_2_TEMPLATE = [
  {
    id: 'granted',
    label: 'Punkty przyznane klientom',
    foot: 'Suma w tym miesiącu',
  },
  {
    id: 'used',
    label: 'Punkty wykorzystane przez klientów',
    foot: 'Suma w tym miesiącu',
  },
  {
    id: 'commission',
    label: 'Punkty Pożyczkodawcy',
    foot: 'Łącznie od początku współpracy',
    accent: true,
  },
]

const BENEFIT_CHART_DATA = [
  { name: 'Prolongata 30 dni', count: 8 },
  { name: 'Prolongata 14 dni', count: 5 },
  { name: 'Częściowa spłata', count: 2 },
  { name: 'Ekspresowa pożyczka', count: 1 },
]

const CHART_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa']

const WEBHOOK_CLIENTS = [
  { id: 'SP-1001', label: 'Jan Kowalski (SP-1001)' },
  { id: 'SP-1002', label: 'Anna Nowak (SP-1002)' },
  { id: 'SP-1003', label: 'Piotr Zieliński (SP-1003)' },
]

const WEBHOOK_BENEFITS = [
  {
    id: 'prolongata_14',
    label: 'Prolongata 14 dni',
    benefit_type: 'prolongata_14',
    points_used: 120,
    requested_value: 14,
  },
  {
    id: 'prolongata_30',
    label: 'Prolongata 30 dni',
    benefit_type: 'prolongata_30',
    points_used: 70,
    requested_value: 30,
  },
  {
    id: 'partial_payment',
    label: 'Częściowa spłata',
    benefit_type: 'partial_payment',
    points_used: 500,
    requested_value: 500,
  },
]

const PROLONG_CATALOG_IDS = new Set(['r1', 'r2', 'r3'])

const GRANT_REASONS = [
  { id: 'powitalne', label: 'Punkty powitalne' },
  { id: 'terminowa_splata', label: 'Terminowa spłata' },
  { id: 'wysoka_kwota', label: 'Wysoka kwota pożyczki' },
  { id: 'kolejna_pozyczka', label: 'Kolejna pożyczka' },
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

function getDaysToRepayment(client, repaymentExtraDays) {
  const extra = repaymentExtraDays[client.id] ?? 0
  return client.repaymentDaysFromToday + extra
}

function SectionHead({ title, badge }) {
  return (
    <div className="ld-section-head">
      <h2 className="ld-section-title">{title}</h2>
      {badge ? <span className="ld-section-badge">{badge}</span> : null}
    </div>
  )
}

function HorizontalBarChart({ data, colors }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <ul className="ld-bar-chart" aria-label="Wykres popularności korzyści">
      {data.map((item, index) => (
        <li key={item.name} className="ld-bar-row">
          <span className="ld-bar-label">{item.name}</span>
          <div className="ld-bar-track" aria-hidden>
            <div
              className="ld-bar-fill"
              style={{
                width: `${(item.count / max) * 100}%`,
                backgroundColor: colors[index % colors.length],
              }}
            />
          </div>
          <span className="ld-bar-value">
            {item.count} {item.count === 1 ? 'wymiana' : 'wymian'}
          </span>
        </li>
      ))}
    </ul>
  )
}

export default function LenderDashboard({
  lenderName = 'QuickLender',
  lenderId = 'ekspres',
  purchases = [],
  pointsHistory = [],
  lenderRedemptions = [],
  pointsByClient = {},
  lenderPointsTotal = 0,
  clientLogins = {},
  repaymentExtraDays = {},
  baseClients = [],
  onGrantLenderPoints,
}) {
  const [webhookClientId, setWebhookClientId] = useState('SP-1001')
  const [webhookBenefitId, setWebhookBenefitId] = useState('prolongata_30')
  const [webhookVisible, setWebhookVisible] = useState(false)
  const [copyDone, setCopyDone] = useState(false)
  const [grantClientId, setGrantClientId] = useState(baseClients[0]?.id ?? '')
  const [grantReason, setGrantReason] = useState('powitalne')
  const [grantPoints, setGrantPoints] = useState(100)
  const [grantSuccessMessage, setGrantSuccessMessage] = useState('')

  const clientById = useMemo(
    () => Object.fromEntries(baseClients.map((c) => [c.id, c])),
    [baseClients],
  )

  const statsContext = useMemo(
    () => ({ pointsHistory, lenderRedemptions, pointsByClient, purchases }),
    [pointsHistory, lenderRedemptions, pointsByClient, purchases],
  )

  const activeClients = useMemo(() => {
    return baseClients
      .filter((c) => (clientLogins[c.id]?.count ?? 0) > 0)
      .map((c) => {
        const clientPurchases = purchases.filter((p) => p.clientId === c.id)
        const stats = getClientStats(c.id, lenderId, statsContext)
        return {
          name: c.name,
          loanNumber: c.loanNumber,
          firstLoginAt: formatTxDate(clientLogins[c.id]?.lastAt),
          daysToRepayment: getDaysToRepayment(c, repaymentExtraDays),
          vasCount: clientPurchases.length,
          pointsFromVas: stats.pointsFromVas,
          pointsGrantedByLender: stats.pointsFromLender,
          pointsUsed: stats.pointsUsed,
          pointsAvailable: stats.pointsAvailable,
          commissionPts: stats.lenderCommissionPoints,
        }
      })
  }, [
    baseClients,
    clientLogins,
    purchases,
    pointsHistory,
    lenderId,
    lenderRedemptions,
    statsContext,
    repaymentExtraDays,
  ])

  const statsRow1 = useMemo(() => {
    const activeCount = activeClients.length
    const vasCount = purchases.length
    const firstPurchaseAt = purchases.reduce((oldest, purchase) => {
      if (!purchase?.at) return oldest
      if (!oldest) return purchase.at
      return new Date(purchase.at) < new Date(oldest) ? purchase.at : oldest
    }, null)
    return [
      {
        ...STATS_ROW_1_TEMPLATE[0],
        value: String(activeCount),
        footValue: String(activeCount),
      },
      {
        ...STATS_ROW_1_TEMPLATE[1],
        value: String(vasCount),
        footValue: String(vasCount),
      },
      {
        ...STATS_ROW_1_TEMPLATE[2],
        value: firstPurchaseAt ? formatTxDate(firstPurchaseAt) : 'Brak aktywności',
      },
    ]
  }, [activeClients.length, purchases])

  const statsRow2 = useMemo(() => {
    const granted = sumPointsHistoryBySource(pointsHistory, 'vas_purchase')
    const used = lenderRedemptions.reduce((s, r) => s + getRedemptionPointsCost(r), 0)
    return [
      { ...STATS_ROW_2_TEMPLATE[0], value: `${granted} pkt` },
      { ...STATS_ROW_2_TEMPLATE[1], value: `${used} pkt` },
      { ...STATS_ROW_2_TEMPLATE[2], value: `${lenderPointsTotal} pkt` },
    ]
  }, [pointsHistory, lenderRedemptions, lenderPointsTotal])

  const lenderGrantedPointsTotal = useMemo(
    () => sumPointsHistoryBySource(pointsHistory, 'lender', lenderId),
    [pointsHistory, lenderId],
  )

  const transactions = useMemo(() => {
    const purchaseRows = purchases.map((p) => {
      const c = clientById[p.clientId]
      return {
        date: formatTxDate(p.at),
        client: c?.name ?? '—',
        loanNumber: c?.loanNumber ?? '—',
        type: 'purchase',
        typeLabel: 'Zakup VAS',
        points: `+${p.pointsEarned ?? 0} pkt`,
        commission: `${p.lenderPoints ?? 0} pkt`,
        at: p.at,
      }
    })
    const grantRows = pointsHistory
      .filter((entry) => entry.source === 'lender' && entry.lenderId === lenderId)
      .map((entry) => {
        const c = clientById[entry.clientId]
        return {
          date: formatTxDate(entry.at),
          client: c?.name ?? '—',
          loanNumber: c?.loanNumber ?? '—',
          type: 'grant',
          typeLabel: 'Punkty nadane',
          points: `+${entry.points ?? 0} pkt`,
          commission: '—',
          at: entry.at,
        }
      })
    const redemptionRows = lenderRedemptions.map((r) => {
      const c = clientById[r.clientId]
      const isProlong = PROLONG_CATALOG_IDS.has(r.catalogId)
      return {
        date: formatTxDate(r.at),
        client: c?.name ?? '—',
        loanNumber: c?.loanNumber ?? '—',
        type: isProlong ? 'prolong' : 'redeem',
        typeLabel: r.optionLabel ?? 'Wymiana punktów',
        points: `−${getRedemptionPointsCost(r)} pkt`,
        commission: '—',
        at: r.at,
      }
    })
    return [...purchaseRows, ...grantRows, ...redemptionRows].sort(
      (a, b) => new Date(b.at) - new Date(a.at),
    )
  }, [purchases, pointsHistory, lenderId, lenderRedemptions, clientById])

  const webhookPayload = useMemo(() => {
    const benefit = WEBHOOK_BENEFITS.find((b) => b.id === webhookBenefitId) ?? WEBHOOK_BENEFITS[1]
    return {
      loan_id: webhookClientId,
      lender_id: 'EKSPRES_PL',
      benefit_type: benefit.benefit_type,
      points_used: benefit.points_used,
      requested_value: benefit.requested_value,
      idempotency_key: `uuid-demo-${webhookClientId}-${benefit.benefit_type}`,
    }
  }, [webhookClientId, webhookBenefitId])

  const webhookJson = JSON.stringify(webhookPayload, null, 2)

  const handleGenerateWebhook = () => {
    setWebhookVisible(true)
    setCopyDone(false)
  }

  const handleCopyWebhook = async () => {
    try {
      await navigator.clipboard.writeText(webhookJson)
      setCopyDone(true)
      setTimeout(() => setCopyDone(false), 2000)
    } catch {
      setCopyDone(false)
    }
  }

  const handleGrantPoints = () => {
    if (!onGrantLenderPoints || !grantClientId) return
    const ok = onGrantLenderPoints(grantClientId, grantPoints, grantReason, lenderId)
    if (ok) {
      setGrantSuccessMessage(
        'Punkty zostały nadane — klient widzi je teraz w swoim portalu.',
      )
      setTimeout(() => setGrantSuccessMessage(''), 4000)
    }
  }

  return (
    <div className="ld-dashboard">
      <section className="ld-card" aria-labelledby="ld-stats-heading">
        <h2 id="ld-stats-heading" className="vas-sr-only">
          Statystyki — {lenderName}
        </h2>
        <div className="ld-kpi-grid">
          {statsRow1.map((tile) => (
            <article key={tile.id} className="vas-kpi ld-kpi">
              <div className="vas-kpi-label">{tile.label}</div>
              <div className="vas-kpi-value">{tile.value}</div>
              <div className="vas-kpi-foot">
                {tile.foot}
                {tile.footValue ? (
                  <>
                    : <strong>{tile.footValue}</strong>
                  </>
                ) : null}
              </div>
            </article>
          ))}
        </div>
        <div className="ld-kpi-grid ld-kpi-grid--row2">
          {statsRow2.map((tile) => (
            <article
              key={tile.id}
              className={`vas-kpi ld-kpi ${tile.accent ? 'vas-kpi-accent' : ''}`}
            >
              <div className="vas-kpi-label">{tile.label}</div>
              <div className="vas-kpi-value">{tile.value}</div>
              <div className="vas-kpi-foot">{tile.foot}</div>
            </article>
          ))}
        </div>
        <div className="ld-kpi-grid ld-kpi-grid--row2">
          <article className="vas-kpi ld-kpi">
            <div className="vas-kpi-label">Punkty nadane przez Ciebie</div>
            <div className="vas-kpi-value">{lenderGrantedPointsTotal} pkt</div>
            <div className="vas-kpi-foot">Łącznie przyznane klientom</div>
          </article>
        </div>
      </section>

      <section className="ld-card" aria-labelledby="ld-clients-heading">
        <SectionHead title="Klienci aktywni w LoyalVAS" badge="CRM" />
        <div className="ld-table-wrap">
          <table className="ld-table">
            <thead>
              <tr>
                <th>Klient</th>
                <th>Numer pożyczki</th>
                <th>Pierwsze logowanie</th>
                <th>Dni do spłaty</th>
                <th>Zakupione VAS</th>
                <th>Punkty z VAS</th>
                <th>Punkty nadane przez {lenderName}</th>
                <th>Punkty wykorzystane</th>
                <th>Punkty dostępne</th>
                <th>Punkty Pożyczkodawcy</th>
              </tr>
            </thead>
            <tbody>
              {activeClients.length === 0 ? (
                <tr>
                  <td colSpan={10} className="ld-empty">
                    Brak klientów z logowaniem w LoyalVAS (demo).
                  </td>
                </tr>
              ) : (
                activeClients.map((row) => (
                  <tr key={row.loanNumber}>
                    <td>
                      <strong className="vas-text-strong">{row.name}</strong>
                    </td>
                    <td>{row.loanNumber}</td>
                    <td className="ld-td-nowrap">{row.firstLoginAt}</td>
                    <td>
                      <span
                        className={
                          row.daysToRepayment < 14 ? 'ld-days-urgent' : undefined
                        }
                      >
                        {row.daysToRepayment}
                      </span>
                    </td>
                    <td>{row.vasCount}</td>
                    <td>{row.pointsFromVas} pkt</td>
                    <td>{row.pointsGrantedByLender} pkt</td>
                    <td>{row.pointsUsed} pkt</td>
                    <td>
                      <strong>{row.pointsAvailable} pkt</strong>
                    </td>
                    <td>{row.commissionPts} pkt</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ld-card" aria-labelledby="ld-chart-heading">
        <SectionHead title="Najpopularniejsze korzyści — od początku współpracy" />
        <div className="ld-chart-wrap">
          <HorizontalBarChart data={BENEFIT_CHART_DATA} colors={CHART_COLORS} />
        </div>
      </section>

      <section className="ld-card" aria-labelledby="ld-tx-heading">
        <SectionHead title="Historia transakcji punktowych" badge="TRANSAKCJE" />
        <div className="ld-table-wrap">
          <table className="ld-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Klient</th>
                <th>Numer pożyczki</th>
                <th>Typ zdarzenia</th>
                <th>Punkty</th>
                <th>Punkty Pożyczkodawcy</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="ld-empty">
                    Brak transakcji.
                  </td>
                </tr>
              ) : (
                transactions.map((row) => (
                  <tr key={`${row.at}-${row.type}-${row.loanNumber}`}>
                    <td className="ld-td-nowrap">{row.date}</td>
                    <td>{row.client}</td>
                    <td>{row.loanNumber}</td>
                    <td>
                      <span className={`ld-event-badge ld-event-badge--${row.type}`}>
                        {row.typeLabel}
                      </span>
                    </td>
                    <td>{row.points}</td>
                    <td>{row.commission}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="ld-card" aria-labelledby="ld-grant-heading">
        <SectionHead title="Nadaj punkty klientowi" badge="DEMO" />
        <p className="ld-webhook-desc">
          Symulacja zdarzenia które Twój system wyśle do LoyalVAS gdy klient zasłuży na punkty (np.
          terminowa spłata, kolejna pożyczka).
        </p>
        <div className="ld-webhook-fields">
          <label className="vas-field">
            <span className="vas-field-label">Wybierz klienta</span>
            <select
              className="vas-input"
              value={grantClientId}
              onChange={(e) => {
                setGrantClientId(e.target.value)
                setGrantSuccessMessage('')
              }}
            >
              {baseClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} ({client.loanNumber})
                </option>
              ))}
            </select>
          </label>
          <label className="vas-field">
            <span className="vas-field-label">Powód</span>
            <select
              className="vas-input"
              value={grantReason}
              onChange={(e) => {
                setGrantReason(e.target.value)
                setGrantSuccessMessage('')
              }}
            >
              {GRANT_REASONS.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>
          <label className="vas-field">
            <span className="vas-field-label">Liczba punktów</span>
            <input
              className="vas-input"
              type="number"
              min={1}
              value={grantPoints}
              onChange={(e) => {
                setGrantPoints(Math.max(1, Number(e.target.value) || 0))
                setGrantSuccessMessage('')
              }}
            />
          </label>
        </div>
        <button type="button" className="vas-btn vas-btn-secondary" onClick={handleGrantPoints}>
          Nadaj punkty
        </button>
        {grantSuccessMessage ? (
          <p
            className="vas-mt-md"
            style={{
              background: '#16a34a',
              color: '#ffffff',
              borderRadius: 8,
              padding: '10px 12px',
            }}
            role="status"
          >
            {grantSuccessMessage}
          </p>
        ) : null}
      </section>

      <section className="ld-card" aria-labelledby="ld-webhook-heading">
        <SectionHead title="Symulacja webhooka prolongaty" badge="DEMO" />
        <p className="ld-webhook-desc">
          Tak wygląda żądanie które LoyalVAS wyśle do Twojego systemu gdy klient wymieni punkty na
          korzyść. Przekaż ten przykład swojemu deweloperowi.
        </p>
        <div className="ld-webhook-fields">
          <label className="vas-field">
            <span className="vas-field-label">Wybierz klienta</span>
            <select
              className="vas-input"
              value={webhookClientId}
              onChange={(e) => {
                setWebhookClientId(e.target.value)
                setWebhookVisible(false)
              }}
            >
              {WEBHOOK_CLIENTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="vas-field">
            <span className="vas-field-label">Wybierz korzyść</span>
            <select
              className="vas-input"
              value={webhookBenefitId}
              onChange={(e) => {
                setWebhookBenefitId(e.target.value)
                setWebhookVisible(false)
              }}
            >
              {WEBHOOK_BENEFITS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="vas-btn vas-btn-secondary"
          onClick={handleGenerateWebhook}
        >
          Generuj przykład webhooka
        </button>
        {webhookVisible ? (
          <div className="ld-webhook-output">
            <pre className="ld-webhook-code">{webhookJson}</pre>
            <button type="button" className="vas-btn vas-btn-ghost" onClick={handleCopyWebhook}>
              {copyDone ? 'Skopiowano' : 'Kopiuj'}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
