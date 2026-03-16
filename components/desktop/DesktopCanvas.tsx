'use client'

import React, { useRef, useCallback, useEffect } from 'react'
import { DesktopIcon, DesktopSettings, ContextMenuState } from '@/lib/desktop-types'
import { Language } from '@/lib/i18n'
import DesktopIconItem from './DesktopIconItem'

interface DesktopCanvasProps {
  icons: DesktopIcon[]
  settings: DesktopSettings
  lang: Language
  selectedIconId: string | null
  onIconsChange: (icons: DesktopIcon[]) => void
  onIconClick: (icon: DesktopIcon) => void
  onContextMenu: (state: ContextMenuState) => void
  onDesktopClick: () => void
}

export default function DesktopCanvas({
  icons,
  settings,
  lang,
  selectedIconId,
  onIconsChange,
  onIconClick,
  onContextMenu,
  onDesktopClick,
}: DesktopCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{
    iconId: string
    startMouseX: number
    startMouseY: number
    startIconX: number
    startIconY: number
    moved: boolean
  } | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, iconId: string) => {
    if (e.button !== 0) return
    e.stopPropagation()
    const icon = icons.find((ic) => ic.id === iconId)
    if (!icon) return
    dragRef.current = {
      iconId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startIconX: icon.x,
      startIconY: icon.y,
      moved: false,
    }
  }, [icons])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startMouseX
      const dy = e.clientY - dragRef.current.startMouseY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        dragRef.current.moved = true
      }
      if (!dragRef.current.moved) return

      const canvas = canvasRef.current
      if (!canvas) return
      const bounds = canvas.getBoundingClientRect()

      const newX = Math.max(settings.desktopPadding, Math.min(
        dragRef.current.startIconX + dx,
        bounds.width - settings.iconSize - settings.desktopPadding
      ))
      const newY = Math.max(settings.desktopPadding, Math.min(
        dragRef.current.startIconY + dy,
        bounds.height - settings.iconSize - 40 - settings.desktopPadding
      ))

      onIconsChange(
        icons.map((ic) =>
          ic.id === dragRef.current!.iconId ? { ...ic, x: newX, y: newY } : ic
        )
      )
    }

    const handleMouseUp = () => {
      dragRef.current = null
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [icons, settings, onIconsChange])

  const handleIconClick = useCallback((e: React.MouseEvent, icon: DesktopIcon) => {
    e.stopPropagation()
    if (dragRef.current?.moved) return
    onIconClick(icon)
  }, [onIconClick])

  const handleContextMenu = useCallback((e: React.MouseEvent, iconId: string) => {
    e.preventDefault()
    e.stopPropagation()
    onContextMenu({ x: e.clientX, y: e.clientY, type: 'icon', iconId })
  }, [onContextMenu])

  const handleDesktopContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onContextMenu({ x: e.clientX, y: e.clientY, type: 'desktop' })
  }, [onContextMenu])

  const handleDesktopClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement) === canvasRef.current) {
      onDesktopClick()
    }
  }, [onDesktopClick])

  return (
    <div
      ref={canvasRef}
      className="absolute inset-0 overflow-hidden"
      style={{
        backgroundImage: settings.showGrid
          ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)'
          : 'none',
        backgroundSize: settings.showGrid ? '80px 80px' : 'auto',
      }}
      onClick={handleDesktopClick}
      onContextMenu={handleDesktopContextMenu}
    >
      {icons.map((icon) => (
        <DesktopIconItem
          key={icon.id}
          icon={icon}
          settings={settings}
          lang={lang}
          isSelected={selectedIconId === icon.id}
          isDragging={dragRef.current?.iconId === icon.id && dragRef.current?.moved === true}
          onMouseDown={handleMouseDown}
          onClick={handleIconClick}
          onContextMenu={handleContextMenu}
        />
      ))}
    </div>
  )
}
