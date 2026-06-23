import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNutrition } from '../contexts/NutritionContext'
import { calcNutritionGoals, calcBMR, ACTIVITY_FACTORS } from '../utils/nutrition'
import BearMascot from '../components/BearMascot'
import BottomNav from '../components/BottomNav'

export default function SettingsPage() {
  const { user, logout, updateNickname } = useAuth()
  const { profile, goals, saveProfile } = useNutrition()
  const navigate = useNavigate()

  const [form, setForm] = useState(profile || {
    gender: 'female', age: 28, height: 162, weight: 58,
    activityLevel: 'light', goal: 'lose',
  })
  const [nickname, setNickname] = useState(user?.nickname || '')
  const [saved, setSaved] = useState(false)

  function update(key, val) { setForm(f => ({ ...f, [key]: val })) }

  const bmr = calcBMR(form)
  const tdee = Math.round(bmr * (ACTIVITY_FACTORS[form.activityLevel] ?? 1.375))
  const preview = calcNutritionGoals(form)

  function handleSave(e) {
    e.preventDefault()
    saveProfile(form)
    updateNickname(nickname)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="min-h-dvh bg-bg pb-safe">
      <div className="px-4 pt-5 pb-4">
        <h1 className="text-xl font-bold text-text mb-4">設定</h1>

        {/* Profile card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm mb-4 flex items-center gap-4">
          <BearMascot size={52} />
          <div>
            <p className="font-bold text-text">{user?.nickname || '...'}</p>
            <p className="text-xs text-text/50">{user?.email}</p>
          </div>
        </div>

        {/* Goals display — live preview from current form */}
        <div className="bg-coral/5 rounded-3xl p-4 mb-4 border border-coral/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-coral">每日目標預覽</p>
            {goals && preview.calories !== goals.calories && (
              <span className="text-xs text-text/40">調整後將更新</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <Stat label="熱量" val={preview.calories} unit="kcal" highlight />
            <Stat label="蛋白質" val={preview.protein} unit="g" />
            <Stat label="脂肪" val={preview.fat} unit="g" />
            <Stat label="碳水" val={preview.carbs} unit="g" />
          </div>
          <div className="border-t border-coral/10 pt-2.5 flex gap-4 text-xs text-text/40">
            <span>BMR {Math.round(bmr)} kcal</span>
            <span>TDEE {tdee} kcal</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">

          {/* Nickname */}
          <Section title="暱稱">
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="你想讓巴熊叫你什麼？"
              maxLength={10}
              className="w-full border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-coral"
            />
          </Section>

          {/* Gender */}
          <Section title="性別">
            <div className="flex gap-3">
              {[{v:'male',l:'男'},{v:'female',l:'女'}].map(g => (
                <button key={g.v} type="button" onClick={() => update('gender', g.v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                    ${form.gender === g.v ? 'border-coral bg-coral/5 text-coral' : 'border-border text-text/60'}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </Section>

          {/* Numbers */}
          <Section title="基本數據">
            <div className="grid grid-cols-3 gap-3">
              <NumberField label="年齡" value={form.age} min={15} max={80} unit="歲" onChange={v => update('age', v)} />
              <NumberField label="身高" value={form.height} min={140} max={220} unit="cm" onChange={v => update('height', v)} />
              <NumberField label="體重" value={form.weight} min={30} max={200} unit="kg" onChange={v => update('weight', v)} />
            </div>
          </Section>

          {/* Goal */}
          <Section title="核心目標">
            <div className="flex gap-2">
              {[{v:'lose',l:'減脂'},{v:'gain',l:'增肌'},{v:'maintain',l:'維持'}].map(g => (
                <button key={g.v} type="button" onClick={() => update('goal', g.v)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border-2 transition-all
                    ${form.goal === g.v ? 'border-coral bg-coral/5 text-coral' : 'border-border text-text/60'}`}>
                  {g.l}
                </button>
              ))}
            </div>
          </Section>

          {/* Activity */}
          <Section title="活動量">
            <div className="flex flex-col gap-2">
              {[
                {v:'sedentary', l:'久坐不動',       d:'辦公室工作為主'},
                {v:'light',     l:'輕度活動',        d:'每週運動 1–3 天'},
                {v:'moderate',  l:'中度活動',        d:'每週運動 3–5 天'},
                {v:'active',    l:'高度活動',        d:'每週運動 6–7 天'},
              ].map(a => (
                <button key={a.v} type="button" onClick={() => update('activityLevel', a.v)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all
                    ${form.activityLevel === a.v ? 'border-teal bg-teal/5 text-teal' : 'border-border text-text/60'}`}>
                  <span>{a.l}</span>
                  <span className={`text-xs font-normal ${form.activityLevel === a.v ? 'text-teal/70' : 'text-text/30'}`}>{a.d}</span>
                </button>
              ))}
            </div>
          </Section>

          <button type="submit"
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${saved ? 'bg-mint text-white' : 'bg-coral text-white'}`}>
            {saved ? '✓ 已儲存並重新計算' : '儲存設定'}
          </button>
        </form>

        {/* Logout */}
        <button onClick={() => { logout(); navigate('/auth') }}
          className="w-full mt-4 py-3.5 rounded-2xl border border-border text-sm text-text/50 font-medium">
          登出
        </button>
      </div>

      <BottomNav />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-text/50 mb-3">{title}</p>
      {children}
    </div>
  )
}

function NumberField({ label, value, min, max, unit, onChange }) {
  return (
    <div>
      <p className="text-xs text-text/50 mb-1">{label}</p>
      <input
        type="number" value={value} min={min} max={max}
        onChange={e => onChange(parseInt(e.target.value) || value)}
        className="w-full border border-border rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:border-coral"
      />
      <p className="text-xs text-text/40 text-center mt-0.5">{unit}</p>
    </div>
  )
}

function Stat({ label, val, unit, highlight }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-text/60">{label}</span>
      <span className={`font-semibold ${highlight ? 'text-coral' : 'text-text'}`}>{val} {unit}</span>
    </div>
  )
}
