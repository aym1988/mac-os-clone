'use client'

import React, { useRef, useCallback } from 'react'
import { DesktopIcon, DesktopSettings, HoverAnimation } from '@/lib/desktop-types'
import { Language, t } from '@/lib/i18n'

interface DesktopIconItemProps {
  icon: DesktopIcon
  settings: DesktopSettings
  lang: Language
  isSelected: boolean
  isDragging: boolean
  onMouseDown: (e: React.MouseEvent, iconId: string) => void
  onClick: (e: React.MouseEvent, icon: DesktopIcon) => void
  onContextMenu: (e: React.MouseEvent, iconId: string) => void
}

function getHoverClass(anim: HoverAnimation, enabled: boolean): string {
  if (!enabled) return ''
  switch (anim) {
    case 'scale': return 'hover:scale-110 transition-transform duration-150'
    case 'bounce': return 'hover:-translate-y-2 transition-transform duration-200'
    case 'glow': return 'hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] transition-all duration-200'
    case 'lift': return 'hover:-translate-y-1 hover:drop-shadow-2xl transition-all duration-150'
    default: return ''
  }
}

export default function DesktopIconItem({
  icon,
  settings,
  lang,
  isSelected,
  isDragging,
  onMouseDown,
  onClick,
  onContextMenu,
}: DesktopIconItemProps) {
  const label = lang === 'ar' && icon.labelAr ? icon.labelAr : icon.label
  const hoverClass = getHoverClass(settings.iconHoverAnimation, settings.animationsEnabled)
  const radius = settings.cornerRadius

  return (
    <div
      className={`absolute flex flex-col items-center select-none cursor-pointer group ${hoverClass} ${
        isDragging ? 'opacity-80 scale-105 z-50' : 'z-10'
      } ${isSelected ? 'ring-2 ring-white/60 rounded-lg' : ''}`}
      style={{
        left: icon.x,
        top: icon.y,
        width: settings.iconSize + 16,
        transform: isDragging ? 'scale(1.05)' : undefined,
        transition: settings.animationsEnabled && !isDragging ? 'transform 0.15s ease, opacity 0.15s ease' : 'none',
      }}
      onMouseDown={(e) => onMouseDown(e, icon.id)}
      onClick={(e) => onClick(e, icon)}
      onContextMenu={(e) => onContextMenu(e, icon.id)}
    >
      {/* الغلاف الجديد: يجمع الأيقونة والاسم معاً ليتحركا كعنصر واحد */}
      <div 
        className="floating-icon flex flex-col items-center w-full"
        style={{ gap: settings.iconSpacing / 2 }}
      >
        {/* Icon image */}
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            width: settings.iconSize,
            height: settings.iconSize,
            borderRadius: radius,
          }}
        >
          {icon.image ? (
            <img
              src={icon.image}
              alt={label}
              draggable={false}
              className="object-contain drop-shadow-md"
              style={{
                width: '100%',
                height: '100%',
                padding: Math.max(4, settings.iconSize * 0.1),
                imageRendering: 'auto',
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                target.nextElementSibling?.removeAttribute('style')
              }}
            />
          ) : null}
          <span
            className="text-2xl drop-shadow-md"
            style={{ display: icon.image ? 'none' : 'block', fontSize: settings.iconSize * 0.5 }}
          >
            🔗
          </span>
        </div>

        {/* Label */}
        <span
          className="text-center leading-tight text-shadow-sm max-w-full truncate px-1"
          style={{
            fontSize: settings.labelSize,
            color: settings.labelColor,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
            maxWidth: settings.iconSize + 24,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}