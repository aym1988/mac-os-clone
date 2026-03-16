'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Language } from '@/lib/i18n'

interface ClockState {
  x: number
  y: number
  scale: number
}

export default function ClockWidget({ lang, isDark }: { lang: Language, isDark: boolean }) {
  const [time, setTime] = useState(new Date())
  const [widgetState, setWidgetState] = useState<ClockState>({
    x: window.innerWidth / 2 - 100, // المنتصف تقريباً
    y: 100,
    scale: 1,
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 })

  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({ startY: 0, initScale: 1 })

  // جلب إعدادات الساعة المحفوظة عند فتح الموقع
  useEffect(() => {
    const saved = localStorage.getItem('desktop-clock-state')
    if (saved) {
      try {
        setWidgetState(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  // حفظ الإعدادات تلقائياً عند تغيير المكان أو الحجم
  useEffect(() => {
    localStorage.setItem('desktop-clock-state', JSON.stringify(widgetState))
  }, [widgetState])

  // تحديث الوقت كل ثانية
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // منطق السحب (Drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setWidgetState(prev => ({
        ...prev,
        x: dragRef.current.initX + dx,
        y: dragRef.current.initY + dy
      }))
    }
    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  // منطق تغيير الحجم (Resize)
  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (!isResizing) return
      const dy = e.clientY - resizeRef.current.startY
      // تحديد الحد الأدنى والأقصى للحجم
      const newScale = Math.max(0.5, Math.min(3, resizeRef.current.initScale + (dy * 0.01)))
      setWidgetState(prev => ({ ...prev, scale: newScale }))
    }
    const handleResizeUp = () => setIsResizing(false)

    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove)
      window.addEventListener('mouseup', handleResizeUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleResizeMove)
      window.removeEventListener('mouseup', handleResizeUp)
    }
  }, [isResizing])

  const handleMouseDown = (e: React.MouseEvent) => {
    // تجاهل السحب إذا كان المستخدم يضغط على زر تغيير الحجم
    if ((e.target as HTMLElement).closest('.resize-handle')) return
    e.stopPropagation()
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: widgetState.x,
      initY: widgetState.y
    }
  }

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    resizeRef.current = {
      startY: e.clientY,
      initScale: widgetState.scale
    }
  }

  // تنسيق الوقت والتاريخ بناءً على اللغة
  const locale = lang === 'ar' ? 'ar-EG' : 'en-US'
  const timeString = time.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const dateString = time.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div
      className={`absolute rounded-3xl shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing select-none group border z-10 transition-colors duration-300 ${
        isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-white/40 border-black/10 text-black'
      }`}
      style={{
        left: widgetState.x,
        top: widgetState.y,
        transform: `scale(${widgetState.scale})`,
        transformOrigin: 'top left',
        padding: '1.5rem 2rem',
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.stopPropagation()} // لمنع ظهور القائمة المنسدلة لسطح المكتب فوق الساعة
    >
      <div className="flex flex-col items-center justify-center pointer-events-none">
        <span className="text-6xl font-light tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {timeString}
        </span>
        <span className="text-sm font-medium opacity-70 mt-2 tracking-wide">
          {dateString}
        </span>
      </div>

      {/* زر تغيير الحجم يظهر عند تمرير الماوس */}
      <div
        className="resize-handle absolute bottom-2 right-2 w-6 h-6 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/10 dark:bg-white/10 rounded-full hover:bg-black/20 dark:hover:bg-white/20"
        onMouseDown={handleResizeDown}
        title={lang === 'ar' ? 'اسحب لتغيير الحجم' : 'Drag to resize'}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 15 21 21 15 21"></polyline>
          <line x1="21" y1="21" x2="15" y2="15"></line>
        </svg>
      </div>
    </div>
  )
}