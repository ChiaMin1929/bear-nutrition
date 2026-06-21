import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNutrition } from '../contexts/NutritionContext'
import BearMascot from '../components/BearMascot'

export default function AuthPage() {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('email')        // 'email' | 'register' | 'login'
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleEmailSubmit(e) {
    e.preventDefault()
    if (!email.includes('@')) { setError('請輸入有效的 Email'); return }
    setError('')
    // Default to register flow; if login fails we'll catch "email in use"
    setStep('register')
  }

  async function handleRegister(e) {
    e.preventDefault()
    const n = nickname.trim()
    if (!n || n.length > 10) { setError('請輸入 1-10 字的暱稱'); return }
    if (password.length < 6) { setError('密碼至少 6 個字元'); return }
    setLoading(true)
    setError('')
    try {
      await register(email, password, n)
      navigate('/onboarding')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        // Account exists → switch to login
        setStep('login')
        setError('此 Email 已有帳號，請直接登入')
      } else {
        setError(firebaseError(err.code))
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (password.length < 6) { setError('請輸入密碼'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(firebaseError(err.code))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="bounce-in flex flex-col items-center gap-3 mb-8">
        <BearMascot size={100} />
        <h1 className="text-2xl font-bold text-text">巴熊營養師</h1>
        <p className="text-sm text-text/60 text-center">你的厭世 AI 營養師<br/>雖然不情願，但還是來幫你了</p>
      </div>

      <div className="w-full bg-white rounded-3xl p-6 shadow-sm">

        {/* Step 1: Email */}
        {step === 'email' && (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">Email</label>
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm focus:outline-none focus:border-coral transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-coral">{error}</p>}
            <button type="submit"
              className="w-full bg-coral text-white rounded-2xl py-3.5 font-semibold text-sm active:scale-95 transition-transform">
              繼續
            </button>
          </form>
        )}

        {/* Step 2a: Register */}
        {step === 'register' && (
          <form onSubmit={handleRegister} className="flex flex-col gap-4">
            <div className="text-sm text-text/50 bg-bg rounded-2xl px-4 py-2.5">📧 {email}</div>
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">你想讓巴熊叫你什麼？</label>
              <input
                type="text" value={nickname}
                onChange={e => { setNickname(e.target.value); setError('') }}
                placeholder="例：小廢物、努力中..."
                maxLength={10}
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm focus:outline-none focus:border-coral transition-colors"
                autoFocus
              />
              <p className="text-xs text-text/40 mt-1 text-right">{nickname.length}/10</p>
            </div>
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">設定密碼</label>
              <input
                type="password" value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="至少 6 個字元"
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm focus:outline-none focus:border-coral transition-colors"
              />
            </div>
            {error && <p className="text-xs text-coral">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-coral text-white rounded-2xl py-3.5 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-60">
              {loading ? '建立中...' : '建立帳號，開始問診'}
            </button>
            <button type="button" onClick={() => setStep('login')}
              className="text-xs text-text/40 text-center">
              已有帳號？點此登入
            </button>
            <button type="button" onClick={() => setStep('email')}
              className="text-xs text-text/30 text-center">返回</button>
          </form>
        )}

        {/* Step 2b: Login */}
        {step === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="text-sm text-text/50 bg-bg rounded-2xl px-4 py-2.5">📧 {email}</div>
            <div>
              <label className="text-sm font-medium text-text mb-1.5 block">密碼</label>
              <input
                type="password" value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="輸入密碼"
                className="w-full rounded-2xl border border-border px-4 py-3 text-sm focus:outline-none focus:border-coral transition-colors"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-coral">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-coral text-white rounded-2xl py-3.5 font-semibold text-sm active:scale-95 transition-transform disabled:opacity-60">
              {loading ? '登入中...' : '登入'}
            </button>
            <button type="button" onClick={() => { setStep('register'); setError('') }}
              className="text-xs text-text/40 text-center">
              新用戶？點此建立帳號
            </button>
            <button type="button" onClick={() => setStep('email')}
              className="text-xs text-text/30 text-center">返回</button>
          </form>
        )}

      </div>
    </div>
  )
}

function firebaseError(code) {
  const map = {
    'auth/wrong-password': '密碼錯誤',
    'auth/user-not-found': '找不到此 Email 的帳號',
    'auth/invalid-credential': '帳號或密碼錯誤',
    'auth/too-many-requests': '嘗試次數過多，請稍後再試',
    'auth/weak-password': '密碼強度不足，請使用 6 字元以上',
    'auth/network-request-failed': '網路錯誤，請檢查連線',
  }
  return map[code] || `登入失敗（${code}）`
}
