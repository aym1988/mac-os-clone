'use client'

import React, { useEffect, useRef } from 'react'
import { DesktopSettings } from '@/lib/desktop-types'
import { Language, t } from '@/lib/i18n'

interface ContextMenuProps {
  x: number
  y: number
  type: 'desktop' | 'icon'
  settings: DesktopSettings
  lang: Language
  onAddIcon: () => void
  onOpenLink: () => void
  onEditIcon: () => void
  onDeleteIcon: () => void
  onAutoAlign: () => void
  onResetDesktop: () => void
  onExport: () => void
  onImport: () => void
  onClose: () => void
}

export default function ContextMenu({
  x, y, type, settings, lang,
  onAddIcon, onOpenLink, onEditIcon, onDeleteIcon,
  onAutoAlign, onResetDesktop, onExport, onImport, onClose
}: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const rtl = lang === 'ar'

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    setTimeout(() => {
      window.addEventListener('mousedown', handleClick)
      window.addEventListener('keydown', handleKey)
    }, 0)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Adjust position to prevent overflow
  const menuWidth = 200
  const menuHeight = 280
  const adjX = x + menuWidth > window.innerWidth ? x - menuWidth : x
  const adjY = y + menuHeight > window.innerHeight ? y - menuHeight : y

  const MenuItem = ({
    label,
    onClick,
    danger = false,
    separator = false,
  }: {
    label: string
    onClick: () => void
    danger?: boolean
    separator?: boolean
  }) => (
    <>
      {separator && <div className="my-1 border-t border-white/10" />}
      <button
        onClick={() => { onClick(); onClose() }}
        className={`w-full text-start px-3 py-1.5 text-sm rounded-md transition-colors ${
          danger
            ? 'text-red-400 hover:bg-red-500/15'
            : 'text-white/85 hover:bg-white/10'
        }`}
      >
        {label}
      </button>
    </>
  )

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] py-1.5 px-1.5 shadow-2xl border border-white/10 select-none"
      style={{
        left: adjX,
        top: adjY,
        width: menuWidth,
        background: 'rgba(20, 22, 30, 0.96)',
        backdropFilter: `blur(${settings.uiBlurIntensity}px)`,
        borderRadius: Math.min(settings.cornerRadius, 12),
        direction: rtl ? 'rtl' : 'ltr',
        animation: settings.animationsEnabled ? 'contextMenuIn 0.12s ease-out' : 'none',
      }}
    >
      {type === 'icon' ? (
        <>
          <MenuItem label={t(lang, 'openLink')} onClick={onOpenLink} />
          <MenuItem label={t(lang, 'editIcon')} onClick={onEditIcon} />
          <MenuItem label={t(lang, 'deleteIcon')} onClick={onDeleteIcon} danger separator />
        </>
      ) : (
        <>
          <MenuItem label={t(lang, 'addIcon')} onClick={onAddIcon} />
          <MenuItem label={t(lang, 'autoAlign')} onClick={onAutoAlign} separator />
          <MenuItem label={t(lang, 'exportLayout')} onClick={onExport} separator />
          <MenuItem label={t(lang, 'importLayout')} onClick={onImport} />
          <MenuItem label={t(lang, 'resetDesktop')} onClick={onResetDesktop} danger separator />
        </>
      )}
    </div>
  )
}
