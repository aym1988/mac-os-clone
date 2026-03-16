'use client'

import React, { useState, useRef } from 'react'
import { DesktopSettings } from '@/lib/desktop-types'
import { Language, t } from '@/lib/i18n'

interface SettingsPanelProps {
  settings: DesktopSettings
  lang: Language
  onSettingsChange: (s: Partial<DesktopSettings>) => void
  onClose: () => void
}

type Tab = 'desktop' | 'icons' | 'interface' | 'theme'

const SliderRow = ({
  label, value, min, max, step = 1, unit = '', onChange, rtl,
}: {
  label: string; value: number; min: number; max: number; step?: number; unit?: string; onChange: (v: number) => void; rtl: boolean
}) => (
  <div className="flex flex-col gap-1">
    <div className="flex justify-between text-xs text-white/70">
      <span>{label}</span>
      <span className="text-white/90 font-medium">{value}{unit}</span>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/20 accent-blue-400"
      dir="ltr"
    />
  </div>
)

const ToggleRow = ({
  label, value, onChange,
}: {
  label: string; value: boolean; onChange: (v: boolean) => void
}) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-white/80">{label}</span>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${value ? 'bg-blue-500' : 'bg-white/20'}`}
    >
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  </div>
)

export default function SettingsPanel({ settings, lang, onSettingsChange, onClose }: SettingsPanelProps) {
  const [tab, setTab] = useState<Tab>('desktop')
  const fileRef = useRef<HTMLInputElement>(null)
  const rtl = lang === 'ar'

  const tabs: { id: Tab; label: string }[] = [
    { id: 'desktop', label: t(lang, 'desktopSettings') },
    { id: 'icons', label: t(lang, 'iconSettings') },
    { id: 'interface', label: t(lang, 'interfaceSettings') },
    { id: 'theme', label: t(lang, 'themeLanguage') },
  ]

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onSettingsChange({ wallpaper: ev.target?.result as string })
    }
    reader.readAsDataURL(file)
  }

  const animationOptions = [
    { value: 'none', label: t(lang, 'animNone') },
    { value: 'scale', label: t(lang, 'animScale') },
    { value: 'bounce', label: t(lang, 'animBounce') },
    { value: 'glow', label: t(lang, 'animGlow') },
    { value: 'lift', label: t(lang, 'animLift') },
  ]

  // دالة للتحقق مما إذا كانت الخلفية فيديو
  const isVideo = settings.wallpaper?.includes('video') || settings.wallpaper?.match(/\.(mp4|webm)$/i)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="relative flex flex-col overflow-hidden shadow-2xl border border-white/10" style={{ width: 440, maxHeight: '85vh', background: 'rgba(20, 22, 30, 0.92)', backdropFilter: `blur(${settings.uiBlurIntensity}px)`, borderRadius: settings.cornerRadius, direction: rtl ? 'rtl' : 'ltr' }}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-white font-semibold text-base">{t(lang, 'settings')}</span>
          <button onClick={onClose} className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white/70 hover:text-white text-xs transition-colors">×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 py-2 border-b border-white/10 overflow-x-auto">
          {tabs.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${tab === tb.id ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {tab === 'desktop' && (
            <>
              <div className="space-y-2">
                <label className="block text-xs text-white/60 uppercase tracking-wider">{t(lang, 'wallpaper')}</label>
                <div className="flex gap-2 items-center">
                  
                  {/* Smart Preview: Video or Image */}
                  {isVideo ? (
                    <video src={settings.wallpaper} className="w-16 h-10 rounded-lg object-cover flex-shrink-0 border border-white/20" muted />
                  ) : (
                    <div className="w-16 h-10 rounded-lg overflow-hidden border border-white/20 flex-shrink-0" style={{ backgroundImage: `url(${settings.wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  )}

                  <button onClick={() => fileRef.current?.click()} className="flex-1 text-xs px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 border border-white/10 transition-colors">
                    {lang === 'ar' ? 'رفع صورة / فيديو' : 'Upload Image / Video'}
                  </button>
                  {/* تعديل هنا ليقبل الفيديوهات والصور معاً */}
                  <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm" className="hidden" onChange={handleWallpaperUpload} />
                </div>
              </div>

              <SliderRow label={t(lang, 'wallpaperBlur')} value={settings.wallpaperBlur} min={0} max={20} unit="px" onChange={(v) => onSettingsChange({ wallpaperBlur: v })} rtl={rtl} />
              <SliderRow label={t(lang, 'desktopPadding')} value={settings.desktopPadding} min={0} max={80} unit="px" onChange={(v) => onSettingsChange({ desktopPadding: v })} rtl={rtl} />
              <ToggleRow label={t(lang, 'showGrid')} value={settings.showGrid} onChange={(v) => onSettingsChange({ showGrid: v })} />
            </>
          )}

          {tab === 'icons' && (
            <>
              <SliderRow label={t(lang, 'iconSize')} value={settings.iconSize} min={32} max={128} unit="px" onChange={(v) => onSettingsChange({ iconSize: v })} rtl={rtl} />
              <SliderRow label={t(lang, 'iconSpacing')} value={settings.iconSpacing} min={0} max={24} unit="px" onChange={(v) => onSettingsChange({ iconSpacing: v })} rtl={rtl} />
              <SliderRow label={t(lang, 'labelSize')} value={settings.labelSize} min={8} max={20} unit="px" onChange={(v) => onSettingsChange({ labelSize: v })} rtl={rtl} />
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">{t(lang, 'labelColor')}</span>
                <input type="color" value={settings.labelColor} onChange={(e) => onSettingsChange({ labelColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs text-white/60 uppercase tracking-wider">{t(lang, 'hoverAnimation')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {animationOptions.map((opt) => (
                    <button key={opt.value} onClick={() => onSettingsChange({ iconHoverAnimation: opt.value as any })} className={`px-2 py-1.5 rounded-lg text-xs transition-colors border ${settings.iconHoverAnimation === opt.value ? 'bg-blue-500/30 border-blue-400/60 text-blue-300' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'interface' && (
            <>
              <ToggleRow label={t(lang, 'enableAnimations')} value={settings.animationsEnabled} onChange={(v) => onSettingsChange({ animationsEnabled: v })} />
              <SliderRow label={t(lang, 'uiBlur')} value={settings.uiBlurIntensity} min={0} max={40} unit="px" onChange={(v) => onSettingsChange({ uiBlurIntensity: v })} rtl={rtl} />
              <SliderRow label={t(lang, 'cornerRadius')} value={settings.cornerRadius} min={0} max={32} unit="px" onChange={(v) => onSettingsChange({ cornerRadius: v })} rtl={rtl} />
            </>
          )}

          {tab === 'theme' && (
            <>
              <div className="space-y-2">
                <label className="block text-xs text-white/60 uppercase tracking-wider">{t(lang, 'language')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['ar', t(lang, 'arabic')], ['en', t(lang, 'english')]] as const).map(([code, label]) => (
                    <button key={code} onClick={() => onSettingsChange({ language: code })} className={`py-2 rounded-lg text-sm transition-colors border ${settings.language === code ? 'bg-blue-500/30 border-blue-400/60 text-blue-300' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>{label}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs text-white/60 uppercase tracking-wider">{t(lang, 'darkMode')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['dark', t(lang, 'darkMode')], ['light', t(lang, 'lightMode')]] as const).map(([mode, label]) => (
                    <button key={mode} onClick={() => onSettingsChange({ theme: mode })} className={`py-2 rounded-lg text-sm transition-colors border ${settings.theme === mode ? 'bg-blue-500/30 border-blue-400/60 text-blue-300' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>{label}</button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}