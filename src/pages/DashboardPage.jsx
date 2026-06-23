import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNutrition } from '../contexts/NutritionContext'
import BearMascot from '../components/BearMascot'
import RingChart from '../components/RingChart'
import ProgressBar from '../components/ProgressBar'
import BottomNav from '../components/BottomNav'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { goals, totals, todayLog, deleteFoodEntry, addWater } = useNutrition()
  const navigate = useNavigate()
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [waterInput, setWaterInput] = useState('')
  const [showWaterInput, setShowWaterInput] = useState(false)

  const nickname = user?.nickname || '你'
  const entryCount = todayLog?.entries?.length ?? 0

  const BEAR_PROMPTS = [
    `${nickname}，你今天還沒讓我失望，因為你根本還沒記錄任何東西。`,
    `記了一筆。${nickname}，有開始總比沒開始好，雖然我不確定你會不會就這樣收工。`,
    `兩筆了，看來你今天是認真的。`,
    `${nickname}，你是不是還有吃什麼沒讓我知道？`,
    `${nickname}，你今天的自律讓巴熊無話可說……`,
  ]

  const defaultComment = BEAR_PROMPTS[Math.min(entryCount, 4)]
  const bearComment = todayLog?.bearComment || defaultComment

  const waterGoal = goals?.water || 2000
  const waterConsumed = todayLog?.water || 0

  function confirmDelete(id) {
    deleteFoodEntry(id)
    setDeleteConfirm(null)
  }

  function handleAddWater(ml) {
    addWater(ml)
  }

  function handleCustomWater(e) {
    e.preventDefault()
    const ml = parseInt(waterInput)
    if (ml > 0) { addWater(ml); setWaterInput(''); setShowWaterInput(false) }
  }

  if (!goals) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6">
        <BearMascot size={80} />
        <p className="text-text/60 text-center text-sm">還沒設定個人資料<br/>讓巴熊先幫你建立檔案</p>
        <button onClick={() => navigate('/onboarding')} className="bg-coral text-white px-8 py-3 rounded-2xl font-semibold text-sm">
          開始設定
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-bg pb-safe">
      <div className="px-4 pt-5 pb-4 flex flex-col gap-4">

        {/* Bear Comment */}
        <div className="bg-white rounded-3xl p-4 shadow-sm flex items-start gap-3">
          <BearMascot size={56} />
          <div className="flex-1 bg-bg rounded-2xl rounded-tl-none px-4 py-3 relative">
            <div
              className="absolute left-0 top-4 w-0 h-0"
              style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid #FAFAF7', transform: 'translateX(-10px)' }}
            />
            <p className="text-sm text-text leading-relaxed">{bearComment}</p>
          </div>
        </div>

        {/* Ring Chart */}
        <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col items-center">
          <p className="text-xs font-medium text-text/50 mb-2 self-start">今日熱量</p>
          <RingChart consumed={totals.calories} goal={goals.calories} />
        </div>

        {/* Macro Progress */}
        <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col gap-4">
          <p className="text-xs font-medium text-text/50">三大營養素</p>
          <ProgressBar label="蛋白質" value={totals.protein} max={goals.protein} color="#7EC8C8" />
          <ProgressBar label="脂肪" value={totals.fat} max={goals.fat} color="#F5D76E" />
          <ProgressBar label="碳水化合物" value={totals.carbs} max={goals.carbs} color="#C9B8E8" />
        </div>

        {/* Water */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text/50">💧 飲水紀錄</p>
            <span className="text-xs text-mint font-semibold">{waterConsumed} / {waterGoal} mL</span>
          </div>
          <ProgressBar label="" value={waterConsumed} max={waterGoal} color="#A8D8B0" unit="mL" />
          <div className="flex gap-2 mt-3">
            {[100, 250, 500].map(ml => (
              <button key={ml} onClick={() => handleAddWater(ml)}
                className="flex-1 bg-mint/20 text-mint font-semibold text-xs rounded-xl py-2 active:scale-95 transition-transform">
                +{ml}ml
              </button>
            ))}
            <button onClick={() => setShowWaterInput(v => !v)}
              className="flex-1 bg-bg text-text/60 text-xs rounded-xl py-2 active:scale-95 transition-transform border border-border">
              自訂
            </button>
          </div>
          {showWaterInput && (
            <form onSubmit={handleCustomWater} className="flex gap-2 mt-2">
              <input
                type="number" value={waterInput}
                onChange={e => setWaterInput(e.target.value)}
                placeholder="輸入 ml 數"
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-mint"
                min={1} max={2000}
              />
              <button type="submit" className="bg-mint text-white rounded-xl px-4 text-sm font-medium">加入</button>
            </form>
          )}
        </div>

        {/* Food Log */}
        <div className="bg-white rounded-3xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-text/50">今日飲食清單</p>
            <button onClick={() => navigate('/logger')}
              className="text-xs text-coral font-semibold bg-coral/10 px-3 py-1 rounded-full">
              + 新增
            </button>
          </div>
          {todayLog.entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🍽️</p>
              <p className="text-sm text-text/40">今天還沒記錄任何東西</p>
              <p className="text-xs text-text/30 mt-1">巴熊正在等你</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {todayLog.entries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-3 py-3 rounded-2xl bg-bg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{entry.food_name || entry.name}</p>
                    <p className="text-xs text-text/50">{formatTime(entry.timestamp)} · {entry.calories} kcal</p>
                  </div>
                  <button onClick={() => setDeleteConfirm(entry.id)}
                    className="text-text/30 hover:text-coral transition-colors text-base p-1">🗑️</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm bounce-in">
            <p className="font-bold text-text mb-2">確定要刪除？</p>
            <p className="text-sm text-text/60 mb-5">刪除後無法復原</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-border rounded-2xl py-3 text-sm font-medium text-text/60">
                取消
              </button>
              <button onClick={() => confirmDelete(deleteConfirm)} className="flex-1 bg-coral text-white rounded-2xl py-3 text-sm font-semibold">
                刪除
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
