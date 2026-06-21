import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNutrition } from '../contexts/NutritionContext'
import BearMascot from '../components/BearMascot'

export default function SplashPage() {
  const { user, loading } = useAuth()
  const { profile } = useNutrition()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (!user) navigate('/auth')
      else if (!profile) navigate('/onboarding')
      else navigate('/dashboard')
    }, 1400)
    return () => clearTimeout(timer)
  }, [loading, user, profile])

  return (
    <div className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-5">
      <div className="bounce-in flex flex-col items-center gap-4">
        <BearMascot size={120} />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text">巴熊營養師</h1>
          <p className="text-sm text-text/50 mt-1">厭世但精準的 AI 飲食夥伴</p>
        </div>
      </div>
      <div className="flex gap-1.5 mt-4">
        {[0,1,2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-coral animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
        ))}
      </div>
    </div>
  )
}
