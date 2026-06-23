import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNutrition } from '../contexts/NutritionContext'
import BearMascot from '../components/BearMascot'

const STEPS = ['gender', 'age', 'height', 'weight', 'goal', 'activity', 'habits']
const STEP_LABELS = ['性別', '年齡', '身高', '體重', '目標', '活動量', '壞習慣']

const BAD_HABITS = [
  { id: 'takeout', label: '天天外食', emoji: '🍱' },
  { id: 'bubble_tea', label: '手搖飲成癮', emoji: '🧋' },
  { id: 'latenight', label: '愛吃宵夜', emoji: '🌙' },
  { id: 'no_veg', label: '蔬菜吃太少', emoji: '🥦' },
  { id: 'fried', label: '愛吃甜點炸物', emoji: '🍟' },
]

export default function OnboardingPage() {
  const { user } = useAuth()
  const { saveProfile } = useNutrition()
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('bear_onboarding_step')
    return saved ? parseInt(saved) : 0
  })

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('bear_onboarding_data')
    return saved ? JSON.parse(saved) : {
      gender: 'female',
      age: 28,
      height: 162,
      weight: 58,
      goal: 'lose',
      activityLevel: 'light',
      badHabits: [],
    }
  })

  useEffect(() => {
    localStorage.setItem('bear_onboarding_step', currentStep)
    localStorage.setItem('bear_onboarding_data', JSON.stringify(data))
  }, [currentStep, data])

  function next() {
    if (currentStep < STEPS.length - 1) setCurrentStep(s => s + 1)
    else finish()
  }

  function back() {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }

  function finish() {
    saveProfile(data)
    localStorage.removeItem('bear_onboarding_step')
    localStorage.removeItem('bear_onboarding_data')
    navigate('/dashboard')
  }

  function update(key, val) {
    setData(d => ({ ...d, [key]: val }))
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <div className="min-h-dvh bg-bg flex flex-col px-5 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <BearMascot size={44} />
        <div className="flex-1">
          <p className="text-xs text-text/50 mb-1">建立你的營養檔案</p>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-coral rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-text/40 mt-1">{currentStep + 1} / {STEPS.length}</p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 bg-white rounded-3xl p-6 shadow-sm bounce-in" key={currentStep}>
        {STEPS[currentStep] === 'gender' && (
          <GenderStep value={data.gender} onChange={v => update('gender', v)} />
        )}
        {STEPS[currentStep] === 'age' && (
          <SliderStep
            title="你幾歲了？"
            subtitle="年齡影響你的基礎代謝率"
            value={data.age} min={15} max={80} unit="歲"
            onChange={v => update('age', v)}
          />
        )}
        {STEPS[currentStep] === 'height' && (
          <SliderStep
            title="身高是？"
            value={data.height} min={140} max={220} unit="cm"
            onChange={v => update('height', v)}
          />
        )}
        {STEPS[currentStep] === 'weight' && (
          <SliderStep
            title="目前體重？"
            subtitle="放輕鬆，巴熊不評判"
            value={data.weight} min={30} max={200} unit="kg"
            onChange={v => update('weight', v)}
          />
        )}
        {STEPS[currentStep] === 'goal' && (
          <GoalStep value={data.goal} onChange={v => update('goal', v)} />
        )}
        {STEPS[currentStep] === 'activity' && (
          <ActivityStep value={data.activityLevel} onChange={v => update('activityLevel', v)} />
        )}
        {STEPS[currentStep] === 'habits' && (
          <HabitsStep value={data.badHabits} onChange={v => update('badHabits', v)} />
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-5">
        {currentStep > 0 && (
          <button
            onClick={back}
            className="flex-1 border border-border rounded-2xl py-3.5 text-sm font-medium text-text/60 active:scale-95 transition-transform"
          >
            上一步
          </button>
        )}
        <button
          onClick={next}
          className="flex-1 bg-coral text-white rounded-2xl py-3.5 text-sm font-semibold active:scale-95 transition-transform"
        >
          {currentStep === STEPS.length - 1 ? '完成，開始追蹤' : '下一步'}
        </button>
      </div>
    </div>
  )
}

function GenderStep({ value, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-text mb-1">你的性別是？</h2>
      <p className="text-sm text-text/50 mb-6">影響 BMR 計算公式</p>
      <div className="flex gap-4">
        {[{ v: 'male', label: '男生', emoji: '🧑' }, { v: 'female', label: '女生', emoji: '👩' }].map(opt => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={`flex-1 flex flex-col items-center gap-2 py-6 rounded-2xl border-2 transition-all
              ${value === opt.v ? 'border-coral bg-coral/5' : 'border-border'}`}
          >
            <span className="text-3xl">{opt.emoji}</span>
            <span className={`font-semibold text-sm ${value === opt.v ? 'text-coral' : 'text-text'}`}>{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SliderStep({ title, subtitle, value, min, max, unit, onChange }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-text mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-text/50 mb-6">{subtitle}</p>}
      <div className="flex flex-col items-center gap-6 mt-4">
        <div className="text-5xl font-bold text-coral tabular-nums">
          {value}<span className="text-xl text-text/50 ml-1">{unit}</span>
        </div>
        <input
          type="range"
          min={min} max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full accent-coral"
        />
        <div className="flex justify-between w-full text-xs text-text/40">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>
    </div>
  )
}

function GoalStep({ value, onChange }) {
  const opts = [
    { v: 'lose', label: '減脂', emoji: '🔥', desc: '熱量赤字 300 kcal' },
    { v: 'gain', label: '增肌', emoji: '💪', desc: '熱量盈餘 250 kcal' },
    { v: 'maintain', label: '維持健康', emoji: '⚖️', desc: '維持 TDEE' },
  ]
  return (
    <div>
      <h2 className="text-xl font-bold text-text mb-1">你的核心目標？</h2>
      <p className="text-sm text-text/50 mb-5">決定你的每日熱量目標</p>
      <div className="flex flex-col gap-3">
        {opts.map(opt => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all
              ${value === opt.v ? 'border-coral bg-coral/5' : 'border-border'}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div>
              <div className={`font-semibold text-sm ${value === opt.v ? 'text-coral' : 'text-text'}`}>{opt.label}</div>
              <div className="text-xs text-text/50">{opt.desc}</div>
            </div>
            {value === opt.v && <span className="ml-auto text-coral">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function ActivityStep({ value, onChange }) {
  const opts = [
    { v: 'sedentary', label: '久坐不動',  emoji: '🪑', desc: '辦公室工作為主' },
    { v: 'light',     label: '輕度活動',  emoji: '🚶', desc: '每週運動 1–3 天' },
    { v: 'moderate',  label: '中度活動',  emoji: '🏃', desc: '每週運動 3–5 天' },
    { v: 'active',    label: '高度活動',  emoji: '💪', desc: '每週運動 6–7 天' },
  ]
  return (
    <div>
      <h2 className="text-xl font-bold text-text mb-1">日常活動量？</h2>
      <p className="text-sm text-text/50 mb-5">影響 TDEE 計算</p>
      <div className="flex flex-col gap-3">
        {opts.map(opt => (
          <button
            key={opt.v}
            onClick={() => onChange(opt.v)}
            className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 text-left transition-all
              ${value === opt.v ? 'border-teal bg-teal/5' : 'border-border'}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1">
              <div className={`font-semibold text-sm ${value === opt.v ? 'text-teal' : 'text-text'}`}>{opt.label}</div>
              <div className="text-xs text-text/50">{opt.desc}</div>
            </div>
            {value === opt.v && <span className="text-teal">✓</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

function HabitsStep({ value, onChange }) {
  function toggle(id) {
    onChange(value.includes(id) ? value.filter(h => h !== id) : [...value, id])
  }
  return (
    <div>
      <h2 className="text-xl font-bold text-text mb-1">有哪些壞習慣？</h2>
      <p className="text-sm text-text/50 mb-5">讓巴熊好好評論你 (可複選)</p>
      <div className="flex flex-wrap gap-3">
        {BAD_HABITS.map(h => {
          const selected = value.includes(h.id)
          return (
            <button
              key={h.id}
              onClick={() => toggle(h.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all text-sm font-medium
                ${selected ? 'border-coral bg-coral/10 text-coral' : 'border-border text-text'}`}
            >
              <span>{h.emoji}</span> {h.label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-text/40 mt-4">不選也沒關係，巴熊還是會記住你</p>
    </div>
  )
}
