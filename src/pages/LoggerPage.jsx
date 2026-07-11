import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNutrition } from '../contexts/NutritionContext'
import BearMascot from '../components/BearMascot'
import BottomSheet from '../components/BottomSheet'
import BottomNav from '../components/BottomNav'
import { analyzeFood } from '../utils/api'

// Compress image to ≤1MB, long side ≤1280px, JPEG 0.85
function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX = 1280
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.src = url
  })
}

export default function LoggerPage() {
  const navigate = useNavigate()
  const { addFoodEntry } = useNutrition()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [mode, setMode] = useState(null) // 'photo' | 'text' | 'manual' | 'loading' | 'confirm'
  const [textInput, setTextInput] = useState('')
  const [images, setImages] = useState([])
  const [result, setResult] = useState(null)
  const [ratio, setRatio] = useState(1)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [apiErrorCode, setApiErrorCode] = useState(null)
  const [manualForm, setManualForm] = useState({ name: '', calories: '', protein: '', fat: '', carbs: '' })
  const [unsavedDialog, setUnsavedDialog] = useState({ open: false, pendingPath: null })

  function handleNavGuard(path) {
    if (mode === 'confirm') {
      setUnsavedDialog({ open: true, pendingPath: path })
    } else {
      navigate(path)
    }
  }

  function handleSaveAndLeave() {
    const { pendingPath } = unsavedDialog
    setUnsavedDialog({ open: false, pendingPath: null })
    handleConfirm(pendingPath)
  }

  function handleDiscardAndLeave() {
    const { pendingPath } = unsavedDialog
    setUnsavedDialog({ open: false, pendingPath: null })
    setMode(null)
    setResult(null)
    navigate(pendingPath)
  }

  function openSheet() { setSheetOpen(true); setMode(null) }

  function handleFileChange(e) {
    const files = Array.from(e.target.files).slice(0, 3)
    Promise.all(files.map(compressImage)).then(imgs => {
      setImages(imgs)
    })
  }

  function handleAISubmit() {
    if (images.length === 0 && !textInput.trim()) return
    setMode('loading')
    setSheetOpen(false)
    callAI({ images, textInput: textInput.trim() })
  }

  async function callAI({ images: imgs, textInput: text }) {
    setLoading(true)
    setApiError(null)
    setApiErrorCode(null)
    try {
      const result = await analyzeFood({ images: imgs, textInput: text })
      setResult(result)
      setRatio(1)
      setMode('confirm')
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        setApiError('rate_limit')
      } else if (err.message === 'SERVICE_UNAVAILABLE') {
        setApiError('service_unavailable')
      } else if (err.message === 'TIMEOUT') {
        setApiError('timeout')
      } else {
        setApiError('generic')
        setApiErrorCode(err.code ?? null)
      }
      setMode(null)
    } finally {
      setLoading(false)
    }
  }

  function openAIInput() {
    setImages([])
    setTextInput('')
    setSheetOpen(false)
    setMode('ai-input')
  }

  function handleConfirm(dest = '/dashboard') {
    const scaled = {
      food_name: result.food_name,
      calories: Math.round(result.calories * ratio),
      protein: Math.round(result.protein * ratio),
      fat: Math.round(result.fat * ratio),
      carbs: Math.round(result.carbs * ratio),
      coach_comment: result.coach_comment,
    }
    addFoodEntry(scaled)
    setMode(null)
    setResult(null)
    setImages([])
    navigate(dest)
  }

  function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualForm.name || !manualForm.calories) return
    addFoodEntry({
      food_name: manualForm.name,
      calories: parseInt(manualForm.calories) || 0,
      protein: parseInt(manualForm.protein) || 0,
      fat: parseInt(manualForm.fat) || 0,
      carbs: parseInt(manualForm.carbs) || 0,
    })
    setManualForm({ name: '', calories: '', protein: '', fat: '', carbs: '' })
    navigate('/dashboard')
  }

  return (
    <div className="min-h-dvh bg-bg pb-safe">
      <div className="px-4 pt-5">
        <h1 className="text-xl font-bold text-text mb-1">飲食紀錄</h1>
        <p className="text-sm text-text/50 mb-6">告訴巴熊你又吃了什麼</p>

        {/* Loading state */}
        {mode === 'loading' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm flex flex-col items-center gap-4 bounce-in">
            <BearMascot size={80} shake />
            <p className="text-sm text-text/70 text-center">讓我看看你吃了什麼好東西...</p>
            <div className="flex gap-1.5">
              {[0,1,2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-coral animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* Confirm result */}
        {mode === 'confirm' && result && (
          <div className="flex flex-col gap-4 bounce-in">
            {/* Bear comment */}
            <div className="bg-white rounded-3xl p-4 shadow-sm flex items-start gap-3">
              <BearMascot size={48} />
              <div className="flex-1 bg-bg rounded-2xl rounded-tl-none px-3 py-2.5">
                <p className="text-sm text-text">{result.coach_comment}</p>
              </div>
            </div>

            {/* Result card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-text">{result.food_name}</h3>
                <span className="text-coral font-bold text-lg">{Math.round(result.calories * ratio)} kcal</span>
              </div>
              {/* Breakdown 分析 */}
              {result.breakdown && (
                <div className="bg-bg rounded-2xl px-4 py-3 mb-4">
                  <p className="text-xs font-semibold text-text/50 mb-1">📊 熱量分析</p>
                  <p className="text-sm text-text leading-relaxed">{result.breakdown}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: '蛋白質', val: result.protein, color: 'text-teal' },
                  { label: '脂肪', val: result.fat, color: 'text-yellow-500' },
                  { label: '碳水', val: result.carbs, color: 'text-purple-400' },
                ].map(m => (
                  <div key={m.label} className="bg-bg rounded-2xl p-3 text-center">
                    <div className={`text-lg font-bold ${m.color}`}>{Math.round(m.val * ratio)}</div>
                    <div className="text-xs text-text/50">{m.label} g</div>
                  </div>
                ))}
              </div>

              {/* Ratio adjustment */}
              <div className="border-t border-border pt-4">
                <p className="text-xs text-text/50 mb-2">份量調整</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number" step="0.1" min="0.1" max="5"
                    value={ratio}
                    onChange={e => setRatio(parseFloat(e.target.value) || 1)}
                    className="w-24 border border-border rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-coral"
                  />
                  <span className="text-sm text-text/50 flex-1">× 份量比例（1 = 全部）</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setMode(null); setResult(null) }}
                className="flex-1 border border-border rounded-2xl py-3.5 text-sm font-medium text-text/60">
                重新辨識
              </button>
              <button onClick={handleConfirm}
                className="flex-1 bg-coral text-white rounded-2xl py-3.5 text-sm font-semibold">
                確認加入
              </button>
            </div>
          </div>
        )}

        {/* API Error state */}
        {apiError && (
          <div className="bg-white rounded-3xl p-6 shadow-sm bounce-in flex flex-col items-center gap-3 text-center">
            <img
              src={
                apiError === 'service_unavailable' ? '/503_bear.png'
                : apiError === 'rate_limit' ? '/429_bear.jpg'
                : '/other_error_bear.png'
              }
              alt="巴熊錯誤圖示"
              className="w-28 h-28 object-contain"
            />
            <p className="font-bold text-text">
              {apiError === 'service_unavailable' ? '巴熊午睡中... 等等再來'
              : apiError === 'rate_limit' ? '今日巴熊的服務次數已用完，銘謝惠顧'
              : apiError === 'timeout' ? '巴熊想太久恍神了... 再試一次吧'
              : '巴熊罷工中，請聯繫兔子'}
            </p>
            <div className="flex gap-3 w-full mt-1">
              {apiError === 'timeout' ? (
                <button onClick={() => { setApiError(null); setMode('loading'); callAI({ images, textInput: textInput.trim() }) }}
                  className="flex-1 bg-coral text-white rounded-2xl py-3 text-sm font-semibold">
                  再試一次
                </button>
              ) : (
                <button onClick={() => { setApiError(null); setMode('manual') }}
                  className="flex-1 bg-coral text-white rounded-2xl py-3 text-sm font-semibold">
                  手動輸入
                </button>
              )}
              <button onClick={() => setApiError(null)}
                className="flex-1 border border-border rounded-2xl py-3 text-sm text-text/60">
                我知道了
              </button>
            </div>
            <p className="text-xs text-text/30">
              （錯誤代碼：{apiError === 'service_unavailable' ? '503' : apiError === 'rate_limit' ? '429' : apiError === 'timeout' ? 'TIMEOUT' : apiErrorCode ?? 'ERR'}）
            </p>
          </div>
        )}

        {/* Default CTA */}
        {mode === null && !apiError && (
          <button
            onClick={openSheet}
            className="w-full bg-coral text-white rounded-3xl py-5 flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-transform"
          >
            <span className="text-3xl">🍴</span>
            <span className="font-bold text-base">紀錄一餐</span>
            <span className="text-xs opacity-70">拍照、描述、或手動輸入</span>
          </button>
        )}

        {/* Manual form */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="bg-white rounded-3xl p-5 shadow-sm flex flex-col gap-4 bounce-in">
            <h3 className="font-bold text-text">手動輸入</h3>
            <Field label="食物名稱 *" value={manualForm.name} onChange={v => setManualForm(f => ({...f, name: v}))} placeholder="例：滷肉飯" />
            <Field label="熱量 (kcal) *" value={manualForm.calories} onChange={v => setManualForm(f => ({...f, calories: v}))} type="number" placeholder="0" />
            <div className="grid grid-cols-3 gap-3">
              <Field label="蛋白質 g" value={manualForm.protein} onChange={v => setManualForm(f => ({...f, protein: v}))} type="number" placeholder="0" />
              <Field label="脂肪 g" value={manualForm.fat} onChange={v => setManualForm(f => ({...f, fat: v}))} type="number" placeholder="0" />
              <Field label="碳水 g" value={manualForm.carbs} onChange={v => setManualForm(f => ({...f, carbs: v}))} type="number" placeholder="0" />
            </div>
            <div className="flex gap-3 mt-1">
              <button type="button" onClick={() => setMode(null)}
                className="flex-1 border border-border rounded-2xl py-3 text-sm text-text/60">取消</button>
              <button type="submit" className="flex-1 bg-coral text-white rounded-2xl py-3 text-sm font-semibold">加入紀錄</button>
            </div>
          </form>
        )}

        {/* AI input mode — combined photo + text */}
        {mode === 'ai-input' && (
          <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col gap-4 bounce-in">
            <h3 className="font-bold text-text">AI 辨識</h3>

            {/* Image upload */}
            <div>
              <p className="text-xs font-medium text-text/60 mb-2">上傳照片（選填，最多 3 張）</p>
              <div className="flex gap-2 flex-wrap">
                {images.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} className="w-20 h-20 rounded-2xl object-cover border border-border" />
                    <button
                      type="button"
                      onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-text text-white rounded-full text-xs flex items-center justify-center leading-none"
                    >×</button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="w-20 h-20 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer active:bg-bg">
                    <span className="text-2xl text-text/30">📷</span>
                    <span className="text-xs text-text/30">新增</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>

            {/* Text input */}
            <div>
              <p className="text-xs font-medium text-text/60 mb-2">補充說明（選填）</p>
              <textarea
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                placeholder="例：一碗滷肉飯、一碗味噌湯、半盤燙青菜"
                rows={3}
                className="w-full border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-coral resize-none"
              />
            </div>

            <p className="text-xs text-text/40 -mt-2">照片和文字可以同時提供，或擇一即可</p>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setMode(null); setImages([]); setTextInput('') }}
                className="flex-1 border border-border rounded-2xl py-3 text-sm text-text/60">取消</button>
              <button
                type="button"
                onClick={handleAISubmit}
                disabled={images.length === 0 && !textInput.trim()}
                className="flex-1 bg-coral text-white rounded-2xl py-3 text-sm font-semibold disabled:opacity-50"
              >
                讓巴熊分析
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logger bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="選擇記錄方式">
        <div className="flex flex-col gap-2 p-4">
          <SheetBtn
            emoji="🤖" label="AI 辨識"
            desc="拍照或輸入品項，AI 幫你分析"
            color="bg-coral/10 text-coral"
            onClick={openAIInput}
          />
          <SheetBtn
            emoji="📝" label="手動輸入"
            desc="不走 AI，自行填寫數值"
            color="bg-purple-50 text-purple-400"
            onClick={() => { setSheetOpen(false); setMode('manual') }}
          />
        </div>
      </BottomSheet>

      <BottomNav onNavigate={handleNavGuard} />

      {/* Unsaved result guard dialog */}
      {unsavedDialog.open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setUnsavedDialog({ open: false, pendingPath: null })} />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl p-6 flex flex-col gap-4 bounce-in">
            <button
              onClick={() => setUnsavedDialog({ open: false, pendingPath: null })}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-text/30 hover:text-text/60"
            >
              ✕
            </button>
            <div className="flex items-start gap-3 pr-8">
              <BearMascot size={44} />
              <div>
                <p className="font-bold text-text text-base">還沒儲存分析結果！</p>
                <p className="text-sm text-text/60 mt-0.5">離開前要先把這餐加入紀錄嗎？</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDiscardAndLeave}
                className="flex-1 border border-border rounded-2xl py-3.5 text-sm font-medium text-text/60"
              >
                離開
              </button>
              <button
                onClick={handleSaveAndLeave}
                className="flex-1 bg-coral text-white rounded-2xl py-3.5 text-sm font-semibold"
              >
                儲存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SheetBtn({ emoji, label, desc, color, onClick }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-4 w-full px-4 py-4 rounded-2xl bg-bg active:scale-95 transition-transform text-left">
      <span className={`text-2xl w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>{emoji}</span>
      <div>
        <div className="font-semibold text-sm text-text">{label}</div>
        <div className="text-xs text-text/50">{desc}</div>
      </div>
    </button>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-text/60 mb-1 block">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-coral"
      />
    </div>
  )
}
