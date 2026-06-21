import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/dashboard', icon: '🏠', label: '今日' },
  { path: '/logger', icon: '🍴', label: '紀錄' },
  { path: '/history', icon: '📅', label: '歷史' },
  { path: '/settings', icon: '⚙️', label: '設定' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-border bottom-nav z-50">
      <div className="flex items-center justify-around py-2">
        {TABS.map(tab => {
          const active = location.pathname === tab.path || (tab.path === '/dashboard' && location.pathname === '/')
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-2xl transition-all
                ${active ? 'text-coral' : 'text-gray-400'}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-[11px] font-medium ${active ? 'text-coral' : 'text-gray-400'}`}>
                {tab.label}
              </span>
              {active && (
                <span className="w-1 h-1 rounded-full bg-coral mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
