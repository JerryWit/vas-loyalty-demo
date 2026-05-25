import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import LoginSMS from './components/LoginSMS.jsx'
import './App.css'

const STORAGE_KEY = 'vas-eksprespozyczka-demo-v1'
const STORAGE_KEY_LEGACY = 'vas-smartpozyczka-demo-v1'

const LENDER = {
  name: 'EkspresPożyczka',
  commissionPercent: 25,
  portalUrl: 'https://www.eksprespozyczka.pl/demo-portal',
}

const BASE_CLIENTS = [
  {
    id: 'c1',
    name: 'Jan Kowalski',
    loanNumber: 'SP-1001',
    loanAmount: 2500,
    basePoints: 120,
    /** Dni do terminu spłaty (demo, liczone od dziś). */
    repaymentDaysFromToday: 5,
  },
  {
    id: 'c2',
    name: 'Anna Nowak',
    loanNumber: 'SP-1002',
    loanAmount: 1800,
    basePoints: 60,
    repaymentDaysFromToday: 12,
  },
  {
    id: 'c3',
    name: 'Piotr Zieliński',
    loanNumber: 'SP-1003',
    loanAmount: 3200,
    basePoints: 0,
    repaymentDaysFromToday: 3,
  },
]

/** Kwota do spłaty = kwota pożyczki + 15% (demo). */
function getRepaymentAmountPln(client) {
  return Math.round(client.loanAmount * 1.15)
}

/** W portalu pożyczkodawcy: tylko przedłużenia 14 i 30 dni (7 dni konfigurowane w panelu admin). */
const LENDER_PORTAL_PROLONGATION_IDS = ['r2', 'r3']

const PROLONGATION_DAYS_BY_CATALOG = {
  r1: 7,
  r2: 14,
  r3: 30,
}

const VAS_PRODUCTS = [
  {
    id: 'p1',
    name: 'Telemedycyna',
    packageLabel: 'Pakiet 1 miesiąc',
    description: '20 telekonsultacji, badania krwi i obrazowe.',
    pricePln: 850,
    pointsReward: 85,
    icon: '🩺',
  },
  {
    id: 'p2',
    name: 'Assistance Domowy',
    packageLabel: 'Pakiet 6 miesięcy',
    description: 'Hydraulik, elektryk, ślusarz — interwencja w domu.',
    pricePln: 350,
    pointsReward: 35,
    icon: '🏠',
  },
  {
    id: 'p3',
    name: 'Ochrona Pupil',
    packageLabel: 'Pakiet półroczny',
    description: 'Ubezpieczenie weterynaryjne i assistance dla zwierząt.',
    pricePln: 650,
    pointsReward: 65,
    icon: '🐾',
  },
]

/** Tabela informacyjna — przelicznik pożyczkodawcy (tylko odczyt, bez akcji po stronie platformy). */
const LENDER_POINTS_CATALOG = [
  {
    id: 'r1',
    label: 'Przedłużenie raty o 7 dni',
    pointsCost: 70,
  },
  {
    id: 'r2',
    label: 'Przedłużenie raty o 14 dni',
    pointsCost: 120,
  },
  {
    id: 'r3',
    label: 'Przedłużenie raty o 30 dni',
    pointsCost: 180,
  },
  {
    id: 'r4',
    label: 'Obniżenie kosztu pożyczki',
    pointsCost: 100,
  },
  {
    id: 'r5',
    label: 'Spłata częściowa 500 zł',
    pointsCost: 95,
  },
]

const HOME_OFFER_HIGHLIGHTS = [
  { icon: '🛡️', title: 'Ubezpieczenia' },
  { icon: '🩺', title: 'Telemedycyna' },
  { icon: '🌍', title: 'Kursy językowe' },
  { icon: '⚖️', title: 'Pomoc prawna' },
  { icon: '🔒', title: 'Bezpieczny BIK' },
  { icon: '🏠', title: 'Assistance domowy' },
  { icon: '🐾', title: 'Ochrona pupila' },
  { icon: '💼', title: 'Pakiety zdrowotne i wellbeing' },
]

const LOYALTY_HOME_PERKS = [
  { icon: '📊', text: 'Kalkulator: na co stać Twoje punkty (informacyjnie)' },
  { icon: '🏦', text: 'Wykorzystanie punktów wyłącznie w portalu pożyczkodawcy' },
  { icon: '🔒', text: 'Platforma nie zmienia warunków umowy — tylko ewidencja' },
  { icon: '🎁', text: 'Punkty za zakupy VAS naliczane automatycznie' },
]

const OFFER_CATEGORIES = [
  {
    id: 'insurance',
    title: 'Ubezpieczenia',
    icon: '🛡️',
    desc: 'Życie, NNW, mieszkanie, OC/AC — dopasowane do Twoich potrzeb.',
    tags: ['Życie', 'NNW', 'Mieszkanie'],
  },
  {
    id: 'health',
    title: 'Opieka zdrowotna',
    icon: '🩺',
    desc: 'Telemedycyna, badania, opieka stomatologiczna i specjalistyczna.',
    tags: ['Telemedycyna', 'Badania', 'Stomatologia'],
  },
  {
    id: 'legal',
    title: 'Pomoc prawna',
    icon: '⚖️',
    desc: 'Konsultacje prawne, wzory umów, wsparcie w sporach konsumenckich.',
    tags: ['Konsultacje', 'Umowy', 'Spory'],
  },
  {
    id: 'home',
    title: 'Assistance domowy',
    icon: '🏠',
    desc: 'Hydraulik, elektryk, ślusarz — szybka interwencja w domu.',
    tags: ['Awaria', '24/7', 'Dom'],
  },
  {
    id: 'pets',
    title: 'Ochrona pupila',
    icon: '🐾',
    desc: 'Ubezpieczenie weterynaryjne i assistance dla zwierząt.',
    tags: ['Weterynarz', 'Assistance'],
  },
  {
    id: 'education',
    title: 'Nauka języków obcych',
    icon: '🌍',
    desc: 'Kursy online, lekcje z lektorem, materiały do samodzielnej nauki.',
    tags: ['Angielski', 'Online', 'Lektor'],
  },
]

const ROLE_NAV = [
  {
    id: 'client',
    label: 'Portal Klienta',
    short: 'Klient',
    icon: '👤',
    desc: 'Tylko własne konto pożyczkobiorcy',
  },
  {
    id: 'lender',
    label: 'Panel Pożyczkodawcy',
    short: 'Lender',
    icon: '🏦',
    desc: `Klienci i VAS partnera ${LENDER.name}`,
  },
  {
    id: 'admin',
    label: 'Admin Platformy',
    short: 'Admin',
    icon: '⚙️',
    desc: 'Pełny widok operatora platformy',
  },
]

