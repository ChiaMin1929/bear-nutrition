import React, { useEffect } from 'react'

export default function BottomSheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* Sheet – stopPropagation 防止點擊按鈕時事件冒泡觸發背景的 onClose */}
      <div className="relative bg-white rounded-t-3xl slide-up max-h-[90dvh] flex flex-col" style={{ maxWidth: 430, margin: '0 auto', width: '100%' }} onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
        {title && (
          <div className="px-5 pt-1 pb-3 border-b border-border">
            <h3 className="text-base font-bold text-text">{title}</h3>
          </div>
        )}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  )
}
