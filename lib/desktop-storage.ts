import { DesktopSettings, DesktopIcon } from './desktop-types'

export const DEFAULT_ICONS: DesktopIcon[] = [
  {
    id: '1',
    label: 'Google',
    labelAr: 'جوجل',
    url: 'https://www.google.com',
    image: 'https://www.google.com/favicon.ico',
    x: 40,
    y: 40,
  },
  {
    id: '2',
    label: 'YouTube',
    labelAr: 'يوتيوب',
    url: 'https://www.youtube.com',
    image: 'https://www.youtube.com/favicon.ico',
    x: 40,
    y: 160,
  },
  {
    id: '3',
    label: 'GitHub',
    labelAr: 'جيت هاب',
    url: 'https://www.github.com',
    image: 'https://github.com/favicon.ico',
    x: 40,
    y: 280,
  },
  {
    id: '4',
    label: 'Twitter',
    labelAr: 'تويتر',
    url: 'https://twitter.com',
    image: 'https://twitter.com/favicon.ico',
    x: 40,
    y: 400,
  },
  {
    id: '5',
    label: 'OpenAI',
    labelAr: 'أوبن إيه آي',
    url: 'https://chat.openai.com',
    image: 'https://chat.openai.com/favicon.ico',
    x: 40,
    y: 520,
  },
]

export const DEFAULT_SETTINGS: DesktopSettings = {
  wallpaper: '/wallpaper.jpg',
  wallpaperBlur: 0,
  showGrid: false,
  desktopPadding: 16,

  iconSize: 64,
  iconSpacing: 8,
  labelSize: 12,
  labelColor: '#ffffff',
  iconHoverAnimation: 'scale',

  animationsEnabled: true,
  uiBlurIntensity: 16,
  cornerRadius: 16,

  theme: 'dark',
  language: 'ar',
}

const STORAGE_KEY = 'macos-desktop-icons'
const SETTINGS_KEY = 'macos-desktop-settings'
const WALLPAPER_KEY = 'macos-desktop-wallpaper'

// ── IndexedDB helpers for large wallpaper blobs ──────────────────────────────

const DB_NAME = 'desktop-db'
const DB_STORE = 'blobs'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function idbPut(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await openDB()
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).put(value, key)
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res()
      tx.onerror = () => rej(tx.error)
    })
  } catch { /* silently ignore */ }
}

async function idbGet(key: string): Promise<string | null> {
  if (typeof window === 'undefined') return null
  try {
    const db = await openDB()
    return await new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly')
      const req = tx.objectStore(DB_STORE).get(key)
      req.onsuccess = () => resolve(req.result ?? null)
      req.onerror = () => resolve(null)
    })
  } catch { return null }
}

async function idbDelete(key: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const db = await openDB()
    const tx = db.transaction(DB_STORE, 'readwrite')
    tx.objectStore(DB_STORE).delete(key)
  } catch { /* silently ignore */ }
}

// ── localStorage helpers ─────────────────────────────────────────────────────

/** Returns true if the value looks like an uploaded data URL (large blob) */
function isDataUrl(val: string) {
  return val.startsWith('data:')
}

export function loadIcons(): DesktopIcon[] {
  if (typeof window === 'undefined') return DEFAULT_ICONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ICONS
    return JSON.parse(raw) as DesktopIcon[]
  } catch {
    return DEFAULT_ICONS
  }
}

export function saveIcons(icons: DesktopIcon[]) {
  if (typeof window === 'undefined') return
  // Strip data-URL images before saving to localStorage — they are already in IndexedDB
  // under their __idb:icon:id__ key and will be restored on load.
  const sanitized = icons.map((ic) => ({
    ...ic,
    image: ic.image?.startsWith('data:') ? `__idb:icon:${ic.id}__` : ic.image,
  }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
  } catch {
    // quota exceeded — icons are non-critical, skip silently
  }
}

export function loadSettings(): DesktopSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as DesktopSettings
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: DesktopSettings) {
  if (typeof window === 'undefined') return
  // Strip data-URL wallpapers before saving to localStorage to avoid QuotaExceededError.
  // Large wallpapers are persisted separately via saveWallpaperBlob / IndexedDB.
  const { wallpaper, ...rest } = settings
  const wallpaperToStore = isDataUrl(wallpaper) ? '__idb__' : wallpaper
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...rest, wallpaper: wallpaperToStore }))
  } catch {
    // quota exceeded — save everything except wallpaper
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...rest, wallpaper: DEFAULT_SETTINGS.wallpaper }))
    } catch {
      // ignore
    }
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10)
}

// ── Wallpaper blob helpers ───────────────────────────────────────────────────

export async function saveWallpaperBlob(dataUrl: string): Promise<void> {
  await idbPut(WALLPAPER_KEY, dataUrl)
}

export async function loadWallpaperBlob(): Promise<string | null> {
  return idbGet(WALLPAPER_KEY)
}

// ── Icon image blob helpers (stored in IndexedDB by icon id) ─────────────────

/** Store a large icon image in IndexedDB; returns the IDB key reference string */
export async function saveIconBlob(iconId: string, dataUrl: string): Promise<string> {
  const key = `__idb:icon:${iconId}__`
  await idbPut(key, dataUrl)
  return key
}

/** Retrieve an icon image from IndexedDB given its IDB key reference */
export async function loadIconBlob(idbRef: string): Promise<string | null> {
  return idbGet(idbRef)
}

/** Delete an icon image from IndexedDB */
export async function deleteIconBlob(iconId: string): Promise<void> {
  await idbDelete(`__idb:icon:${iconId}__`)
}

/** Returns true if the image field is an IDB reference */
export function isIconBlobRef(image: string) {
  return image.startsWith('__idb:icon:')
}
