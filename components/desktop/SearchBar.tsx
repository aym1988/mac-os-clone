'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DesktopIcon, DesktopSettings } from '@/lib/desktop-types'
import { Language, t } from '@/lib/i18n'

interface SearchBarProps {
  icons: DesktopIcon[]
  settings: DesktopSettings
  lang: Language
  onSelect: (icon: DesktopIcon) => void
  onClose: () => void
}

export default function SearchBar({ icons, settings, lang, onSelect, onClose }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const rtl = lang === 'ar'

  useEffect(() => {
    inputRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const filtered = query.trim()
    ? icons.filter((ic) => {
        const q = query.toLowerCase()
        return (
          ic.label.toLowerCase().includes(q) ||
          ic.labelAr.toLowerCase().includes(q) ||
          ic.url.toLowerCase().includes(q)
        )
      })
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
      style={{ backdropFilter: 'blur(2px)', backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="flex flex-col overflow-hidden shadow-2xl border border-white/10"
        style={{
          width: 480,
          maxHeight: 400,
          background: 'rgba(20, 22, 30, 0.97)',
          backdropFilter: `blur(${settings.uiBlurIntensity}px)`,
          borderRadius: settings.cornerRadius,
          direction: rtl ? 'rtl' : 'ltr',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <svg className="w-4 h-4 text-white/40 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(lang, 'searchPlaceholder')}
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
          <kbd className="text-xs text-white/30 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">ESC</kbd>
        </div>

        {query.trim() && (
          <div className="flex-1 overflow-y-auto py-1.5">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-white/40">{t(lang, 'noResults')}</div>
            ) : (
              filtered.map((icon) => {
                const label = lang === 'ar' && icon.labelAr ? icon.labelAr : icon.label
                return (
                  <button
                    key={icon.id}
                    onClick={() => { onSelect(icon); onClose() }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {icon.image ? (
                        <img src={icon.image} alt={label} className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-base">🔗</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{label}</div>
                      <div className="text-xs text-white/40 truncate">{icon.url}</div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
