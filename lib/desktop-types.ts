export interface DesktopIcon {
  id: string
  label: string
  labelAr: string
  url: string
  image: string // URL or base64
  x: number
  y: number
}

export type HoverAnimation = 'scale' | 'bounce' | 'glow' | 'lift' | 'none'

export interface DesktopSettings {
  wallpaper: string
  wallpaperBlur: number
  showGrid: boolean
  desktopPadding: number

  iconSize: number
  iconSpacing: number
  labelSize: number
  labelColor: string
  iconHoverAnimation: HoverAnimation

  animationsEnabled: boolean
  uiBlurIntensity: number
  cornerRadius: number

  theme: 'dark' | 'light'
  language: 'ar' | 'en'
}

export interface ContextMenuState {
  x: number
  y: number
  type: 'desktop' | 'icon'
  iconId?: string
}

export interface EditModalState {
  mode: 'add' | 'edit'
  icon?: DesktopIcon
  spawnX?: number
  spawnY?: number
}

export interface DragState {
  iconId: string
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}
