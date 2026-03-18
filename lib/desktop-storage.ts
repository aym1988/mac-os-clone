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
  }
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

// ── إعداد قاعدة بيانات IndexedDB للصور الكبيرة ──────────────────────────────

const DB_NAME = 'desktop-db'
const DB_STORE = 'blobs'
const DB_VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject('IndexedDB not supported')
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
  } catch (e) { console.error('IDB Put Error:', e) }
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

// ── دوال المساعدة للصور والأيقونات ─────────────────────────────────────────────

export function loadIcons(): DesktopIcon[] {
  if (typeof window === 'undefined') return DEFAULT_ICONS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_ICONS
    return JSON.parse(raw) as DesktopIcon[]
  } catch { return DEFAULT_ICONS }
}

export function saveIcons(icons: DesktopIcon[]) {
  if (typeof window === 'undefined') return
  // تحويل الصور من نوع data: إلى مراجع نصية قبل الحفظ في localStorage لتوفير المساحة
  const sanitized = icons.map((ic) => ({
    ...ic,
    image: ic.image?.startsWith('data:') ? `__idb:icon:${ic.id}__` : ic.image,
  }))
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
  } catch (e) { console.warn('LocalStorage Quota Exceeded', e) }
}

export async function saveIconBlob(iconId: string, dataUrl: string): Promise<string> {
  const key = `__idb:icon:${iconId}__`
  await idbPut(key, dataUrl)
  return key
}

export async function loadIconBlob(idbRef: string): Promise<string | null> {
  return idbGet(idbRef)
}

export function isIconBlobRef(image: string): boolean {
  return !!image && image.startsWith('__idb:icon:')
}

// ── دوال الإعدادات والخلفية ───────────────────────────────────────────────────

export function loadSettings(): DesktopSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as DesktopSettings
  } catch { return DEFAULT_SETTINGS }
}

export function saveSettings(settings: DesktopSettings) {
  if (typeof window === 'undefined') return
  const { wallpaper, ...rest } = settings
  const wallpaperToStore = wallpaper.startsWith('data:') ? '__idb__' : wallpaper
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...rest, wallpaper: wallpaperToStore }))
  } catch { /* ignore */ }
}

export async function saveWallpaperBlob(dataUrl: string): Promise<void> {
  await idbPut(WALLPAPER_KEY, dataUrl)
}

export async function loadWallpaperBlob(): Promise<string | null> {
  return idbGet(WALLPAPER_KEY)
}
