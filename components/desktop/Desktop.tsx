'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { DesktopIcon, DesktopSettings, ContextMenuState, EditModalState } from '@/lib/desktop-types'
import { 
  loadIcons, 
  saveIcons, 
  loadSettings, 
  saveSettings, 
  DEFAULT_ICONS, 
  DEFAULT_SETTINGS, 
  saveWallpaperBlob, 
  loadWallpaperBlob, 
  loadIconBlob, 
  saveIconBlob,
  isIconBlobRef 
} from '@/lib/desktop-storage'
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

  const importFileRef = useRef<HTMLInputElement>(null)
  const lang: Language = settings.language

  useEffect(() => {
    const initDesktop = async () => {
      const savedIcons = loadIcons()
      const savedSettings = loadSettings()

      const resolvedIcons = await Promise.all(
        savedIcons.map(async (ic) => {
          if (ic.image && isIconBlobRef(ic.image)) {
            const blob = await loadIconBlob(ic.image)
            return { ...ic, image: blob ?? '' }
          }
          return ic
        })
      )
      
      setIcons(resolvedIcons)

      if (savedSettings.wallpaper === '__idb__') {
        const blob = await loadWallpaperBlob()
        setSettings({ ...savedSettings, wallpaper: blob ?? DEFAULT_SETTINGS.wallpaper, wallpaperBlur: 0 })
      } else {
        // إجبار البروز (Blur) على 0 لضمان النقاء
        setSettings({ ...savedSettings, wallpaperBlur: 0 })
      }
      setMounted(true)
    }

    initDesktop()
  }, [])

  useEffect(() => {
    const persist = async () => {
      if (!mounted) return
      for (const icon of icons) {
        if (icon.image && icon.image.startsWith('data:')) {
          await saveIconBlob(icon.id, icon.image)
        }
      }
      saveIcons(icons)
    }
    persist()
  }, [icons, mounted])

  useEffect(() => {
    if (!mounted) return
    saveSettings(settings)
    if (settings.wallpaper.startsWith('data:')) {
      saveWallpaperBlob(settings.wallpaper)
    }
  }, [settings, mounted])

  const handleSettingsChange = useCallback((partial: Partial<DesktopSettings>) => {
    // نمنع أي محاولة لإضافة ضبابية برمجياً
    if ('wallpaperBlur' in partial) partial.wallpaperBlur = 0;
    setSettings((prev) => ({ ...prev, ...partial }))
  }, [])

  const handleIconsChange = useCallback((updated: DesktopIcon[]) => {
    setIcons(updated)
  }, [])

  const handleIconClick = useCallback((icon: DesktopIcon) => {
    setSelectedIconId(icon.id)
    if (icon.url) {
      window.open(icon.url, '_blank', 'noopener,noreferrer')
    }
  }, [])

  const handleSaveIcon = useCallback(async (icon: DesktopIcon) => {
    let displayIcon = icon
    if (icon.image && icon.image.startsWith('data:')) {
      await saveIconBlob(icon.id, icon.image)
    } else if (icon.image && isIconBlobRef(icon.image)) {
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

  if (!mounted) return null

  const rtl = lang === 'ar'
  const contextIconId = contextMenu?.iconId ?? null
  const contextIcon = contextIconId ? icons.find((ic) => ic.id === contextIconId) : null

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ direction: rtl ? 'rtl' : 'ltr' }}>
      
      {/* طبقة الخلفية: نقية تماماً بدون فلاتر */}
      <div className="absolute inset-0 z-0">
        {settings.wallpaper?.includes('video') || settings.wallpaper?.match(/\.(mp4|webm)$/i) ? (
          <video
            key={settings.wallpaper}
            src={settings.wallpaper}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${settings.wallpaper})` }}
          />
        )}
      </div>

      {/* تمت إزالة طبقة الـ Overlay اللونية هنا لضمان نقاء الألوان */}
      
      <ClockWidget lang={lang} isDark={true} />
      <StickyNoteWidget />
      <YouTubeWidget />

      <DesktopCanvas
        icons={icons}
        settings={settings}
        lang={lang}
        selectedIconId={selectedIconId}
        onIconsChange={handleIconsChange}
        onIconClick={handleIconClick}
        onContextMenu={(state) => setContextMenu(state)}
        onDesktopClick={() => { setSelectedIconId(null); setContextMenu(null) }}
      />

      {/* الشريط العلوي شفاف تماماً لعدم التشويش على الفيديو */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2"
        style={{
          background: 'rgba(0,0,0,0.15)', // شفافية خفيفة جداً للقراءة فقط
          backdropFilter: 'none', // إزالة الضبابية من الشريط العلوي أيضاً
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-white font-medium text-sm shadow-sm">{t(lang, 'appName')}</span>
        </div>

        <div className="flex items-center gap-2">
          <TopBarButton onClick={() => setShowSearch(true)} title={t(lang, 'search')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </TopBarButton>
          <TopBarButton onClick={() => setShowSettings(true)} title={t(lang, 'settings')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </TopBarButton>
        </div>
      </div>

      {/* باقي المكونات (قائمة السياق، الإعدادات، إلخ) */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} type={contextMenu.type} settings={settings} lang={lang}
          onAddIcon={() => setEditModal({ mode: 'add', spawnX: contextMenu.x, spawnY: contextMenu.y })}
          onEditIcon={() => contextIcon && setEditModal({ mode: 'edit', icon: contextIcon })}
          onDeleteIcon={() => contextIconId && handleDeleteIcon(contextIconId)}
          onClose={() => setContextMenu(null)}
          onAutoAlign={() => {}} onResetDesktop={() => setConfirmReset(true)} onExport={() => {}} onImport={() => {}} onOpenLink={() => {}}
        />
      )}

      {showSettings && <SettingsPanel settings={settings} lang={lang} onSettingsChange={handleSettingsChange} onClose={() => setShowSettings(false)} />}
      {editModal && <IconModal mode={editModal.mode} icon={editModal.icon} settings={settings} lang={lang} spawnX={editModal.spawnX} spawnY={editModal.spawnY} onSave={handleSaveIcon} onDelete={handleDeleteIcon} onClose={() => setEditModal(null)} />}
      {showSearch && <SearchBar icons={icons} settings={settings} lang={lang} onSelect={(ic) => { setSelectedIconId(ic.id); if (ic.url) window.open(ic.url, '_blank') }} onClose={() => setShowSearch(false)} />}
    </div>
  )
}

function TopBarButton({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title?: string }) {
  return (
    <button onClick={onClick} title={title} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/90 hover:bg-white/20 transition-colors">
      {children}
    </button>
  )
}
