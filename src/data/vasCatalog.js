export const LENDER_POINTS_CONFIG_KEY = 'lenderPointsConfig'

export const LENDER = {
  id: 'ekspres',
  name: 'EkspresPożyczka',
  commissionPercent: 25,
  portalUrl: 'https://www.eksprespozyczka.pl/demo-portal',
}

/** Id pożyczkodawcy w lenderPointsConfig ↔ nazwa w panelu admin. */
export const LENDER_ADMIN_TABS = [
  { key: 'ekspres', label: 'EkspresPożyczka' },
  { key: 'kredytok', label: 'KredytOK' },
  { key: 'szybkagotowka', label: 'Szybka Gotówka' },
  { key: 'pozyczkaplus', label: 'PożyczkaPLUS' },
]

export const VAS_PRODUCTS = [
  { id: 'p1', name: 'Telemedycyna Basic', category: 'telemedicine', pricePln: 120 },
  { id: 'p2', name: 'Telemedycyna Rozszerzona', category: 'telemedicine', pricePln: 240 },
  { id: 'p3', name: 'Telemedycyna Premium', category: 'telemedicine', pricePln: 400 },
  {
    id: 'p4',
    name: 'Ubezpieczenie CPI',
    category: 'insurance',
    pricePln: 180,
    tuName: 'TU Alfa',
  },
  {
    id: 'p5',
    name: 'Ubezpieczenie Życie NNW',
    category: 'insurance',
    pricePln: 240,
    tuName: 'TU Alfa',
  },
  {
    id: 'p6',
    name: 'Home Assistance',
    category: 'insurance',
    pricePln: 160,
    tuName: 'TU Beta',
  },
]

const PRODUCT_UI = {
  p1: { icon: '🩺', description: 'Pakiet podstawowy — telekonsultacje i badania.' },
  p2: { icon: '🩺', description: 'Pakiet rozszerzony — szerszy zakres usług.' },
  p3: { icon: '🩺', description: 'Pakiet premium — pełna opieka telemedyczna.' },
  p4: { icon: '🛡️', description: 'Ubezpieczenie na wypadek utraty pracy.' },
  p5: { icon: '🛡️', description: 'Życie i NNW — ochrona rodziny.' },
  p6: { icon: '🏠', description: 'Assistance domowy — hydraulik, elektryk, ślusarz.' },
}

export function getProductDisplay(product) {
  const ui = PRODUCT_UI[product.id] ?? {
    icon: product.category === 'telemedicine' ? '🩺' : '🛡️',
    description: '',
  }
  return { ...product, ...ui }
}

export const VAS_PRODUCTS_DISPLAY = VAS_PRODUCTS.map(getProductDisplay)

export const DEFAULT_LENDER_POINTS_CONFIG = {
  ekspres: { p1: 60, p2: 120, p3: 200, p4: 45, p5: 60, p6: 40 },
  kredytok: { p1: 65, p2: 130, p3: 210, p4: 50, p5: 65, p6: 45 },
  szybkagotowka: { p1: 62, p2: 125, p3: 205, p4: 48, p5: 62, p6: 42 },
  pozyczkaplus: { p1: 68, p2: 135, p3: 215, p4: 52, p5: 68, p6: 48 },
}

export function loadLenderPointsConfig() {
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

export function saveLenderPointsConfig(config) {
  localStorage.setItem(LENDER_POINTS_CONFIG_KEY, JSON.stringify(config))
}

export function getClientPointsForPurchase(lenderId, productId, config = null) {
  const cfg = config ?? loadLenderPointsConfig()
  return cfg[lenderId]?.[productId] ?? 0
}

export function calcLenderPointsForProduct(product) {
  const rate = product.category === 'telemedicine' ? 0.85 : 0.25
  return Math.round(product.pricePln * rate)
}

export function sumPurchaseLenderPoints(purchases) {
  return purchases.reduce((s, p) => s + (p.lenderPoints ?? 0), 0)
}
