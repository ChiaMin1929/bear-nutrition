import React, { useState, useRef } from 'react'
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
  const [manualForm, setManualForm] = useState({ name: '', calories: '', protein: '', fat: '', carbs: '' })
  const fileRef = useRef()

  function openSheet() { setSheetOpen(true); setMode(null) }

  function handleFileChange(e) {
    const files = Array.from(e.target.files).slice(0, 3)
    Promise.all(files.map(compressImage)).then(imgs => {
      setImages(imgs)
      setMode('loading')
      setSheetOpen(false)
      callAI({ images: imgs, textInput: '' })
    })
  }

  async function callAI({ images: imgs, textInput: text }) {
    setLoading(true)
    setApiError(null)
    try {
      const result = await analyzeFood({ images: imgs, textInput: text })
      setResult(result)
      setRatio(1)
      setMode('confirm')
    } catch (err) {
      if (err.message === 'RATE_LIMIT') {
        setApiError('rate_limit')
      } else {
        setApiError('generic')
      }
      setMode(null)
    } finally {
      setLoading(false)
    }
  }

  function handleTextSubmit(e) {
    e.preventDefault()
    if (!textInput.trim()) return
    setMode('loading')
    setSheetOpen(false)
    callAI({ images: [], textInput: textInput.trim() })
  }

  function handleConfirm() {
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
    navigate('/dashboard')
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
            <span className="text-3xl">💡</span>
            <p className="font-bold text-text">AI 營養師休息中</p>
            <p className="text-sm text-text/60 leading-relaxed">
              {apiError === 'rate_limit'
                ? '由於目前使用人數較多，今日的 AI 免費諮詢額度已經用完囉！請明天再來找我聊聊，或是您也可以先用手動輸入方式記錄喔！'
                : 'AI 辨識暫時無法使用，請稍後再試或使用手動輸入。'}
            </p>
            <div className="flex gap-3 w-full mt-1">
              <button onClick={() => { setApiError(null); setMode('manual') }}
                className="flex-1 bg-coral text-white rounded-2xl py-3 text-sm font-semibold">
                手動輸入
              </button>
              <button onClick={() => setApiError(null)}
                className="flex-1 border border-border rounded-2xl py-3 text-sm text-text/60">
                我知道了
              </button>
            </div>
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

        {/* Text input mode */}
        {mode === 'text-input' && (
          <form onSubmit={handleTextSubmit} className="bg-white rounded-3xl p-5 shadow-sm flex flex-col gap-4 bounce-in">
            <h3 className="font-bold text-text">描述你吃了什麼</h3>
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="例：一碗滷肉飯、一碗味噌湯、半盤燙青菜"
              rows={4}
              className="border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-coral resize-none"
              autoFocus
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setMode(null)}
                className="flex-1 border border-border rounded-2xl py-3 text-sm text-text/60">取消</button>
              <button type="submit" disabled={!textInput.trim()}
                className="flex-1 bg-coral text-white rounded-2xl py-3 text-sm font-semibold disabled:opacity-50">
                讓巴熊分析
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Logger bottom sheet */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="選擇記錄方式">
        <div className="flex flex-col gap-2 p-4">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <SheetBtn
            emoji="📷" label="拍照 / 選相簿"
            desc="最多 3 張，AI 幫你辨識"
            color="bg-coral/10 text-coral"
            onClick={() => { setSheetOpen(false); setTimeout(() => fileRef.current?.click(), 100) }}
          />
          <SheetBtn
            emoji="✍️" label="輸入文字"
            desc="描述你吃了什麼"
            color="bg-teal/10 text-teal"
            onClick={() => { setSheetOpen(false); setMode('text-input') }}
          />
          <SheetBtn
            emoji="📝" label="手動輸入"
            desc="不走 AI，自行填寫數值"
            color="bg-purple-50 text-purple-400"
            onClick={() => { setSheetOpen(false); setMode('manual') }}
          />
        </div>
      </BottomSheet>

      <BottomNav />
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
