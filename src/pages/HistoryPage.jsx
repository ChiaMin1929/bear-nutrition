import React, { useState, useEffect } from 'react'
import { useNutrition } from '../contexts/NutritionContext'
import { getTaiwanDateKey } from '../utils/nutrition'
import BottomNav from '../components/BottomNav'

function getLast30Days() {
  const days = []
  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const tw = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
    const key = `${tw.getFullYear()}-${String(tw.getMonth() + 1).padStart(2, '0')}-${String(tw.getDate()).padStart(2, '0')}`
    days.push(key)
  }
  return days
}

export default function HistoryPage() {
  const { getHistoryLog, goals } = useNutrition()
  const [logsMap, setLogsMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const days = getLast30Days()
  const today = getTaiwanDateKey()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all(days.map(key => getHistoryLog(key).then(log => ({ key, log }))))
      .then(results => {
        if (cancelled) return
        const map = {}
        results.forEach(({ key, log }) => { map[key] = log })
        setLogsMap(map)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="min-h-dvh bg-bg pb-safe">
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold text-text mb-1">飲食歷史</h1>
        <p className="text-sm text-text/50 mb-5">過去 30 天的紀錄</p>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-24 h-3 bg-border rounded-full" />
                    <div className="w-16 h-2.5 bg-border/60 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {days.map(dateKey => {
              const log = logsMap[dateKey]
              const isToday = dateKey === today
              const hasData = log && log.entries && log.entries.length > 0
              const isExpanded = expanded === dateKey

              const totals = hasData ? log.entries.reduce((a, e) => ({
                calories: a.calories + (e.calories || 0),
                protein: a.protein + (e.protein || 0),
                fat: a.fat + (e.fat || 0),
                carbs: a.carbs + (e.carbs || 0),
              }), { calories: 0, protein: 0, fat: 0, carbs: 0 }) : null

              return (
                <div key={dateKey} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => hasData && setExpanded(isExpanded ? null : dateKey)}
                    className="w-full flex items-center justify-between px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isToday ? 'bg-coral' : hasData ? 'bg-teal' : 'bg-border'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-medium ${isToday ? 'text-coral' : 'text-text'}`}>
                          {isToday ? '今天' : dateKey}
                        </p>
                        {totals ? (
                          <p className="text-xs text-text/50">{totals.calories} kcal · {log.entries.length} 筆</p>
                        ) : (
                          <p className="text-xs text-text/30">無紀錄</p>
                        )}
                      </div>
                    </div>
                    {totals && goals && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-coral"
                            style={{ width: `${Math.min((totals.calories / goals.calories) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-text/40">{isExpanded ? '▴' : '▾'}</span>
                      </div>
                    )}
                  </button>

                  {isExpanded && hasData && (
                    <div className="border-t border-border px-4 py-3 flex flex-col gap-2 fade-in">
                      {/* Macro summary */}
                      <div className="grid grid-cols-4 gap-2 mb-2">
                        {[
                          { label: '熱量', val: totals.calories, unit: 'kcal', color: 'text-coral' },
                          { label: '蛋白質', val: totals.protein, unit: 'g', color: 'text-teal' },
                          { label: '脂肪', val: totals.fat, unit: 'g', color: 'text-yellow-500' },
                          { label: '碳水', val: totals.carbs, unit: 'g', color: 'text-purple-400' },
                        ].map(m => (
                          <div key={m.label} className="bg-bg rounded-xl p-2 text-center">
                            <div className={`text-sm font-bold ${m.color}`}>{Math.round(m.val)}</div>
                            <div className="text-[10px] text-text/50">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      {/* Entry list */}
                      {log.entries.map(e => (
                        <div key={e.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <p className="text-sm text-text truncate max-w-[65%]">{e.food_name || e.name}</p>
                          <span className="text-xs text-text/50">{e.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
