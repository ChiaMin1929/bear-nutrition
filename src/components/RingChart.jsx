import React from 'react'

export default function RingChart({ consumed, goal, size = 200 }) {
  const remaining = Math.max(goal - consumed, 0)
  const over = consumed > goal
  const radius = 80
  const stroke = 18
  const circumference = 2 * Math.PI * radius
  const pct = goal > 0 ? Math.min(consumed / goal, 1) : 0
  const offset = circumference * (1 - pct)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 200 200">
        {/* Background ring */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke="#E8E4DF"
          strokeWidth={stroke}
        />
        {/* Progress ring */}
        <circle
          cx="100" cy="100" r={radius}
          fill="none"
          stroke={over ? '#F4845F' : '#F4845F'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="progress-ring__circle"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
        {/* Center text */}
        <text x="100" y="90" textAnchor="middle" fontSize="13" fill="#3D3530" opacity="0.6">
          {over ? '超標了' : '還可以吃'}
        </text>
        <text x="100" y="116" textAnchor="middle" fontSize="32" fontWeight="700" fill={over ? '#F4845F' : '#3D3530'}>
          {over ? consumed - goal : remaining}
        </text>
        <text x="100" y="138" textAnchor="middle" fontSize="12" fill="#3D3530" opacity="0.5">
          kcal
        </text>
      </svg>
      <div className="flex gap-4 text-xs text-text/60 -mt-1">
        <span>目標 <strong className="text-text">{goal}</strong> kcal</span>
        <span>已攝取 <strong className={over ? 'text-coral' : 'text-text'}>{consumed}</strong> kcal</span>
      </div>
    </div>
  )
}
