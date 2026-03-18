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

  // 1. تحميل البيانات وإجبارية النقاء (إلغاء Blur)
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
      const pureSettings = { ...savedSettings, wallpaperBlur: 0 };

      if (savedSettings.wallpaper === '__idb__') {
        const blob = await loadWallpaperBlob()
        setSettings({ ...pureSettings, wallpaper: blob ?? DEFAULT_SETTINGS.wallpaper })
      } else {
        setSettings(pureSettings)
      }
      setMounted(true)
    }
    initDesktop()
  }, [])

  // 2. مزامنة الحفظ
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

  // 3. وظائف الاستيراد والتصدير المصلحة
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

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string)
        if (data.icons) setIcons(data.icons)
        if (data.settings) setSettings((prev) => ({ ...prev, ...data.settings, wallpaperBlur: 0 }))
      } catch (err) {
        console.error("Import failed", err)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [])

  const confirmResetAction = useCallback(() => {
    setIcons(DEFAULT_ICONS)
    setSettings({ ...DEFAULT_SETTINGS, wallpaperBlur: 0 })
    setConfirmReset(false)
  }, [])

  // 4. معالجة الأيقونات
  const handleSaveIcon = useCallback(async (icon: DesktopIcon) => {
    let displayIcon = icon
    if (icon.image && icon.image.startsWith('data:')) {
      await saveIconBlob(icon.id, icon.image)
    }
    setIcons((prev) => {
      const idx = prev.findIndex((ic) => ic.id === icon.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = icon
        return updated
      }
      return [...prev, icon]
    })
    setEditModal(null)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden bg-black" style={{ direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      
      {/* الخلفية النقية */}
      <div className="absolute inset-0 z-0">
        {settings.wallpaper?.match(/\.(mp4|webm)$/i) || settings.wallpaper?.includes('video') ? (
          <video key={settings.wallpaper} src={settings.wallpaper} autoPlay loop muted playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${settings.wallpaper})` }} />
        )}
      </div>

      <ClockWidget lang={lang} isDark={true} />
      <DesktopCanvas
        icons={icons} settings={settings} lang={lang} selectedIconId={selectedIconId}
        onIconsChange={setIcons} onIconClick={(ic) => setSelectedIconId(ic.id)}
        onContextMenu={setContextMenu} onDesktopClick={() => { setSelectedIconId(null); setContextMenu(null) }}
      />

      {/* الشريط العلوي */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
        <div className="text-white font-medium text-sm">{t(lang, 'appName')}</div>
        <div className="flex items-center gap-2">
           <button onClick={() => setShowSearch(true)} className="p-1 text-white/70 hover:text-white">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2}/></svg>
           </button>
           <button onClick={() => setShowSettings(true)} className="p-1 text-white/70 hover:text-white">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth={2}/></svg>
           </button>
        </div>
      </div>

      {/* القوائم */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x} y={contextMenu.y} type={contextMenu.type} settings={settings} lang={lang}
          onAddIcon={() => setEditModal({ mode: 'add', spawnX: contextMenu.x, spawnY: contextMenu.y })}
          onEditIcon={() => {
             const ic = icons.find(i => i.id === contextMenu.iconId);
             if(ic) setEditModal({ mode: 'edit', icon: ic });
          }}
          onDeleteIcon={() => setIcons(prev => prev.filter(i => i.id !== contextMenu.iconId))}
          onExport={handleExport}
          onImport={() => importFileRef.current?.click()}
          onResetDesktop={() => setConfirmReset(true)}
          onClose={() => setContextMenu(null)}
          onAutoAlign={() => {}} onOpenLink={() => {}}
        />
      )}

      {showSettings && <SettingsPanel settings={settings} lang={lang} onSettingsChange={(s) => setSettings(p => ({...p, ...s, wallpaperBlur: 0}))} onClose={() => setShowSettings(false)} />}
      {editModal && <IconModal mode={editModal.mode} icon={editModal.icon} settings={settings} lang={lang} onSave={handleSaveIcon} onClose={() => setEditModal(null)} />}
      
      {/* نافذة تأكيد إعادة الضبط */}
      {confirmReset && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="p-6 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl text-center space-y-4">
            <p className="text-white/80">{t(lang, 'confirmReset')}</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmReset(false)} className="flex-1 px-4 py-2 bg-white/5 text-white rounded-lg">لا</button>
              <button onClick={confirmResetAction} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg">نعم</button>
            </div>
          </div>
        </div>
      )}

      <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
    </div>
  )
}
