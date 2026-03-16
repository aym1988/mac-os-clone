'use client'

import React, { useState, useEffect, useRef } from 'react'

interface YouTubeState {
  x: number
  y: number
  width: number
  height: number
  url: string
}

export default function YouTubeWidget() {
  const [state, setState] = useState<YouTubeState>({
    x: 400,
    y: 150,
    width: 320,
    height: 240,
    url: ''
  })
  
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 })

  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({ startX: 0, startY: 0, initW: 0, initH: 0 })

  const [inputValue, setInputValue] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)

  // استخراج كود الفيديو إذا كان الإدخال عبارة عن رابط يوتيوب
  const getYouTubeId = (str: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = str.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  // استرجاع البيانات المحفوظة عند فتح الموقع
  useEffect(() => {
    const saved = localStorage.getItem('desktop-youtube-widget-v2')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setState(parsed)
        if (parsed.url) {
          setInputValue(parsed.url)
          setIsPlaying(true)
        }
      } catch (e) {}
    }
  }, [])

  // حفظ المكان والحجم والرابط تلقائياً
  useEffect(() => {
    localStorage.setItem('desktop-youtube-widget-v2', JSON.stringify(state))
  }, [state])

  // منطق السحب (Drag)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      setState(prev => ({
        ...prev,
        x: dragRef.current.initX + (e.clientX - dragRef.current.startX),
        y: dragRef.current.initY + (e.clientY - dragRef.current.startY)
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
      setState(prev => ({
        ...prev,
        width: Math.max(250, resizeRef.current.initW + (e.clientX - resizeRef.current.startX)),
        height: Math.max(150, resizeRef.current.initH + (e.clientY - resizeRef.current.startY))
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
    e.stopPropagation()
    setIsDragging(true)
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: state.x, initY: state.y }
  }

  const handleResizeDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    resizeRef.current = { startX: e.clientX, startY: e.clientY, initW: state.width, initH: state.height }
  }

  // عند الضغط على زر التشغيل أو البحث
  const handlePlay = () => {
    if (inputValue.trim() === '') return

    const videoId = getYouTubeId(inputValue)
    if (videoId) {
      // إذا كان رابطاً، قم بتشغيله داخل النافذة
      setState(prev => ({ ...prev, url: inputValue }))
      setIsPlaying(true)
    } else {
      // إذا كان كلمة بحث، افتح يوتيوب للبحث لتجنب الحظر
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(inputValue)}`, '_blank', 'noopener,noreferrer')
      setInputValue('') // تفريغ المربع بعد البحث
    }
  }

  // مسح النافذة للبحث من جديد
  const handleClear = () => {
    setIsPlaying(false)
    setInputValue('')
    setState(prev => ({ ...prev, url: '' }))
  }

  const videoId = isPlaying ? getYouTubeId(state.url) : null

  return (
    <div
      className="absolute shadow-2xl flex flex-col z-20 group rounded-xl overflow-hidden bg-black/80 backdrop-blur-md border border-white/10"
      style={{ left: state.x, top: state.y, width: state.width, height: state.height }}
      onContextMenu={(e) => e.stopPropagation()}
    >
      {/* شريط السحب العلوي */}
      <div 
        className="h-8 w-full cursor-grab active:cursor-grabbing flex items-center justify-between px-3 bg-white/5 border-b border-white/10"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
          <span className="text-white/70 text-xs font-medium">Smart YT Player</span>
        </div>
        {isPlaying && (
          <button 
            onClick={handleClear}
            className="text-white/50 hover:text-white text-xs px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
          >
            رجوع للبحث
          </button>
        )}
      </div>

      {/* محتوى النافذة (مربع الإدخال أو الفيديو) */}
      <div className="flex-1 relative w-full h-full flex flex-col items-center justify-center p-4">
        {/* طبقة شفافة تمنع تداخل الماوس مع الفيديو أثناء السحب */}
        {isDragging && <div className="absolute inset-0 z-10"></div>}

        {!isPlaying || !videoId ? (
          <div className="flex flex-col gap-3 w-full max-w-[250px]">
            <input 
              type="text" 
              dir="auto"
              placeholder="ابحث هنا أو ضع رابط يوتيوب..." 
              className="w-full text-sm px-3 py-2 rounded-lg bg-white/10 text-white outline-none border border-white/20 focus:border-red-500 transition-colors placeholder:text-white/40"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
            />
            <button 
              onClick={handlePlay}
              className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-2 rounded-lg text-sm transition-colors shadow-lg"
            >
              تشغيل / بحث
            </button>
          </div>
        ) : (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          ></iframe>
        )}
      </div>

      {/* زر تغيير الحجم */}
      <div
        className="absolute bottom-0 right-0 w-5 h-5 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 text-white/50 hover:text-white bg-black/20 rounded-tl-lg"
        onMouseDown={handleResizeDown}
      >
        <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none">
          <polyline points="21 15 21 21 15 21"></polyline>
          <line x1="21" y1="21" x2="15" y2="15"></line>
        </svg>
      </div>
    </div>
  )
}