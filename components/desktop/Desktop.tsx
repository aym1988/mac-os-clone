'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { DesktopIcon, DesktopSettings, ContextMenuState, EditModalState } from '@/lib/desktop-types'
import { 
  loadIcons, saveIcons, loadSettings, saveSettings, 
  DEFAULT_ICONS, DEFAULT_SETTINGS, saveWallpaperBlob, 
  loadWallpaperBlob, loadIconBlob, saveIconBlob, isIconBlobRef 
} from '@/lib/desktop-storage'
import DesktopCanvas from './DesktopCanvas'
import SettingsPanel from './SettingsPanel'
import IconModal from './IconModal'
import ContextMenu from './ContextMenu'
import SearchBar from './SearchBar'
import ClockWidget from './ClockWidget'

export default function Desktop() {
  const [icons, setIcons] = useState<DesktopIcon[]>([])
  const [settings, setSettings] = useState<DesktopSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [editModal, setEditModal] = useState<EditModalState | null>(null)
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null)

  const lang = settings.language

  useEffect(() => {
    const init = async () => {
      const savedIcons = loadIcons()
      const savedSettings = loadSettings()
      
      const resolved = await Promise.all(savedIcons.map(async (ic) => {
        if (ic.image && isIconBlobRef(ic.image)) {
          const blob = await loadIconBlob(ic.image)
          return { ...ic, image: blob ?? '' }
        }
        return ic
      }))
      
      setIcons(resolved)
      // إجبار الإعدادات على عرض نقي 100%
      const finalSettings = { ...savedSettings, wallpaperBlur: 0 };
      
      if (savedSettings.wallpaper === '__idb__') {
        const blob = await loadWallpaperBlob()
        setSettings({ ...finalSettings, wallpaper: blob ?? DEFAULT_SETTINGS.wallpaper })
      } else {
        setSettings(finalSettings)
      }
      setMounted(true)
    }
    init()
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* طبقة الخلفية - نقية 100% بدون أي إضافات */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {settings.wallpaper?.match(/\.(mp4|webm)$/i) || settings.wallpaper?.includes('video') ? (
          <video
            src={settings.wallpaper}
            autoPlay loop muted playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${settings.wallpaper})` }}
          />
        )}
      </div>

      {/* ملاحظة: تم حذف طبقة التظليل (Overlay) التي كانت تسبب اللون الرصاصي */}

      <DesktopCanvas
        icons={icons}
        settings={settings}
        lang={lang}
        selectedIconId={selectedIconId}
        onIconsChange={setIcons}
        onIconClick={(ic) => { setSelectedIconId(ic.id); if (ic.url) window.open(ic.url, '_blank') }}
        onContextMenu={setContextMenu}
        onDesktopClick={() => { setSelectedIconId(null); setContextMenu(null) }}
      />

      {/* شريط علوي بسيط لا يؤثر على لون الخلفية */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-black/10 border-b border-white/5">
        <div className="text-white/90 text-sm font-medium">Desktop OS</div>
        <div className="flex gap-4">
           <button onClick={() => setShowSearch(true)} className="text-white/80 hover:text-white">بحث</button>
           <button onClick={() => setShowSettings(true)} className="text-white/80 hover:text-white">الإعدادات</button>
        </div>
      </div>

      {/* القوائم والملحقات */}
      {showSettings && <SettingsPanel settings={settings} lang={lang} onSettingsChange={(s) => setSettings(prev => ({...prev, ...s, wallpaperBlur: 0}))} onClose={() => setShowSettings(false)} />}
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} type={contextMenu.type} settings={settings} lang={lang} onClose={() => setContextMenu(null)} onAddIcon={() => setEditModal({mode:'add'})} />}
    </div>
  )
}