function loadPersisted() {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ??
      localStorage.getItem(STORAGE_KEY_LEGACY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function buildInitialState() {
  const persisted = loadPersisted()
  const pointsByClient = {}
  BASE_CLIENTS.forEach((c) => {
    pointsByClient[c.id] =
      persisted?.pointsByClient?.[c.id] ?? c.basePoints
  })
  const rawLogins = persisted?.clientLogins
  const rawObj =
    rawLogins && typeof rawLogins === 'object' && !Array.isArray(rawLogins)
      ? rawLogins
      : {}
  const clientLogins = {}
  BASE_CLIENTS.forEach((c) => {
    const e = rawObj[c.id]
    const count = Number(e?.count) || 0
    if (count > 0 && e?.lastAt) {
      clientLogins[c.id] = { lastAt: e.lastAt, count }
    }
  })
  let lenderRedemptions = Array.isArray(persisted?.lenderRedemptions)
    ? persisted.lenderRedemptions
    : []
  if (lenderRedemptions.length === 0 && Array.isArray(persisted?.benefitUses)) {
    lenderRedemptions = persisted.benefitUses.map((b) => ({
      id: b.id ?? uid(),
      clientId: b.clientId,
      points: b.costPoints ?? 0,
      lenderName: LENDER.name,
      optionLabel: b.title ?? 'Wykorzystanie punktów',
      at: b.at ?? new Date().toISOString(),
      source: 'lender_api_confirm',
    }))
  }
  const repaymentExtraDays =
    persisted?.repaymentExtraDays &&
    typeof persisted.repaymentExtraDays === 'object'
      ? persisted.repaymentExtraDays
      : {}

  return {
    pointsByClient,
    purchases: Array.isArray(persisted?.purchases) ? persisted.purchases : [],
    lenderRedemptions,
    clientLogins,
    repaymentExtraDays,
  }
}

function formatMoney(n) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso) {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function startOfDay(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatDateOnly(d) {
  return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long' }).format(d)
}

function getRepaymentDate(client, extraDays = 0) {
  const d = startOfDay(new Date())
  d.setDate(d.getDate() + client.repaymentDaysFromToday + extraDays)
  return d
}

function daysFromVisitToRepayment(client, visitAtIso, extraDays = 0) {
  const visit = startOfDay(visitAtIso ? new Date(visitAtIso) : new Date())
  const repay = startOfDay(getRepaymentDate(client, extraDays))
  return Math.max(0, Math.ceil((repay - visit) / 86400000))
}

function getPortalRedemptionRows({ prolongationIds = ['r1', 'r2', 'r3'] } = {}) {
  const alwaysIds = ['r4', 'r5']
  const prolongIds = ['r1', 'r2', 'r3']

  return LENDER_POINTS_CATALOG.map((item) => {
    const isProlongation = prolongIds.includes(item.id)
    const allowed = isProlongation
      ? prolongationIds.includes(item.id)
      : alwaysIds.includes(item.id)
    return { ...item, allowed }
  })
}

function commissionOnPrice(pricePln) {
  return Math.round((pricePln * LENDER.commissionPercent) / 100)
}

function commissionPointsOnPurchase(pointsEarned) {
  return Math.round((pointsEarned * LENDER.commissionPercent) / 100)
}

export default function App() {
  const [role, setRole] = useState('client')
  const [loanLogin, setLoanLogin] = useState('')
  const [loginError, setLoginError] = useState('')
  const [clientSessionId, setClientSessionId] = useState(null)
  const [clientScreen, setClientScreen] = useState('home')
  const [loginMode, setLoginMode] = useState('loan')
  const [toast, setToast] = useState(null)

  const [pointsByClient, setPointsByClient] = useState(() =>
    buildInitialState().pointsByClient,
  )
  const [purchases, setPurchases] = useState(() => buildInitialState().purchases)
  const [lenderRedemptions, setLenderRedemptions] = useState(
    () => buildInitialState().lenderRedemptions,
  )
  const [clientLogins, setClientLogins] = useState(
    () => buildInitialState().clientLogins,
  )
  const [lenderApiDemoClientId, setLenderApiDemoClientId] = useState(
    () => BASE_CLIENTS[0]?.id ?? '',
  )
  const [lenderApiDemoOptionId, setLenderApiDemoOptionId] = useState(
    () => LENDER_POINTS_CATALOG[0]?.id ?? '',
  )
  const [repaymentExtraDays, setRepaymentExtraDays] = useState(
    () => buildInitialState().repaymentExtraDays,
  )
  const [lenderPortalClientId, setLenderPortalClientId] = useState(null)
  const [lenderPortalVisitAt, setLenderPortalVisitAt] = useState(null)
  const [lenderPortalSelectedId, setLenderPortalSelectedId] = useState('')
  const [lenderPortalLoanLogin, setLenderPortalLoanLogin] = useState('')
  const [lenderPortalLoginError, setLenderPortalLoginError] = useState('')

  const persist = useCallback(
    (nextPoints, nextPurchases, nextRedemptions, nextLogins, nextRepaymentExtra) => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pointsByClient: nextPoints,
          purchases: nextPurchases,
          lenderRedemptions: nextRedemptions,
          clientLogins: nextLogins,
          repaymentExtraDays: nextRepaymentExtra,
        }),
      )
    },
    [],
  )

  useEffect(() => {
    persist(
      pointsByClient,
      purchases,
      lenderRedemptions,
      clientLogins,
      repaymentExtraDays,
    )
  }, [
    pointsByClient,
    purchases,
    lenderRedemptions,
    clientLogins,
    repaymentExtraDays,
    persist,
  ])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3200)
  }, [])

  const sessionClient = useMemo(
    () => BASE_CLIENTS.find((c) => c.id === clientSessionId) ?? null,
    [clientSessionId],
  )

  const pointsSession = sessionClient
    ? pointsByClient[sessionClient.id] ?? sessionClient.basePoints
    : 0

  const lenderPortalClient = useMemo(() => {
    if (!lenderPortalClientId) return null
    return BASE_CLIENTS.find((c) => c.id === lenderPortalClientId) ?? null
  }, [lenderPortalClientId])

  const lenderPortalExtra = lenderPortalClient
    ? repaymentExtraDays[lenderPortalClient.id] ?? 0
    : 0

  const lenderPortalPoints = lenderPortalClient
    ? pointsByClient[lenderPortalClient.id] ?? lenderPortalClient.basePoints
    : 0

  const portalRedemptionRows = useMemo(() => {
    if (!lenderPortalClient) return []
    return getPortalRedemptionRows({
      prolongationIds: LENDER_PORTAL_PROLONGATION_IDS,
    })
  }, [lenderPortalClient])

  const lenderPortalDaysLeft = lenderPortalClient
    ? daysFromVisitToRepayment(
        lenderPortalClient,
        lenderPortalVisitAt ?? new Date().toISOString(),
        lenderPortalExtra,
      )
    : 0

  const lenderPortalRepaymentDate = lenderPortalClient
    ? getRepaymentDate(lenderPortalClient, lenderPortalExtra)
    : null

  /** Kalkulator VAS: prolongaty 14 i 30 dni (jak w portalu pożyczkodawcy). */
  const clientCalculatorRows = useMemo(() => {
    if (!sessionClient) return []
    return getPortalRedemptionRows({
      prolongationIds: LENDER_PORTAL_PROLONGATION_IDS,
    })
  }, [sessionClient])

  const clientPurchases = useMemo(() => {
    if (!clientSessionId) return []
    return purchases
      .filter((p) => p.clientId === clientSessionId)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [purchases, clientSessionId])

  const myProductsGrouped = useMemo(() => {
    const map = {}
    clientPurchases.forEach((p) => {
      if (!map[p.productId]) {
        map[p.productId] = {
          productId: p.productId,
          name: p.productName,
          count: 0,
          lastAt: p.at,
        }
      }
      map[p.productId].count += 1
      if (new Date(p.at) > new Date(map[p.productId].lastAt)) {
        map[p.productId].lastAt = p.at
      }
    })
    return Object.values(map).sort((a, b) => b.lastAt.localeCompare(a.lastAt))
  }, [clientPurchases])

  const purchaseHistoryOnly = useMemo(() => {
    return clientPurchases.map((p) => ({
      id: p.id,
      at: p.at,
      productName: p.productName,
      pricePln: p.pricePln,
      pointsEarned: p.pointsEarned,
    }))
  }, [clientPurchases])

  const clientActivityTimeline = useMemo(() => {
    if (!clientSessionId) return []
    return purchases
      .filter((p) => p.clientId === clientSessionId)
      .map((p) => ({
        kind: 'purchase',
        at: p.at,
        label: `Zakup: ${p.productName}`,
        detail: `${formatMoney(p.pricePln)} · +${p.pointsEarned} pkt`,
      }))
      .sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [purchases, clientSessionId])

  const clientRedemptionHistory = useMemo(() => {
    if (!clientSessionId) return []
    return lenderRedemptions
      .filter((r) => r.clientId === clientSessionId)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
  }, [lenderRedemptions, clientSessionId])

  const totalVasRevenue = useMemo(
    () => purchases.reduce((s, p) => s + p.pricePln, 0),
    [purchases],
  )

  const lenderCommissionTotal = useMemo(
    () => Math.round((totalVasRevenue * LENDER.commissionPercent) / 100),
    [totalVasRevenue],
  )

  const platformNetRevenue = useMemo(
    () => Math.max(0, totalVasRevenue - lenderCommissionTotal),
    [totalVasRevenue, lenderCommissionTotal],
  )

  const productStats = useMemo(() => {
    const map = {}
    VAS_PRODUCTS.forEach((pr) => {
      map[pr.id] = { ...pr, count: 0, revenue: 0 }
    })
    purchases.forEach((p) => {
      if (!map[p.productId]) return
      map[p.productId].count += 1
      map[p.productId].revenue += p.pricePln
    })
    return Object.values(map)
  }, [purchases])

  const loggedInClientCount = useMemo(() => {
    return BASE_CLIENTS.filter((c) => (clientLogins[c.id]?.count ?? 0) > 0).length
  }, [clientLogins])

  const totalPointsRedeemed = useMemo(
    () => lenderRedemptions.reduce((s, r) => s + r.points, 0),
    [lenderRedemptions],
  )

  const totalVasPointsEarned = useMemo(
    () => purchases.reduce((s, p) => s + p.pointsEarned, 0),
    [purchases],
  )

  const lenderCommissionPointsTotal = useMemo(
    () =>
      purchases.reduce(
        (s, p) => s + commissionPointsOnPurchase(p.pointsEarned),
        0,
      ),
    [purchases],
  )

  const lenderPortalRows = useMemo(() => {
    return BASE_CLIENTS.map((c) => {
      const clientPurch = purchases.filter((x) => x.clientId === c.id)
      const pointsEarnedFromVas = clientPurch.reduce(
        (s, x) => s + x.pointsEarned,
        0,
      )
      const commissionPointsFromVas = clientPurch.reduce(
        (s, x) => s + commissionPointsOnPurchase(x.pointsEarned),
        0,
      )
      const pointsAvailable = pointsByClient[c.id] ?? c.basePoints
      const redemptionsForClient = lenderRedemptions.filter(
        (r) => r.clientId === c.id,
      )
      const redemptionCount = redemptionsForClient.length
      const pointsSpentOnRedemptions = redemptionsForClient.reduce(
        (s, r) => s + r.points,
        0,
      )
      const login = clientLogins[c.id]
      const sessionActiveHere = clientSessionId === c.id
      return {
        ...c,
        pointsEarnedFromVas,
        commissionPointsFromVas,
        pointsAvailable,
        purchaseCount: clientPurch.length,
        redemptionCount,
        pointsSpentOnRedemptions,
        lastLoginAt: login?.lastAt ?? null,
        loginCount: login?.count ?? 0,
        sessionActiveHere,
      }
    })
  }, [
    purchases,
    pointsByClient,
    lenderRedemptions,
    clientLogins,
    clientSessionId,
  ])

  const lenderPurchaseHistory = useMemo(() => {
    return [...purchases]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .map((row) => {
        const cl = BASE_CLIENTS.find((c) => c.id === row.clientId)
        return {
          ...row,
          clientName: cl?.name ?? '—',
          loanNumber: cl?.loanNumber ?? '—',
          commissionPoints: commissionPointsOnPurchase(row.pointsEarned),
        }
      })
  }, [purchases])

  const handleLoanLogin = (e) => {
    e.preventDefault()
    const norm = loanLogin.trim().toUpperCase()
    const found = BASE_CLIENTS.find(
      (c) => c.loanNumber.toUpperCase() === norm,
    )
    if (!found) {
      setLoginError(
        'Nieprawidłowy numer pożyczki. Sprawdź dane i spróbuj ponownie.',
      )
      return
    }
    setLoginError('')
    setClientSessionId(found.id)
    setLoanLogin('')
    setClientLogins((prev) => ({
      ...prev,
      [found.id]: {
        lastAt: new Date().toISOString(),
        count: (prev[found.id]?.count ?? 0) + 1,
      },
    }))
    showToast(`Witaj, ${found.name.split(' ')[0]}.`)
  }

  const handleSmsLoginSuccess = ({ loanNumber }) => {
    const norm = loanNumber.trim().toUpperCase()
    const found = BASE_CLIENTS.find(
      (c) => c.loanNumber.toUpperCase() === norm,
    )
    if (!found) {
      setLoginError(
        'Nieprawidłowy numer pożyczki. Sprawdź dane i spróbuj ponownie.',
      )
      return
    }
    setLoginError('')
    setClientSessionId(found.id)
    setClientLogins((prev) => ({
      ...prev,
      [found.id]: {
        lastAt: new Date().toISOString(),
        count: (prev[found.id]?.count ?? 0) + 1,
      },
    }))
    showToast(`Witaj, ${found.name.split(' ')[0]}.`)
  }

  const logoutClient = () => {
    setClientSessionId(null)
    setClientScreen('home')
    setLoanLogin('')
    setLoginError('')
    showToast('Wylogowano z portalu klienta.')
  }

  const buyProduct = (product) => {
    if (!sessionClient) {
      showToast('Zaloguj się numerem pożyczki.', 'warn')
      return
    }
    const entry = {
      id: uid(),
      clientId: sessionClient.id,
      productId: product.id,
      productName: product.name,
      pricePln: product.pricePln,
      pointsEarned: product.pointsReward,
      at: new Date().toISOString(),
    }
    setPurchases((prev) => [entry, ...prev])
    setPointsByClient((prev) => ({
      ...prev,
      [sessionClient.id]:
        (prev[sessionClient.id] ?? 0) + product.pointsReward,
    }))
    showToast(`Dodano ${product.name}. +${product.pointsReward} pkt.`)
  }

  const openLenderPortal = () => {
    setLenderPortalVisitAt(new Date().toISOString())
    setLenderPortalSelectedId('')
    setLenderPortalLoginError('')
    if (clientSessionId) setLenderPortalClientId(clientSessionId)
    setClientScreen('lender-portal')
  }

  const leaveLenderPortal = () => {
    setClientScreen('home')
    setLenderPortalSelectedId('')
    setLenderPortalLoginError('')
  }

  const handleLenderPortalLogin = (e) => {
    e.preventDefault()
    const norm = lenderPortalLoanLogin.trim().toUpperCase()
    const found = BASE_CLIENTS.find(
      (c) => c.loanNumber.toUpperCase() === norm,
    )
    if (!found) {
      setLenderPortalLoginError('Nieprawidłowy numer pożyczki.')
      return
    }
    setLenderPortalLoginError('')
    setLenderPortalClientId(found.id)
    setLenderPortalVisitAt(new Date().toISOString())
    setLenderPortalSelectedId('')
    setLenderPortalLoanLogin('')
  }

  /** Demo: symulacja potwierdzenia wykorzystania punktów przez API pożyczkodawcy. */
  const confirmRedemptionViaLenderApi = (clientId, catalogId, options = {}) => {
    const { silent = false } = options
    const option = LENDER_POINTS_CATALOG.find((o) => o.id === catalogId)
    const client = BASE_CLIENTS.find((c) => c.id === clientId)
    if (!option || !client) return false
    const row = getPortalRedemptionRows({
      prolongationIds: LENDER_PORTAL_PROLONGATION_IDS,
    }).find((r) => r.id === catalogId)
    if (row && !row.allowed) {
      if (!silent) showToast('Opcja niedostępna w tym kanale.', 'warn')
      return false
    }
    const bal = pointsByClient[clientId] ?? client.basePoints
    if (bal < option.pointsCost) {
      if (!silent) {
        showToast(
          `Niewystarczające saldo (${bal} pkt) dla „${option.label}”.`,
          'warn',
        )
      }
      return false
    }
    setLenderRedemptions((prev) => [
      {
        id: uid(),
        clientId,
        points: option.pointsCost,
        lenderName: LENDER.name,
        optionLabel: option.label,
        at: new Date().toISOString(),
        source: 'lender_api_confirm',
      },
      ...prev,
    ])
    setPointsByClient((prev) => ({
      ...prev,
      [clientId]: (prev[clientId] ?? client.basePoints) - option.pointsCost,
    }))
    const prolongDays = PROLONGATION_DAYS_BY_CATALOG[catalogId] ?? 0
    if (prolongDays > 0) {
      setRepaymentExtraDays((prev) => ({
        ...prev,
        [clientId]: (prev[clientId] ?? 0) + prolongDays,
      }))
    }
    if (!silent) {
      showToast(
        `API: zapisano wykorzystanie ${option.pointsCost} pkt — ${client.name}.`,
      )
    }
    return true
  }

  const submitLenderPortalRedemption = () => {
    if (!lenderPortalClient || !lenderPortalSelectedId) {
      showToast('Wybierz opcję wykorzystania punktów.', 'warn')
      return
    }
    const ok = confirmRedemptionViaLenderApi(
      lenderPortalClient.id,
      lenderPortalSelectedId,
      { silent: true },
    )
    if (ok) {
      setLenderPortalSelectedId('')
      showToast('Wykorzystano punkty. Zmiana warunków zapisana w umowie (demo).')
    }
  }

  const resetDemo = () => {
    const next = {}
    BASE_CLIENTS.forEach((c) => {
      next[c.id] = c.basePoints
    })
    setPointsByClient(next)
    setPurchases([])
    setLenderRedemptions([])
    setRepaymentExtraDays({})
    setClientLogins({})
    setClientSessionId(null)
    setLenderPortalClientId(null)
    setLenderPortalVisitAt(null)
    setLenderPortalSelectedId('')
    setClientScreen('home')
    setLoanLogin('')
    setLoginError('')
    localStorage.removeItem(STORAGE_KEY)
    showToast('Przywrócono dane demo.')
  }

  const switchRole = (next) => {
    setRole(next)
    setLoginError('')
    if (next === 'client' && !clientSessionId) setClientScreen('home')
  }

  const roleMeta = ROLE_NAV.find((r) => r.id === role)

  return (
    <div className="vas-app">
      <header className="vas-topbar">
        <div className="vas-brand">
          <div className="vas-logo" aria-hidden>
            VAS
          </div>
          <div>
            <div className="vas-brand-title">VAS Loyalty</div>
            <div className="vas-brand-sub">
              {role === 'client' && clientScreen === 'lender-portal'
                ? `Symulacja portalu · ${LENDER.name}`
                : role === 'client'
                  ? clientSessionId
                    ? 'Portal Klienta · tylko Twoje konto'
                    : 'Strona główna · wybierz ścieżkę'
                  : `${roleMeta?.label ?? ''} · demo (osobny widok)`}
            </div>
          </div>
        </div>
        {clientScreen !== 'lender-portal' ? (
          <nav className="vas-nav" aria-label="Wybór widoku demo — osobne role">
            {ROLE_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`vas-nav-btn ${role === item.id ? 'is-active' : ''}`}
                onClick={() => switchRole(item.id)}
                title={item.desc}
              >
                <span className="vas-nav-ico">{item.icon}</span>
                <span className="vas-nav-label-full">{item.label}</span>
                <span className="vas-nav-label-short">{item.short}</span>
              </button>
            ))}
          </nav>
        ) : null}
        <div className="vas-topbar-actions">
          {role === 'client' && !clientSessionId ? (
            <div
              className="vas-login-mode-toggle"
              role="group"
              aria-label="Tryb logowania"
            >
              <button
                type="button"
                className={`vas-login-mode-btn ${loginMode === 'loan' ? 'is-active' : ''}`}
                onClick={() => setLoginMode('loan')}
              >
                Logowanie: Pożyczka
              </button>
              <button
                type="button"
                className={`vas-login-mode-btn ${loginMode === 'sms' ? 'is-active' : ''}`}
                onClick={() => setLoginMode('sms')}
              >
                Logowanie: SMS
              </button>
            </div>
          ) : null}
          {role === 'client' && clientScreen === 'lender-portal' ? (
            <button type="button" className="vas-btn vas-btn-ghost" onClick={leaveLenderPortal}>
              ← Program VAS
            </button>
          ) : null}
          {role === 'client' && clientSessionId && clientScreen !== 'lender-portal' ? (
            <button type="button" className="vas-btn vas-btn-ghost" onClick={logoutClient}>
              Wyloguj
            </button>
          ) : null}
          <Link to="/admin" className="vas-btn vas-btn-ghost vas-admin-config-link">
            Konfiguracja LoyalVAS
          </Link>
          <button type="button" className="vas-btn vas-btn-ghost" onClick={resetDemo}>
            Reset demo
          </button>
        </div>
      </header>

      {role === 'client' && clientScreen === 'lender-portal' ? (
        <main className="vas-lender-portal-wrap">
          <div className="vas-lender-portal-shell">
            <header className="vas-lender-portal-head">
              <div className="vas-lender-portal-logo">{LENDER.name}</div>
              <p className="vas-lender-portal-tagline">Portal klienta · obsługa pożyczki</p>
            </header>

            {!lenderPortalClient ? (
              <section className="vas-lender-portal-card">
                <h1 className="vas-h2">Zaloguj się do pożyczki</h1>
                <p className="vas-muted vas-mb-md">
                  Aby wykorzystać punkty lojalnościowe, potwierdź numer pożyczki. Saldo punktów
                  pobierzemy z platformy VAS (symulacja API).
                </p>
                <form className="vas-login-form" onSubmit={handleLenderPortalLogin}>
                  <label className="vas-field">
                    <span className="vas-field-label">Numer pożyczki</span>
                    <input
                      className="vas-input"
                      value={lenderPortalLoanLogin}
                      onChange={(e) => setLenderPortalLoanLogin(e.target.value)}
                      placeholder="np. SP-1001"
                      autoComplete="off"
                    />
                  </label>
                  {lenderPortalLoginError ? (
                    <p className="vas-field-error" role="alert">
                      {lenderPortalLoginError}
                    </p>
                  ) : null}
                  <button type="submit" className="vas-btn vas-btn-primary vas-btn-block">
                    Wejdź do portalu
                  </button>
                </form>
                <p className="vas-muted vas-text-sm vas-mt-md">
                  Demo: SP-1001 (termin za 5 dni), SP-1002 (za 12 dni), SP-1003 (za 3 dni).
                </p>
              </section>
            ) : (
              <>
                <section
                  className={`vas-lender-portal-card vas-lender-loan-status ${
                    lenderPortalDaysLeft < 7 ? 'is-urgent' : ''
                  }`}
                >
                  <div className="vas-lender-status-eyebrow">Status pożyczki</div>
                  <h1 className="vas-lender-status-title">Pożyczka wymaga spłaty</h1>
                  <p className="vas-lender-status-lead">
                    {lenderPortalClient.name} ·{' '}
                    <span className="vas-mono-strong">{lenderPortalClient.loanNumber}</span>
                  </p>
                  <div className="vas-lender-status-grid">
                    <div>
                      <span className="vas-muted vas-text-sm">Termin spłaty</span>
                      <div className="vas-lender-status-value">
                        {lenderPortalRepaymentDate
                          ? formatDateOnly(lenderPortalRepaymentDate)
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <span className="vas-muted vas-text-sm">Dni do spłaty (od dziś)</span>
                      <div
                        className={`vas-lender-status-value ${
                          lenderPortalDaysLeft < 7 ? 'vas-lender-days-urgent' : ''
                        }`}
                      >
                        {lenderPortalDaysLeft} dni
                      </div>
                    </div>
                    <div>
                      <span className="vas-muted vas-text-sm">Kwota do spłaty</span>
                      <div className="vas-lender-status-value">
                        {formatMoney(getRepaymentAmountPln(lenderPortalClient))}
                      </div>
                      <div className="vas-muted vas-text-sm vas-lender-repay-hint">
                        Kwota pożyczki + 15%
                      </div>
                    </div>
                  </div>
                  <div className="vas-lender-calm-note" role="status">
                    Punkty możesz wykorzystać m.in. na <strong>przedłużenie spłaty o 14 lub 30 dni</strong>
                    — niezależnie od liczby dni do terminu spłaty.
                  </div>
                </section>

                <section className="vas-lender-portal-card">
                  <div className="vas-lender-api-row">
                    <span className="vas-lender-api-label">Zapytanie API → platforma VAS</span>
                    <span className="vas-lender-api-ok">Saldo potwierdzone</span>
                  </div>
                  <p className="vas-lender-points-balance">
                    Masz do dyspozycji{' '}
                    <strong>{lenderPortalPoints} punktów</strong> lojalnościowych.
                  </p>
                  <p className="vas-muted vas-text-sm">
                    Wybierz, na co chcesz je przeznaczyć. Po potwierdzeniu wyślemy zapis
                    wykorzystania do platformy (demo).
                  </p>
                </section>

                <section className="vas-lender-portal-card">
                  <h2 className="vas-h3 vas-mb-md">Wykorzystaj punkty</h2>
                  <ul className="vas-lender-option-list">
                    {portalRedemptionRows.map((row) => {
                      const affordable = lenderPortalPoints >= row.pointsCost
                      const selectable = row.allowed && affordable
                      return (
                        <li
                          key={row.id}
                          className={`vas-lender-option ${
                            !row.allowed ? 'is-disabled' : ''
                          } ${lenderPortalSelectedId === row.id ? 'is-selected' : ''}`}
                        >
                          <label className="vas-lender-option-label">
                            <input
                              type="radio"
                              name="lender-redemption"
                              value={row.id}
                              disabled={!selectable}
                              checked={lenderPortalSelectedId === row.id}
                              onChange={() => setLenderPortalSelectedId(row.id)}
                            />
                            <span className="vas-lender-option-body">
                              <span className="vas-lender-option-title">{row.label}</span>
                              <span className="vas-cost-pill">{row.pointsCost} pkt</span>
                            </span>
                          </label>
                          {!row.allowed ? (
                            <p className="vas-lender-option-hint">{row.unavailableReason}</p>
                          ) : !affordable ? (
                            <p className="vas-lender-option-hint">Za mało punktów na koncie.</p>
                          ) : null}
                        </li>
                      )
                    })}
                  </ul>

                  {lenderPortalSelectedId ? (
                    <div className="vas-lender-allocation">
                      {(() => {
                        const sel = LENDER_POINTS_CATALOG.find(
                          (o) => o.id === lenderPortalSelectedId,
                        )
                        if (!sel) return null
                        return (
                          <>
                            Przydzielasz <strong>{sel.pointsCost} pkt</strong> z{' '}
                            <strong>{lenderPortalPoints} pkt</strong> na:{' '}
                            <strong>{sel.label}</strong>
                            {PROLONGATION_DAYS_BY_CATALOG[sel.id] ? (
                              <span className="vas-muted">
                                {' '}
                                — nowy termin spłaty przesunie się o{' '}
                                {PROLONGATION_DAYS_BY_CATALOG[sel.id]} dni (demo).
                              </span>
                            ) : null}
                          </>
                        )
                      })()}
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className="vas-btn vas-btn-primary vas-btn-block vas-mt-md"
                    disabled={!lenderPortalSelectedId}
                    onClick={submitLenderPortalRedemption}
                  >
                    Potwierdź wykorzystanie punktów
                  </button>
                </section>
              </>
            )}
          </div>
        </main>
      ) : null}

      {role === 'client' && !clientSessionId && clientScreen === 'home' ? (
        <main className="vas-home-main">
          <div className="vas-home-intro">
            <p className="vas-login-eyebrow">VAS · usługi dodatkowe</p>
            <h1 className="vas-home-title">W czym możemy Ci pomóc?</h1>
            <p className="vas-home-lead">
              Wybierz jedną z dwóch ścieżek — przegląd oferty lub dołączenie do programu
              lojalnościowego dla klientów {LENDER.name}.
            </p>
          </div>
          <div className="vas-home-tiles">
            <article className="vas-home-tile vas-home-tile-offers vas-home-tile-panel vas-home-tile-offers-rich">
              <span className="vas-home-tile-icon" aria-hidden>
                📋
              </span>
              <h2 className="vas-home-tile-title">Przeglądaj ofertę</h2>
              <p className="vas-home-tile-lead">
                Odkryj usługi dodatkowe dopasowane do życia na co dzień — od ochrony
                finansowej po zdrowie, rozwój i spokój w domu. Wybierz to, czego
                naprawdę potrzebujesz, w przejrzystych pakietach VAS.
              </p>
              <ul className="vas-home-offer-highlights vas-home-offer-highlights-compact">
                {HOME_OFFER_HIGHLIGHTS.map((item) => (
                  <li key={item.title}>
                    <span className="vas-home-offer-ico" aria-hidden>
                      {item.icon}
                    </span>
                    <span className="vas-home-offer-name">{item.title}</span>
                  </li>
                ))}
              </ul>
              <p className="vas-home-offer-footer">
                Setki kombinacji pakietów — sprawdź szczegóły i wybierz najlepszą ofertę
                dla siebie.
              </p>
              <button
                type="button"
                className="vas-btn vas-btn-secondary vas-btn-block vas-home-offer-btn"
                onClick={() => setClientScreen('offers')}
              >
                Przeglądaj ofertę
              </button>
            </article>
            <article className="vas-home-tile vas-home-tile-loyalty vas-home-tile-panel">
              <span className="vas-home-tile-icon" aria-hidden>
                ⭐
              </span>
              <h2 className="vas-home-tile-title">
                Mam pożyczkę i chcę dołączyć do programu lojalnościowego
              </h2>
              <p className="vas-home-tile-desc vas-home-tile-desc-tight">
                Dołącz do programu lojalnościowego {LENDER.name}: zbieraj punkty za
                zakupy VAS i wymieniaj je na korzyści przy spłacie pożyczki.
              </p>
              <ul className="vas-home-loyalty-perks" aria-label="Przykładowe korzyści programu">
                {LOYALTY_HOME_PERKS.map((perk) => (
                  <li key={perk.text}>
                    <span aria-hidden>{perk.icon}</span>
                    {perk.text}
                  </li>
                ))}
              </ul>
              {loginMode === 'sms' ? (
                <>
                  {loginError ? (
                    <p className="vas-form-error vas-mb-sm" role="alert">
                      {loginError}
                    </p>
                  ) : null}
                  <LoginSMS
                    key="sms"
                    onLoginSuccess={handleSmsLoginSuccess}
                  />
                </>
              ) : (
                <form
                  className="vas-form vas-home-login-form"
                  onSubmit={handleLoanLogin}
                  aria-labelledby="home-login-heading"
                >
                  <h3 id="home-login-heading" className="vas-home-login-label">
                    Numer pożyczki
                  </h3>
                  <input
                    id="loan-home"
                    className="vas-input vas-input-lg"
                    placeholder="np. SP-1001"
                    value={loanLogin}
                    onChange={(e) => setLoanLogin(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                  />
                  {loginError ? (
                    <p className="vas-form-error" role="alert">
                      {loginError}
                    </p>
                  ) : null}
                  <button type="submit" className="vas-btn vas-btn-primary vas-btn-block vas-mt-sm">
                    Zaloguj się
                  </button>
                  <p className="vas-login-demo-hint vas-home-demo-hint">
                    Demo: <strong>SP-1001</strong>, <strong>SP-1002</strong>,{' '}
                    <strong>SP-1003</strong>
                  </p>
                </form>
              )}
            </article>
          </div>
        </main>
      ) : null}

      {role === 'client' && !clientSessionId && clientScreen === 'offers' ? (
        <main className="vas-home-main vas-home-sub">
          <button
            type="button"
            className="vas-back-link"
            onClick={() => setClientScreen('home')}
          >
            ← Strona główna
          </button>
          <div className="vas-pagehead vas-pagehead-tight">
            <div>
              <h1 className="vas-h1">Przeglądaj ofertę</h1>
              <p className="vas-lead">
                Ubezpieczenia, opieka zdrowotna, pomoc prawna, nauka języków obcych i
                inne pakiety — demo katalogu usług dodatkowych.
              </p>
            </div>
          </div>
          <div className="vas-offer-grid">
            {OFFER_CATEGORIES.map((cat) => (
              <article key={cat.id} className="vas-offer-card">
                <div className="vas-offer-card-icon" aria-hidden>
                  {cat.icon}
                </div>
                <h2 className="vas-h3">{cat.title}</h2>
                <p className="vas-muted vas-text-sm">{cat.desc}</p>
                <div className="vas-offer-tags">
                  {cat.tags.map((t) => (
                    <span key={t} className="vas-pill">
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="vas-btn vas-btn-ghost vas-btn-sm vas-mt-md"
                  onClick={() => setClientScreen('home')}
                >
                  Mam pożyczkę — zaloguj na stronie głównej
                </button>
              </article>
            ))}
          </div>
          <div className="vas-card vas-card-tint vas-mt-lg">
            <p className="vas-muted vas-mb-md">
              Produkty dostępne w programie dla klientów {LENDER.name} (po zalogowaniu):
            </p>
            <ul className="vas-product-mini">
              {VAS_PRODUCTS.map((p) => (
                <li key={p.id}>
                  <span>
                    {p.icon} {p.name}
                  </span>
                  <span className="vas-muted">
                    {formatMoney(p.pricePln)} · {p.packageLabel}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </main>
      ) : null}

      {role === 'client' && clientSessionId && clientScreen !== 'lender-portal' ? (
        <div className="vas-client-layout">
          <main className="vas-client-main">
            <section className="vas-section vas-client-hero-card" aria-label="Podsumowanie konta">
              <div className="vas-client-hero-top">
                <div>
                  <p className="vas-login-eyebrow">Witaj ponownie</p>
                  <h1 className="vas-h1 vas-mb-z">{sessionClient.name}</h1>
                  <p className="vas-muted vas-text-sm">
                    Numer pożyczki:{' '}
                    <span className="vas-mono-strong">{sessionClient.loanNumber}</span>
                  </p>
                </div>
                <div className="vas-client-points-hero">
                  <span className="vas-client-points-label">Saldo punktów</span>
                  <span className="vas-client-points-num">{pointsSession}</span>
                </div>
              </div>
            </section>

            <div className="vas-client-grid">
              <section className="vas-card vas-card-elevated" aria-labelledby="my-vas-title">
                <div className="vas-card-head">
                  <h2 id="my-vas-title" className="vas-h2">
                    Moje produkty VAS
                  </h2>
                  <span className="vas-badge vas-badge-green">Aktywne</span>
                </div>
                {myProductsGrouped.length === 0 ? (
                  <p className="vas-muted">
                    Nie masz jeszcze wykupionych produktów VAS. Skorzystaj z katalogu poniżej.
                  </p>
                ) : (
                  <ul className="vas-my-products">
                    {myProductsGrouped.map((row) => {
                      const def = VAS_PRODUCTS.find((p) => p.id === row.productId)
                      return (
                        <li key={row.productId} className="vas-my-product-row">
                          <span className="vas-my-product-ico" aria-hidden>
                            {def?.icon ?? '✓'}
                          </span>
                          <div>
                            <div className="vas-my-product-name">{row.name}</div>
                            <div className="vas-muted vas-text-sm">
                              Ostatnio: {formatDate(row.lastAt)} · {row.count}{' '}
                              {row.count === 1 ? 'zakup' : 'zakupy'}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>

              <section className="vas-card vas-card-elevated" aria-labelledby="catalog-title">
                <div className="vas-card-head">
                  <h2 id="catalog-title" className="vas-h2">
                    Katalog VAS
                  </h2>
                  <span className="vas-badge">Kup teraz</span>
                </div>
                <div className="vas-product-grid vas-product-grid-client">
                  {VAS_PRODUCTS.map((p) => (
                    <article key={p.id} className="vas-product-card">
                      <div className="vas-product-icon" aria-hidden>
                        {p.icon}
                      </div>
                      <h3 className="vas-h3">{p.name}</h3>
                      <p className="vas-muted vas-text-sm">{p.description}</p>
                      <div className="vas-product-price-row">
                        <div>
                          <div className="vas-price">{formatMoney(p.pricePln)}</div>
                          <div className="vas-muted vas-text-sm">{p.packageLabel}</div>
                        </div>
                        <div className="vas-points-badge">+{p.pointsReward} pkt</div>
                      </div>
                      <button
                        type="button"
                        className="vas-btn vas-btn-secondary vas-btn-block"
                        onClick={() => buyProduct(p)}
                      >
                        Kup VAS
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <div className="vas-client-grid-2 vas-mt-lg">
              <section
                className="vas-card vas-card-elevated"
                aria-labelledby="points-calculator-title"
              >
                <div className="vas-card-head">
                  <h2 id="points-calculator-title" className="vas-h2">
                    Kalkulator wartości punktów
                  </h2>
                  <span className="vas-badge vas-badge-navy">Tylko informacja</span>
                </div>
                <p className="vas-points-calculator-lead">
                  Masz <strong>{pointsSession}</strong> punktów. Przy przeliczniku pożyczkodawcy{' '}
                  <strong>{LENDER.name}</strong>:
                </p>
                <div className="vas-info-callout" role="note">
                  <p>
                    Aby wykorzystać punkty, zaloguj się w portalu swojego pożyczkodawcy. Twoje
                    saldo punktów zostanie automatycznie potwierdzone, gdy pożyczkodawca zapyta o
                    nie przez API.
                  </p>
                </div>
                <div className="vas-table-wrap vas-table-wrap-points-catalog vas-mt-md">
                  <table className="vas-table vas-table-compact vas-points-catalog-table">
                    <thead>
                      <tr>
                        <th>Opcja</th>
                        <th>Koszt</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientCalculatorRows.map((row) => {
                        const affordable = pointsSession >= row.pointsCost
                        return (
                          <tr key={row.id}>
                            <td className="vas-points-catalog-option">{row.label}</td>
                            <td className="vas-points-catalog-cost">
                              <span className="vas-cost-pill vas-cost-pill-sm">
                                {row.pointsCost} pkt
                              </span>
                            </td>
                            <td className="vas-points-catalog-status">
                              {affordable ? (
                                <span className="vas-tag-pos vas-tag-pos-sm">wystarczy</span>
                              ) : (
                                <span className="vas-muted vas-text-sm">za mało</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="vas-muted vas-text-sm vas-mt-sm">
                  Tabela ma charakter wyłącznie informacyjny — pokazuje, czy stać Cię na koszt w
                  punktach. W portalu pożyczkodawcy dostępne są przedłużenia o 14 i 30 dni (bez
                  względu na termin spłaty).
                </p>
                <button
                  type="button"
                  className="vas-btn vas-btn-primary vas-btn-block vas-mt-md"
                  onClick={openLenderPortal}
                >
                  Przejdź do portalu pożyczkodawcy
                </button>
              </section>

              <section
                className="vas-card vas-card-elevated"
                aria-labelledby="redemption-history-title"
              >
                <div className="vas-card-head">
                  <h2 id="redemption-history-title" className="vas-h2">
                    Historia wykorzystanych punktów
                  </h2>
                  <span className="vas-badge">Potwierdzenia API</span>
                </div>
                {clientRedemptionHistory.length === 0 ? (
                  <p className="vas-muted">
                    Brak potwierdzonych wykorzystań. Punkty są odejmiane wyłącznie po
                    potwierdzeniu przez pożyczkodawcę w jego portalu.
                  </p>
                ) : (
                  <div className="vas-table-wrap vas-table-wrap-tight">
                    <table className="vas-table vas-table-compact">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Punkty</th>
                          <th>Pożyczkodawca</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientRedemptionHistory.map((row) => (
                          <tr key={row.id}>
                            <td>{formatDate(row.at)}</td>
                            <td>
                              <span className="vas-tag-neg">−{row.points}</span>
                            </td>
                            <td>{row.lenderName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="vas-mt-lg">
              <section className="vas-card vas-card-elevated" aria-labelledby="history-title">
                <div className="vas-card-head">
                  <h2 id="history-title" className="vas-h2">
                    Historia zakupów
                  </h2>
                  <span className="vas-badge vas-badge-green">Tylko Twoje</span>
                </div>
                {purchaseHistoryOnly.length === 0 ? (
                  <p className="vas-muted">Brak zakupów na koncie.</p>
                ) : (
                  <div className="vas-table-wrap vas-table-wrap-tight">
                    <table className="vas-table vas-table-compact">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Produkt</th>
                          <th>Kwota</th>
                          <th>Punkty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchaseHistoryOnly.map((row) => (
                          <tr key={row.id}>
                            <td>{formatDate(row.at)}</td>
                            <td>{row.productName}</td>
                            <td>{formatMoney(row.pricePln)}</td>
                            <td>
                              <span className="vas-tag-pos">+{row.pointsEarned}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="vas-divider vas-mt-md" />
                <div className="vas-card-head vas-mb-z">
                  <h3 className="vas-h3">Aktywność na koncie</h3>
                </div>
                {clientActivityTimeline.length === 0 ? (
                  <p className="vas-muted vas-text-sm">Brak wpisów.</p>
                ) : (
                  <ul className="vas-timeline vas-timeline-compact">
                    {clientActivityTimeline.slice(0, 6).map((h, idx) => (
                      <li key={`${h.at}-${idx}`} className="vas-tl-item">
                        <div className="vas-tl-dot" />
                        <div className="vas-tl-card">
                          <div className="vas-tl-date">{formatDate(h.at)}</div>
                          <div className="vas-tl-title">{h.label}</div>
                          <div className="vas-tl-meta">{h.detail}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </main>
        </div>
      ) : null}

      {role === 'lender' ? (
        <div className="vas-pro-shell">
          <main className="vas-pro-main">
            <div className="vas-role-banner">
              <span className="vas-role-pill">{LENDER.name}</span>
              <span className="vas-role-pill vas-role-pill-muted">
                Panel Pożyczkodawcy
              </span>
            </div>
            <section className="vas-section" aria-labelledby="lender-title">
              <div className="vas-pagehead">
                <div>
                  <h1 id="lender-title" className="vas-h1">
                    Panel Pożyczkodawcy
                  </h1>
                  <p className="vas-lead">
                    Widok operacyjny wyłącznie dla klientów {LENDER.name}: logowania,
                    liczba zakupów VAS, punkty zdobyte i prowizja w punktach (demo bez backendu).
                  </p>
                </div>
              </div>

              <div className="vas-kpi-grid vas-kpi-grid-6">
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Zalogowani klienci</div>
                  <div className="vas-kpi-value">{loggedInClientCount}</div>
                  <div className="vas-kpi-foot">
                    Unikalni klienci z co najmniej jednym logowaniem w portalu
                  </div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Liczba zakupionych VAS</div>
                  <div className="vas-kpi-value">{purchases.length}</div>
                  <div className="vas-kpi-foot">Wszystkie transakcje dodatków</div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Punkty zdobyte z VAS</div>
                  <div className="vas-kpi-value">{totalVasPointsEarned} pkt</div>
                  <div className="vas-kpi-foot">Suma punktów przyznanych klientom za zakupy</div>
                </article>
                <article className="vas-kpi vas-kpi-accent">
                  <div className="vas-kpi-label">Prowizja dla {LENDER.name}</div>
                  <div className="vas-kpi-value">{lenderCommissionPointsTotal} pkt</div>
                  <div className="vas-kpi-foot">
                    {LENDER.commissionPercent}% punktów zdobytych przy sprzedaży VAS
                  </div>
                </article>
              </div>

              <div className="vas-card vas-card-elevated vas-mt-lg">
                <div className="vas-card-head">
                  <h2 className="vas-h2">Klienci {LENDER.name}</h2>
                  <span className="vas-badge">CRM</span>
                </div>
                <div className="vas-table-wrap">
                  <table className="vas-table">
                    <thead>
                      <tr>
                        <th>Klient</th>
                        <th>Numer pożyczki</th>
                        <th>Status logowania</th>
                        <th>Zakupione VAS</th>
                        <th>Punkty zdobyte</th>
                        <th>Prowizja (pkt)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lenderPortalRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <strong className="vas-text-strong">{row.name}</strong>
                          </td>
                          <td>{row.loanNumber}</td>
                          <td>
                            {row.sessionActiveHere ? (
                              <span className="vas-status vas-status-live">Sesja aktywna</span>
                            ) : row.loginCount > 0 ? (
                              <span className="vas-status vas-status-ok">
                                Ostatnio: {formatDate(row.lastLoginAt)}
                                <span className="vas-muted vas-text-sm">
                                  {' '}
                                  ({row.loginCount}{' '}
                                  {row.loginCount === 1 ? 'logowanie' : 'logowań'})
                                </span>
                              </span>
                            ) : (
                              <span className="vas-status vas-status-off">Brak logowania</span>
                            )}
                          </td>
                          <td>
                            {row.purchaseCount > 0 ? (
                              <>
                                <strong>{row.purchaseCount}</strong>
                                {row.purchaseCount === 1
                                  ? ' zakup VAS'
                                  : ' zakupy VAS'}
                              </>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span className="vas-tag-pos">+{row.pointsEarnedFromVas} pkt</span>
                          </td>
                          <td>
                            {row.commissionPointsFromVas > 0
                              ? `${row.commissionPointsFromVas} pkt`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="vas-card vas-card-elevated vas-mt-lg">
                <div className="vas-card-head">
                  <h2 className="vas-h2">Historia zakupów VAS klientów</h2>
                  <span className="vas-badge vas-badge-green">Transakcje</span>
                </div>
                {lenderPurchaseHistory.length === 0 ? (
                  <p className="vas-muted">Brak zakupów VAS.</p>
                ) : (
                  <div className="vas-table-wrap">
                    <table className="vas-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Klient</th>
                          <th>Numer pożyczki</th>
                          <th>Punkty zdobyte</th>
                          <th>Prowizja (pkt)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lenderPurchaseHistory.map((row) => (
                          <tr key={row.id}>
                            <td>{formatDate(row.at)}</td>
                            <td>{row.clientName}</td>
                            <td>{row.loanNumber}</td>
                            <td>
                              <span className="vas-tag-pos">+{row.pointsEarned} pkt</span>
                            </td>
                            <td>{row.commissionPoints} pkt</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="vas-card vas-card-elevated vas-mt-lg">
                <div className="vas-card-head">
                  <h2 className="vas-h2">Symulacja API potwierdzenia wykorzystania</h2>
                  <span className="vas-badge vas-badge-navy">Demo</span>
                </div>
                <p className="vas-muted vas-mb-md">
                  W produkcji pożyczkodawca wywołuje API platformy po wykorzystaniu punktów w
                  swoim portalu. Poniżej symulacja zapisu potwierdzenia (odejmowanie punktów i
                  wpis w historii).
                </p>
                <div className="vas-lender-api-demo">
                  <label className="vas-field">
                    <span className="vas-field-label">Klient</span>
                    <select
                      className="vas-input"
                      value={lenderApiDemoClientId}
                      onChange={(e) => setLenderApiDemoClientId(e.target.value)}
                    >
                      {BASE_CLIENTS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.loanNumber}) —{' '}
                          {pointsByClient[c.id] ?? c.basePoints} pkt
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="vas-field">
                    <span className="vas-field-label">Opcja wykorzystania</span>
                    <select
                      className="vas-input"
                      value={lenderApiDemoOptionId}
                      onChange={(e) => setLenderApiDemoOptionId(e.target.value)}
                    >
                      {LENDER_POINTS_CATALOG.filter((o) =>
                        LENDER_PORTAL_PROLONGATION_IDS.includes(o.id) ||
                        o.id === 'r4' ||
                        o.id === 'r5',
                      ).map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.label} — {o.pointsCost} pkt
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    className="vas-btn vas-btn-secondary"
                    onClick={() =>
                      confirmRedemptionViaLenderApi(
                        lenderApiDemoClientId,
                        lenderApiDemoOptionId,
                      )
                    }
                  >
                    Wyślij potwierdzenie API (demo)
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>
      ) : null}

      {role === 'admin' ? (
        <div className="vas-pro-shell">
          <main className="vas-pro-main">
            <div className="vas-role-banner">
              <span className="vas-role-pill vas-role-pill-admin">Admin Platformy</span>
              <span className="vas-role-pill vas-role-pill-muted">
                Widok operatora (wszystkie dane demo)
              </span>
            </div>
            <section className="vas-section" aria-labelledby="admin-title">
              <div className="vas-pagehead">
                <div>
                  <h1 id="admin-title" className="vas-h1">
                    Admin Platformy
                  </h1>
                  <p className="vas-lead">
                    Pełna widoczność: sprzedaż VAS, przychód platformy, prowizja partnera (
                    {LENDER.name}), aktywność klientów i rozliczenia (demo jednego partnera).
                  </p>
                </div>
              </div>

              <div className="vas-card vas-card-elevated vas-admin-config-cta">
                <div className="vas-card-head">
                  <h2 className="vas-h2">Panel konfiguracji pożyczkodawców</h2>
                  <span className="vas-badge vas-badge-navy">LoyalVAS</span>
                </div>
                <p className="vas-muted vas-mb-md">
                  Ustawienia produktów VAS, cen, punktów za zakup i przelicznika korzyści (KredytOK,
                  Szybka Gotówka, PożyczkaPLUS) są w <strong>osobnym panelu administracyjnym</strong>
                  — nie w tym widoku raportowym.
                </p>
                <Link to="/admin" className="vas-btn vas-btn-primary">
                  Otwórz konfigurację → /admin
                </Link>
                <p className="vas-login-demo-hint vas-mt-sm">
                  Logowanie do panelu: <strong>admin</strong> / hasło <strong>demo</strong>
                </p>
              </div>

              <div className="vas-kpi-grid">
                <article className="vas-kpi vas-kpi-accent">
                  <div className="vas-kpi-label">Całkowita sprzedaż VAS</div>
                  <div className="vas-kpi-value">{formatMoney(totalVasRevenue)}</div>
                  <div className="vas-kpi-foot">Przychód brutto z usług dodatkowych</div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Prowizja pożyczkodawcy</div>
                  <div className="vas-kpi-value">{formatMoney(lenderCommissionTotal)}</div>
                  <div className="vas-kpi-foot">
                    {LENDER.commissionPercent}% dla {LENDER.name}
                  </div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Przychód netto platformy</div>
                  <div className="vas-kpi-value">{formatMoney(platformNetRevenue)}</div>
                  <div className="vas-kpi-foot">Po odliczeniu prowizji partnera (model demo)</div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Klienci zalogowani (kiedykolwiek)</div>
                  <div className="vas-kpi-value">{loggedInClientCount}</div>
                  <div className="vas-kpi-foot">Z portalu klienta (symulacja)</div>
                </article>
              </div>

              <div className="vas-kpi-grid vas-mt-md">
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Średnia wartość koszyka</div>
                  <div className="vas-kpi-value">
                    {purchases.length
                      ? formatMoney(totalVasRevenue / purchases.length)
                      : '—'}
                  </div>
                  <div className="vas-kpi-foot">Na transakcję</div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Punkty przyznane (VAS)</div>
                  <div className="vas-kpi-value">
                    {purchases.reduce((s, p) => s + p.pointsEarned, 0)} pkt
                  </div>
                  <div className="vas-kpi-foot">Nagrody lojalnościowe</div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Punkty wykorzystane (API)</div>
                  <div className="vas-kpi-value">{totalPointsRedeemed} pkt</div>
                  <div className="vas-kpi-foot">Potwierdzenia od pożyczkodawcy</div>
                </article>
                <article className="vas-kpi">
                  <div className="vas-kpi-label">Klienci z wykorzystaniem</div>
                  <div className="vas-kpi-value">
                    {new Set(lenderRedemptions.map((r) => r.clientId)).size}
                  </div>
                  <div className="vas-kpi-foot">Unikalni użytkownicy</div>
                </article>
              </div>

              <div className="vas-card vas-card-elevated vas-mt-lg">
                <div className="vas-card-head">
                  <h2 className="vas-h2">Udział produktów w przychodzie</h2>
                  <span className="vas-badge vas-badge-green">SKU</span>
                </div>
                <div className="vas-admin-bars">
                  {productStats.map((p) => {
                    const max = Math.max(
                      1,
                      ...productStats.map((x) => x.revenue),
                    )
                    const w = Math.round((p.revenue / max) * 100)
                    return (
                      <div key={p.id} className="vas-bar-row">
                        <div className="vas-bar-head">
                          <span>
                            {p.icon} {p.name}
                          </span>
                          <span className="vas-muted">
                            {p.count} × · {formatMoney(p.revenue)}
                          </span>
                        </div>
                        <div className="vas-bar-track">
                          <div className="vas-bar-fill" style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="vas-grid-2 vas-mt-lg">
                <div className="vas-card">
                  <div className="vas-card-head">
                    <h2 className="vas-h2">Rejestr operacji (skrót)</h2>
                  </div>
                  {purchases.length === 0 ? (
                    <p className="vas-muted">Brak danych operacyjnych.</p>
                  ) : (
                    <div className="vas-table-wrap">
                      <table className="vas-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Klient</th>
                            <th>Produkt</th>
                            <th>Kwota</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchases.slice(0, 15).map((row) => {
                            const cl = BASE_CLIENTS.find((c) => c.id === row.clientId)
                            return (
                              <tr key={row.id}>
                                <td>{formatDate(row.at)}</td>
                                <td>{cl?.name ?? '—'}</td>
                                <td>{row.productName}</td>
                                <td>{formatMoney(row.pricePln)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="vas-card vas-card-tint">
                  <div className="vas-card-head">
                    <h2 className="vas-h2">Model rozliczeń (demo)</h2>
                  </div>
                  <ul className="vas-checklist">
                    <li>
                      Sprzedaż VAS: <strong>{formatMoney(totalVasRevenue)}</strong>
                    </li>
                    <li>
                      Prowizja {LENDER.name} ({LENDER.commissionPercent}%):{' '}
                      <strong>{formatMoney(lenderCommissionTotal)}</strong>
                    </li>
                    <li>
                      Pozostałość na platformę:{' '}
                      <strong>{formatMoney(platformNetRevenue)}</strong>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </main>
        </div>
      ) : null}

      <footer className="vas-footer">
        <span>VAS Loyalty Demo</span>
        <span className="vas-footer-dot" aria-hidden>
          ·
        </span>
        <span>Trzy oddzielne widoki: Portal Klienta · Panel Pożyczkodawcy · Admin Platformy</span>
        <span className="vas-footer-dot" aria-hidden>
          ·
        </span>
        <Link to="/admin" className="vas-footer-admin-link">
          Konfiguracja LoyalVAS (/admin)
        </Link>
      </footer>

      {toast ? (
        <div className={`vas-toast vas-toast-${toast.type}`} role="status">
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}
