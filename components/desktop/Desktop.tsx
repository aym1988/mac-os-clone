'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { DesktopIcon, DesktopSettings, ContextMenuState, EditModalState } from '@/lib/desktop-types'
import { loadIcons, saveIcons, loadSettings, saveSettings, DEFAULT_ICONS, DEFAULT_SETTINGS, saveWallpaperBlob, loadWallpaperBlob, loadIconBlob, isIconBlobRef } from '@/lib/desktop-storage'
import { Language, t } from '@/lib/i18n'
import DesktopCanvas from './DesktopCanvas'
import SettingsPanel from './SettingsPanel'
import IconModal from './IconModal'
import ContextMenu from './ContextMenu'
import SearchBar from './SearchBar'
import ClockWidget from './ClockWidget'
import StickyNoteWidget from './StickyNoteWidget'
import YouTubeWidget from './YouTubeWidget'

export default function Desktop() {
  const [icons, setIcons] = useState<DesktopIcon[]>([])
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  const [showSettings, setShowSettings] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [editModal, setEditModal] = useState<EditModalState | null>(null)
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [clickAnim, setClickAnim] = useState<string | null>(null)

  const importFileRef = useRef<HTMLInputElement>(null)
  const lang: Language = settings.language

  // Load from localStorage on mount, then restore large blobs from IndexedDB
  useEffect(() => {
    const savedIcons = loadIcons()
    const savedSettings = loadSettings()

    // Restore icon images that were stored in IndexedDB
    const restoreIconImages = async (rawIcons: DesktopIcon[]) => {
      const resolved = await Promise.all(
        rawIcons.map(async (ic) => {
          if (ic.image && isIconBlobRef(ic.image)) {
            const blob = await loadIconBlob(ic.image)
            return { ...ic, image: blob ?? '' }
          }
          return ic
        })
      )
      setIcons(resolved)
    }

    restoreIconImages(savedIcons)

    // If settings had a data-URL wallpaper previously stored in IDB, restore it
    if (savedSettings.wallpaper === '__idb__') {
      loadWallpaperBlob().then((blob) => {
        setSettings({ ...savedSettings, wallpaper: blob ?? DEFAULT_SETTINGS.wallpaper })
      })
    } else {
      setSettings(savedSettings)
    }
    setMounted(true)
  }, [])

  // Persist icons
  useEffect(() => {
    if (mounted) saveIcons(icons)
  }, [icons, mounted])

  // Persist settings — also save large wallpaper blobs to IndexedDB
  useEffect(() => {
    if (!mounted) return
    saveSettings(settings)
    if (settings.wallpaper.startsWith('data:')) {
      saveWallpaperBlob(settings.wallpaper)
    }
  }, [settings, mounted])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
      }
      if (e.key === 'Escape') {
        setContextMenu(null)
        setSelectedIconId(null)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleSettingsChange = useCallback((partial: Partial<DesktopSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  const handleIconsChange = useCallback((updated: DesktopIcon[]) => {
    setIcons(updated)
  }, [])

  const handleIconClick = useCallback((icon: DesktopIcon) => {
    setSelectedIconId(icon.id)
    setClickAnim(icon.id)
    setTimeout(() => setClickAnim(null), 300)
    if (icon.url) {
      window.open(icon.url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleContextMenu = useCallback((state: ContextMenuState) => {
    setContextMenu(state)
  }, [])

  const handleSaveIcon = useCallback(async (icon: DesktopIcon) => {
    // If image is an IDB ref, resolve it to a data URL for immediate display
    let displayIcon = icon
    if (icon.image && isIconBlobRef(icon.image)) {
      const blob = await loadIconBlob(icon.image)
      if (blob) displayIcon = { ...icon, image: blob }
    }
    setIcons((prev) => {
      const idx = prev.findIndex((ic) => ic.id === displayIcon.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = displayIcon
        return updated
      }
      return [...prev, displayIcon]
    })
    setEditModal(null)
  }, [])

  const handleDeleteIcon = useCallback((id: string) => {
    setIcons((prev) => prev.filter((ic) => ic.id !== id))
    setSelectedIconId(null)
  }, [])

  const handleAutoAlign = useCallback(() => {
    const iconW = settings.iconSize + settings.iconSpacing
    const iconH = settings.iconSize + 40 + settings.iconSpacing
    const perRow = Math.floor((window.innerHeight - settings.desktopPadding * 2) / iconH)
    setIcons((prev) =>
      prev.map((ic, i) => ({
        ...ic,
        x: settings.desktopPadding + Math.floor(i / perRow) * (iconW + 8),
        y: settings.desktopPadding + (i % perRow) * iconH,
      }))
    )
  }, [settings])

  const handleExport = useCallback(() => {
    const data = { icons, settings }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'desktop-layout.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [icons, settings])

  const handleImport = useCallback(() => {
    importFileRef.current?.click()
  }, [])

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.icons) setIcons(data.icons)
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings }))
      } catch {}
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const handleResetDesktop = useCallback(() => {
    setConfirmReset(true)
  }, [])

  const confirmResetAction = useCallback(() => {
    setIcons(DEFAULT_ICONS)
    setSettings(DEFAULT_SETTINGS)
    setConfirmReset(false)
  }, [])

  if (!mounted) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
      </div>
    )
  }

  const isDark = settings.theme === 'dark'
  const rtl = lang === 'ar'
  const contextIconId = contextMenu?.iconId ?? null
  const contextIcon = contextIconId ? icons.find((ic) => ic.id === contextIconId) : null

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ direction: rtl ? 'rtl' : 'ltr', fontFamily: 'inherit' }}
    >
      {/* Smart Wallpaper: Image or Video */}
      {settings.wallpaper?.includes('video') || settings.wallpaper?.match(/\.(mp4|webm)$/i) ? (
        <video
          key={settings.wallpaper}
          src={settings.wallpaper}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: settings.wallpaperBlur > 0 ? `blur(${settings.wallpaperBlur}px)` : 'none',
            transform: settings.wallpaperBlur > 0 ? 'scale(1.05)' : 'none',
          }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${settings.wallpaper})`,
            filter: settings.wallpaperBlur > 0 ? `blur(${settings.wallpaperBlur}px)` : 'none',
            transform: settings.wallpaperBlur > 0 ? 'scale(1.05)' : 'none',
          }}
        />
      )}

      {/* Overlay tint for light/dark */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? 'rgba(0,0,0,0.18)'
            : 'rgba(255,255,255,0.12)',
        }}
      />
      
      {/* الأدوات العائمة (Widgets) */}
      <ClockWidget lang={lang} isDark={isDark} />
      <StickyNoteWidget />
      <YouTubeWidget />

      {/* Desktop canvas with icons */}
      <DesktopCanvas
        icons={icons}
        settings={settings}
        lang={lang}
        selectedIconId={selectedIconId}
        onIconsChange={handleIconsChange}
        onIconClick={handleIconClick}
        onContextMenu={handleContextMenu}
        onDesktopClick={() => { setSelectedIconId(null); setContextMenu(null) }}
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2"
        style={{
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: `blur(${settings.uiBlurIntensity / 2}px)`,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          direction: rtl ? 'rtl' : 'ltr',
        }}
      >
        {/* Left: app name + time */}
        <div className="flex items-center gap-3">
          <span className="text-white/90 font-medium text-sm">{t(lang, 'appName')}</span>
          <Clock />
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <TopBarButton
            onClick={() => setShowSearch(true)}
            title={t(lang, 'search')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </TopBarButton>

          {/* Add icon */}
          <TopBarButton
            onClick={() => setEditModal({ mode: 'add', spawnX: 100, spawnY: 100 })}
            title={t(lang, 'addIcon')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </TopBarButton>

          {/* Settings */}
          <TopBarButton
            onClick={() => setShowSettings(true)}
            title={t(lang, 'settings')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </TopBarButton>

          {/* Theme toggle */}
          <TopBarButton
            onClick={() => handleSettingsChange({ theme: isDark ? 'light' : 'dark' })}
            title={isDark ? t(lang, 'lightMode') : t(lang, 'darkMode')}
          >
            {isDark ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1M4.22 4.22l.71.71m12.14 12.14.71.71M3 12H2m20 0h-1M4.22 19.78l.71-.71M18.36 5.64l.71-.71M12 5a7 7 0 000 14A7 7 0 0012 5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            )}
          </TopBarButton>

          {/* Language toggle */}
          <TopBarButton
            onClick={() => handleSettingsChange({ language: lang === 'ar' ? 'en' : 'ar' })}
            title={lang === 'ar' ? 'English' : 'العربية'}
          >
            <span className="text-xs font-medium">{lang === 'ar' ? 'EN' : 'ع'}</span>
          </TopBarButton>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type={contextMenu.type}
          settings={settings}
          lang={lang}
          onAddIcon={() => setEditModal({ mode: 'add', spawnX: contextMenu.x, spawnY: contextMenu.y })}
          onOpenLink={() => contextIcon && window.open(contextIcon.url, '_blank', 'noopener,noreferrer')}
          onEditIcon={() => contextIcon && setEditModal({ mode: 'edit', icon: contextIcon })}
          onDeleteIcon={() => contextIconId && handleDeleteIcon(contextIconId)}
          onAutoAlign={handleAutoAlign}
          onResetDesktop={handleResetDesktop}
          onExport={handleExport}
          onImport={handleImport}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Settings panel */}
      {showSettings && (
        <SettingsPanel
          settings={settings}
          lang={lang}
          onSettingsChange={handleSettingsChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Icon edit/add modal */}
      {editModal && (
        <IconModal
          mode={editModal.mode}
          icon={editModal.icon}
          settings={settings}
          lang={lang}
          spawnX={editModal.spawnX}
          spawnY={editModal.spawnY}
          onSave={handleSaveIcon}
          onDelete={editModal.mode === 'edit' ? handleDeleteIcon : undefined}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* Search */}
      {showSearch && (
        <SearchBar
          icons={icons}
          settings={settings}
          lang={lang}
          onSelect={(ic) => {
            setSelectedIconId(ic.id)
            if (ic.url) window.open(ic.url, '_blank', 'noopener,noreferrer')
          }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {/* Confirm reset */}
      {confirmReset && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div
            className="p-6 space-y-4 border border-white/10 shadow-2xl"
            style={{
              width: 320,
              background: 'rgba(20, 22, 30, 0.97)',
              backdropFilter: `blur(${settings.uiBlurIntensity}px)`,
              borderRadius: settings.cornerRadius,
              direction: rtl ? 'rtl' : 'ltr',
            }}
          >
            <p className="text-sm text-white/80 leading-relaxed">{t(lang, 'confirmReset')}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-2 rounded-lg text-sm bg-white/8 border border-white/10 text-white/60 hover:bg-white/12"
              >
                {t(lang, 'no')}
              </button>
              <button
                onClick={confirmResetAction}
                className="flex-1 py-2 rounded-lg text-sm bg-red-500/80 border border-red-400/40 text-white hover:bg-red-500"
              >
                {t(lang, 'yes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
    </div>
  )
}

function TopBarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
    >
      {children}
    </button>
  )
}

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return <span className="text-white/60 text-xs tabular-nums" suppressHydrationWarning>{time}</span>
}