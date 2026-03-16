'use client'

import React, { useState, useEffect, useRef } from 'react'

interface StickyNoteState {
  x: number
  y: number
  width: number
  height: number
  text: string
}

export default function StickyNoteWidget() {
  const [state, setState] = useState<StickyNoteState>({
    x: 80,
    y: 250,
    width: 280,
    height: 280,
    text: ''
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 })

  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({ startX: 0, startY: 0, initW: 0, initH: 0 })

  // جلب الملاحظات المحفوظة عند فتح الموقع
  useEffect(() => {
    const saved = localStorage.getItem('desktop-sticky-note')
    if (saved) {
      try {
        setState(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  // حفظ الملاحظات والمكان والحجم تلقائياً
  useEffect(() => {
    localStorage.setItem('desktop-sticky-note', JSON.stringify(state))
  }, [state])

  // منطق السحب (Drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setState(prev => ({
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
      const dx = e.clientX - resizeRef.current.startX
      const dy = e.clientY - resizeRef.current.startY
      setState(prev => ({
        ...prev,
        width: Math.max(200, resizeRef.current.initW + dx), // أقل عرض 200px
        height: Math.max(200, resizeRef.current.initH + dy) // أقل طول 200px
      }))
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
    // منع السحب عند الضغط على منطقة الكتابة أو زر تغيير الحجم
    if ((e.target as HTMLElement).closest('.no-drag')) return
    e.stopPropagation()
    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: state.x,
      initY: state.y
    }
  }

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initW: state.width,
      initH: state.height
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setState(prev => ({ ...prev, text: e.target.value }))
  }

  return (
    <div
      className="absolute shadow-2xl flex flex-col z-10 group"
      style={{
        left: state.x,
        top: state.y,
        width: state.width,
        height: state.height,
        backgroundColor: '#fef9c3', // أصفر فاتح جداً يشبه الورق
        borderRadius: '2px', // زوايا حادة قليلاً للورقة
        borderRadius: '0px', // حواف حادة بالكامل من جميع الجهات
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.stopPropagation()} // منع ظهور قائمة سطح المكتب
    >
      {/* الشريط العلوي للسحب والدبوس */}
      <div className="h-8 w-full cursor-grab active:cursor-grabbing flex items-center justify-center relative">
        {/* الدبوس الأحمر */}
        <div className="w-3.5 h-3.5 bg-red-600 rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.4)] border border-red-800 absolute top-2 z-20">
            {/* لمعة صغيرة على الدبوس ليعطي شكلاً واقعياً */}
            <div className="w-1.5 h-1.5 bg-white/60 rounded-full absolute top-[1px] left-[1px]"></div>
        </div>
      </div>

      {/* مساحة الكتابة */}
      <textarea
        dir="auto"
        className="no-drag flex-1 w-full bg-transparent resize-none outline-none px-5 pb-5 pt-1 text-gray-800 placeholder-gray-500/50"
        style={{
           fontFamily: 'inherit',
           lineHeight: '1.7',
           fontSize: '15px'
        }}
        placeholder="اكتب ملاحظاتك هنا..."
        value={state.text}
        onChange={handleTextChange}
        onMouseDown={(e) => e.stopPropagation()} 
      />

      {/* زر تغيير الحجم (يظهر عند تمرير الماوس) */}
      <div
        className="no-drag absolute bottom-1 right-1 w-6 h-6 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-black/30 hover:text-black/60"
        onMouseDown={handleResizeDown}
        title="اسحب لتغيير الحجم"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 15 21 21 15 21"></polyline>
          <line x1="21" y1="21" x2="15" y2="15"></line>
        </svg>
      </div>
    </div>
  )
}