import React from 'react'

export default function ProgressBar({ value, max, color = '#F4845F', label, current, unit = 'g' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const over = value > max

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs text-text/70">
        <span className="font-medium text-text">{label}</span>
        <span className={over ? 'text-coral font-semibold' : ''}>
          {Math.round(value)}<span className="text-text/50">/{max}{unit}</span>
        </span>
      </div>
      <div className="h-3 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color, opacity: over ? 0.85 : 1 }}
        />
      </div>
    </div>
  )
}
