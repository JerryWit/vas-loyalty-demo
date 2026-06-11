import { LENDER } from './vasCatalog.js'

export const INITIAL_POINTS_HISTORY = [
  {
    id: 'welcome-jan-001',
    clientId: 'c1',
    lenderId: 'ekspres',
    lenderName: LENDER.name,
    points: 20,
    source: 'lender',
    reason: 'Punkty powitalne',
    at: '2026-06-01T08:00:00.000Z',
    expiresAt: null,
  },
]

export function getRedemptionPointsCost(redemption) {
  return redemption.pointsCost ?? redemption.points ?? 0
}

export function getClientStats(
  clientId,
  lenderId,
  { pointsHistory = [], lenderRedemptions = [], pointsByClient = {}, purchases = [] } = {},
) {
  const pointsFromVas = pointsHistory
    .filter((entry) => entry.clientId === clientId && entry.source === 'vas_purchase')
    .reduce((sum, entry) => sum + (entry.points ?? 0), 0)
  const pointsFromLender = pointsHistory
    .filter(
      (entry) =>
        entry.clientId === clientId &&
        entry.source === 'lender' &&
        entry.lenderId === lenderId,
    )
    .reduce((sum, entry) => sum + (entry.points ?? 0), 0)
  const pointsUsed = lenderRedemptions
    .filter((redemption) => redemption.clientId === clientId)
    .reduce((sum, redemption) => sum + getRedemptionPointsCost(redemption), 0)
  const pointsAvailable = pointsByClient[clientId] ?? 0
  const lenderCommissionPoints = purchases
    .filter((purchase) => purchase.clientId === clientId)
    .reduce((sum, purchase) => sum + (purchase.lenderPoints ?? 0), 0)

  return {
    pointsFromVas,
    pointsFromLender,
    pointsUsed,
    pointsAvailable,
    lenderCommissionPoints,
  }
}

export function computePointsByClient(pointsHistory, lenderRedemptions, baseClients) {
  const map = {}
  baseClients.forEach((client) => {
    map[client.id] = 0
  })
  pointsHistory.forEach((entry) => {
    map[entry.clientId] = (map[entry.clientId] ?? 0) + (entry.points ?? 0)
  })
  lenderRedemptions.forEach((redemption) => {
    map[redemption.clientId] =
      (map[redemption.clientId] ?? 0) - getRedemptionPointsCost(redemption)
  })
  return map
}

export function sumPointsHistoryBySource(pointsHistory, source, lenderId = null) {
  return pointsHistory
    .filter((entry) => {
      if (entry.source !== source) return false
      if (lenderId != null && entry.lenderId !== lenderId) return false
      return true
    })
    .reduce((sum, entry) => sum + (entry.points ?? 0), 0)
}

export function groupLenderGrantedPoints(pointsHistory) {
  const map = new Map()
  pointsHistory
    .filter((entry) => entry.source === 'lender')
    .forEach((entry) => {
      const key = entry.lenderId ?? 'unknown'
      const current = map.get(key) ?? {
        lenderId: key,
        lenderName: entry.lenderName ?? key,
        events: 0,
        totalPoints: 0,
        reasons: new Map(),
      }
      current.events += 1
      current.totalPoints += entry.points ?? 0
      const reason = entry.reason ?? '—'
      current.reasons.set(reason, (current.reasons.get(reason) ?? 0) + 1)
      map.set(key, current)
    })

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      reasons: Array.from(group.reasons.entries()).map(([reason, count]) => ({
        reason,
        count,
      })),
    }))
    .sort((a, b) => a.lenderName.localeCompare(b.lenderName))
}

export function buildClientPointsHistoryRows(
  clientId,
  { pointsHistory = [], lenderRedemptions = [] } = {},
) {
  const rows = []

  pointsHistory
    .filter((entry) => entry.clientId === clientId)
    .forEach((entry) => {
      if (entry.source === 'lender') {
        rows.push({
          id: entry.id,
          at: entry.at,
          kind: 'lender',
          badgeLabel: `OD ${entry.lenderName ?? 'Pożyczkodawca'}`,
          eventLabel: entry.reason ?? '—',
          points: entry.points ?? 0,
        })
      } else if (entry.source === 'vas_purchase') {
        rows.push({
          id: entry.id,
          at: entry.at,
          kind: 'vas_purchase',
          badgeLabel: 'ZAKUP VAS',
          eventLabel: entry.reason ?? '—',
          points: entry.points ?? 0,
        })
      }
    })

  lenderRedemptions
    .filter((redemption) => redemption.clientId === clientId)
    .forEach((redemption) => {
      const cost = getRedemptionPointsCost(redemption)
      rows.push({
        id: redemption.id,
        at: redemption.at,
        kind: 'redeem',
        badgeLabel: 'WYMIANA PUNKTÓW',
        eventLabel: redemption.optionLabel ?? 'Wymiana punktów',
        points: -cost,
      })
    })

  return rows.sort((a, b) => new Date(b.at) - new Date(a.at))
}
