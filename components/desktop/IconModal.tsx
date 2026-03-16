'use client'

import React, { useState, useRef, useCallback } from 'react'
import { DesktopIcon, DesktopSettings } from '@/lib/desktop-types'
import { Language, t } from '@/lib/i18n'
import { generateId, saveIconBlob } from '@/lib/desktop-storage'

interface IconModalProps {
  mode: 'add' | 'edit'
  icon?: DesktopIcon
  settings: DesktopSettings
  lang: Language
  spawnX?: number
  spawnY?: number
  onSave: (icon: DesktopIcon) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

export default function IconModal({
  mode,
  icon,
  settings,
  lang,
  spawnX = 100,
  spawnY = 100,
  onSave,
  onDelete,
  onClose,
}: IconModalProps) {
  const [label, setLabel] = useState(icon?.label ?? '')
  const [labelAr, setLabelAr] = useState(icon?.labelAr ?? '')
  const [url, setUrl] = useState(icon?.url ?? '')
  // imageRef = the value stored in the icon (either URL string or idb ref)
  const [imageRef, setImageRef] = useState(icon?.image ?? '')
  // previewSrc = what is shown in the <img> preview (always a real displayable URL)
  const [previewSrc, setPreviewSrc] = useState<string>(
    icon?.image && !icon.image.startsWith('__idb:') ? icon.image : ''
  )
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const rtl = lang === 'ar'

  // Process a File picked by the user — read as full-res data URL, store in IndexedDB
  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string
      // Show preview immediately
      setPreviewSrc(dataUrl)
      // Store in IndexedDB (use a temp key; will be replaced on save with real icon id)
      const tempId = icon?.id ?? `tmp-${generateId()}`
      const ref = await saveIconBlob(tempId, dataUrl)
      setImageRef(ref)
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }, [icon?.id])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleUrlChange = (val: string) => {
    setImageRef(val)
    setPreviewSrc(val)
  }

  const handleSave = async () => {
    if (!label.trim() && !labelAr.trim()) return
    const iconId = icon?.id ?? generateId()

    // If the user uploaded a file, re-save to IndexedDB under the real final icon id
    let finalImageRef = imageRef
    if (imageRef.startsWith('__idb:icon:') && imageRef !== `__idb:icon:${iconId}__`) {
      finalImageRef = await saveIconBlob(iconId, previewSrc)
    }

    const newIcon: DesktopIcon = {
      id: iconId,
      label: label.trim() || labelAr.trim(),
      labelAr: labelAr.trim() || label.trim(),
      url: url.trim(),
      image: finalImageRef,
      x: icon?.x ?? spawnX,
      y: icon?.y ?? spawnY,
    }
    onSave(newIcon)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  const isUploaded = imageRef.startsWith('__idb:icon:')
  const showPreview = previewSrc || (imageRef && !isUploaded)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="relative flex flex-col overflow-hidden shadow-2xl border border-white/10"
        style={{
          width: 400,
          background: 'rgba(20, 22, 30, 0.97)',
          backdropFilter: `blur(${settings.uiBlurIntensity}px)`,
          borderRadius: settings.cornerRadius,
          direction: rtl ? 'rtl' : 'ltr',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <span className="text-white font-semibold text-sm">
            {mode === 'add' ? t(lang, 'addNewIcon') : t(lang, 'editIconTitle')}
          </span>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white text-xs transition-colors"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 space-y-4">

          {/* Icon image section */}
          <div>
            <label className="block text-xs text-white/50 mb-2">{t(lang, 'iconImage')}</label>

            {/* Drop zone / preview */}
            <div
              className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                dragOver
                  ? 'border-blue-400/80 bg-blue-500/10'
                  : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/8'
              }`}
              style={{ minHeight: 100 }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-white/40">جاري الرفع...</span>
                </div>
              ) : showPreview ? (
                <div className="relative py-3 px-4 flex items-center gap-3 w-full">
                  <div
                    className="flex-shrink-0 flex items-center justify-center bg-white/10 rounded-xl overflow-hidden"
                    style={{ width: 64, height: 64 }}
                  >
                    <img
                      src={previewSrc || imageRef}
                      alt="preview"
                      className="object-contain"
                      style={{ width: 48, height: 48, imageRendering: 'auto' }}
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <span className="text-xs text-white/60 truncate">
                      {isUploaded ? (lang === 'ar' ? 'صورة مرفوعة' : 'Uploaded image') : imageRef}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setImageRef('')
                        setPreviewSrc('')
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                      className="text-xs text-red-400/80 hover:text-red-400 text-start w-fit transition-colors"
                    >
                      {lang === 'ar' ? 'إزالة الصورة' : 'Remove image'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white/30">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="17 8 12 3 7 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-xs text-white/40">{t(lang, 'uploadIconImage')}</span>
                  <span className="text-[10px] text-white/25">PNG, JPG, SVG, WEBP</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* URL input below */}
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[10px] text-white/25">{t(lang, 'orEnterUrl')}</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <input
                type="text"
                value={isUploaded ? '' : imageRef}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder={t(lang, 'iconImagePlaceholder')}
                className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-blue-400/60 focus:bg-white/12 transition-colors"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-xs text-white/50 mb-1">{t(lang, 'iconLabel')}</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t(lang, 'iconLabelPlaceholder')}
              autoFocus
              className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/60 focus:bg-white/12 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">{t(lang, 'iconLabelAr')}</label>
            <input
              type="text"
              value={labelAr}
              onChange={(e) => setLabelAr(e.target.value)}
              placeholder={t(lang, 'iconLabelArPlaceholder')}
              dir="rtl"
              className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/60 focus:bg-white/12 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1">{t(lang, 'iconUrl')}</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t(lang, 'iconUrlPlaceholder')}
              className="w-full bg-white/8 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/60 focus:bg-white/12 transition-colors"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-5 pb-5">
          {mode === 'edit' && onDelete && (
            <button
              onClick={() => { onDelete(icon!.id); onClose() }}
              className="flex-1 py-2 rounded-lg text-sm bg-red-500/20 border border-red-400/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              {t(lang, 'delete')}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm bg-white/8 border border-white/10 text-white/60 hover:bg-white/12 transition-colors"
          >
            {t(lang, 'cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={(!label.trim() && !labelAr.trim()) || uploading}
            className="flex-1 py-2 rounded-lg text-sm bg-blue-500/80 border border-blue-400/40 text-white hover:bg-blue-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t(lang, 'save')}
          </button>
        </div>
      </div>
    </div>
  )
}
