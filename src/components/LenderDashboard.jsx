import { useMemo, useState } from 'react'
import './LenderDashboard.css'

const STATS_ROW_1 = [
  {
    id: 'clients',
    label: 'Klienci aktywni w tym miesiącu',
    foot: 'Klienci aktywni łącznie od początku współpracy',
    value: '1',
    footValue: '1',
  },
  {
    id: 'vas',
    label: 'Zakupy VAS w tym miesiącu',
    foot: 'Łącznie od początku współpracy',
    value: '3',
    footValue: '12',
  },
  {
    id: 'conversion',
    label: 'Konwersja',
    foot: 'Klienci w LoyalVAS vs wszyscy klienci pożyczkodawcy',
    value: '1 z 3',
    footValue: '33%',
  },
]

const STATS_ROW_2 = [
  {
    id: 'granted',
    label: 'Punkty przyznane klientom',
    foot: 'Suma w tym miesiącu',
    value: '65 pkt',
  },
  {
    id: 'used',
    label: 'Punkty wykorzystane przez klientów',
    foot: 'Suma w tym miesiącu',
    value: '70 pkt',
  },
  {
    id: 'commission',
    label: 'Punkty Pożyczkodawcy',
    foot: 'Łącznie od początku współpracy',
    value: '102 pkt',
    accent: true,
  },
]

const CLIENTS = [
  {
    name: 'Jan Kowalski',
    loanNumber: 'SP-1001',
    firstLoginAt: '25.05.2026 17:13',
    daysToRepayment: 8,
    vasCount: 1,
    pointsEarned: 65,
    pointsUsed: 0,
    pointsAvailable: 65,
    commissionPts: 102,
  },
]

const BENEFIT_CHART_DATA = [
  { name: 'Prolongata 30 dni', count: 8 },
  { name: 'Prolongata 14 dni', count: 5 },
  { name: 'Częściowa spłata', count: 2 },
  { name: 'Ekspresowa pożyczka', count: 1 },
]

const CHART_COLORS = ['#1e3a5f', '#2563eb', '#3b82f6', '#60a5fa']

const TRANSACTIONS = [
  {
    date: '25.05.2026 17:13',
    client: 'Jan Kowalski',
    loanNumber: 'SP-1001',
    type: 'purchase',
    typeLabel: 'Zakup VAS',
    points: '+65 pkt',
    commission: '102 pkt',
  },
  {
    date: '20.05.2026 09:45',
    client: 'Jan Kowalski',
    loanNumber: 'SP-1001',
    type: 'prolong',
    typeLabel: 'Wymiana na prolongatę 30 dni',
    points: '−70 pkt',
    commission: '—',
  },
  {
    date: '01.05.2026 00:00',
    client: 'Anna Nowak',
    loanNumber: 'SP-1002',
    type: 'expiry',
    typeLabel: 'Wygaśnięcie punktów',
    points: '−20 pkt',
    commission: '—',
  },
]

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
    points_used: 95,
    requested_value: 500,
  },
]

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

export default function LenderDashboard({ lenderName = 'EkspresPożyczka' }) {
  const [webhookClientId, setWebhookClientId] = useState('SP-1001')
  const [webhookBenefitId, setWebhookBenefitId] = useState('prolongata_30')
  const [webhookVisible, setWebhookVisible] = useState(false)
  const [copyDone, setCopyDone] = useState(false)

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

  return (
    <div className="ld-dashboard">
      <section className="ld-card" aria-labelledby="ld-stats-heading">
        <h2 id="ld-stats-heading" className="vas-sr-only">
          Statystyki
        </h2>
        <div className="ld-kpi-grid">
          {STATS_ROW_1.map((tile) => (
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
          {STATS_ROW_2.map((tile) => (
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
                <th>Punkty zdobyte</th>
                <th>Punkty wykorzystane</th>
                <th>Punkty dostępne</th>
                <th>Punkty Pożyczkodawcy</th>
              </tr>
            </thead>
            <tbody>
              {CLIENTS.map((row) => (
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
                  <td>{row.pointsEarned} pkt</td>
                  <td>{row.pointsUsed} pkt</td>
                  <td>
                    <strong>{row.pointsAvailable} pkt</strong>
                  </td>
                  <td>{row.commissionPts} pkt</td>
                </tr>
              ))}
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
              {TRANSACTIONS.map((row, i) => (
                <tr key={i}>
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
              ))}
            </tbody>
          </table>
        </div>
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
