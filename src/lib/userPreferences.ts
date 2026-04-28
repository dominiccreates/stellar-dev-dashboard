/**
 * userPreferences.ts — Issue #142
 * User preferences schema, defaults, and persistence helpers.
 */

import { getStoredValue, setStoredValue } from './storage'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AddressEntry {
  label: string
  address: string
  network: string
  addedAt: string
}

export interface WidgetLayout {
  id: string
  type: string
  span: number
  order: number
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  defaultNetwork: 'mainnet' | 'testnet' | 'futurenet' | 'local' | 'custom'
  savedAddresses: AddressEntry[]
  dashboardLayout: WidgetLayout[]
  currency: 'USD' | 'EUR' | 'XLM'
  language: string
  compactMode: boolean
  showAdvancedPanels: boolean
  autoRefresh: boolean
  fontSize: 'small' | 'medium' | 'large'
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  defaultNetwork: 'testnet',
  savedAddresses: [],
  dashboardLayout: [],
  currency: 'USD',
  language: 'en',
  compactMode: false,
  showAdvancedPanels: true,
  autoRefresh: true,
  fontSize: 'medium',
}

const PREFS_KEY = 'user-preferences-v2'

// ─── Persistence ──────────────────────────────────────────────────────────────

export async function loadPreferences(): Promise<UserPreferences> {
  try {
    const stored = await getStoredValue(PREFS_KEY) as Partial<UserPreferences> | null
    return { ...DEFAULT_PREFERENCES, ...(stored || {}) }
  } catch {
    return { ...DEFAULT_PREFERENCES }
  }
}

export async function savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const current = await loadPreferences()
  const next = { ...current, ...prefs }
  await setStoredValue(PREFS_KEY, next)
  return next
}

export async function updatePreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): Promise<UserPreferences> {
  return savePreferences({ [key]: value } as Partial<UserPreferences>)
}

// ─── Address book helpers ─────────────────────────────────────────────────────

export async function addSavedAddress(entry: Omit<AddressEntry, 'addedAt'>): Promise<UserPreferences> {
  const prefs = await loadPreferences()
  const exists = prefs.savedAddresses.some((a) => a.address === entry.address)
  if (exists) return prefs
  return savePreferences({
    savedAddresses: [
      ...prefs.savedAddresses,
      { ...entry, addedAt: new Date().toISOString() },
    ],
  })
}

export async function removeSavedAddress(address: string): Promise<UserPreferences> {
  const prefs = await loadPreferences()
  return savePreferences({
    savedAddresses: prefs.savedAddresses.filter((a) => a.address !== address),
  })
}

export async function resetPreferences(): Promise<UserPreferences> {
  await setStoredValue(PREFS_KEY, DEFAULT_PREFERENCES)
  return { ...DEFAULT_PREFERENCES }
}
