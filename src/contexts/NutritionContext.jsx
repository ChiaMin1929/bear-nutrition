import React, { createContext, useContext, useState, useEffect } from 'react'
import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { calcNutritionGoals, getTaiwanDateKey } from '../utils/nutrition'

const NutritionContext = createContext(null)

export function NutritionProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [goals, setGoals] = useState(null)
  const [todayLog, setTodayLog] = useState({ entries: [], water: 0, bearComment: null })
  const dateKey = getTaiwanDateKey()

  // Load profile + goals from Firestore when user changes
  useEffect(() => {
    if (!user) { setProfile(null); setGoals(null); return }
    const ref = doc(db, 'users', user.uid, 'data', 'profile')
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setProfile(data.profile || null)
        setGoals(data.goals || null)
      }
    })
    return unsub
  }, [user?.uid])

  // Load today's log from Firestore (with localStorage fallback)
  useEffect(() => {
    if (!user) return
    const localKey = `bear_log_${dateKey}`
    const cached = localStorage.getItem(localKey)
    if (cached) {
      try { setTodayLog(JSON.parse(cached)) } catch (_) {}
    }
    const ref = doc(db, 'users', user.uid, 'logs', dateKey)
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setTodayLog(data)
        localStorage.setItem(localKey, JSON.stringify(data))
      }
    })
    return unsub
  }, [user?.uid, dateKey])

  async function saveProfile(profileData) {
    const newGoals = calcNutritionGoals(profileData)
    setProfile(profileData)
    setGoals(newGoals)
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'data', 'profile'), {
        profile: profileData,
        goals: newGoals,
        updatedAt: Date.now(),
      })
    }
    return newGoals
  }

  async function saveTodayLog(log) {
    setTodayLog(log)
    const localKey = `bear_log_${dateKey}`
    localStorage.setItem(localKey, JSON.stringify(log))
    if (user) {
      await setDoc(doc(db, 'users', user.uid, 'logs', dateKey), log)
    }
  }

  async function addFoodEntry(entry) {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry,
    }
    await saveTodayLog({ ...todayLog, entries: [...todayLog.entries, newEntry] })
    return newEntry
  }

  async function deleteFoodEntry(id) {
    await saveTodayLog({ ...todayLog, entries: todayLog.entries.filter(e => e.id !== id) })
  }

  async function updateFoodEntry(id, data) {
    await saveTodayLog({
      ...todayLog,
      entries: todayLog.entries.map(e => e.id === id ? { ...e, ...data } : e),
    })
  }

  async function addWater(ml) {
    await saveTodayLog({ ...todayLog, water: (todayLog.water || 0) + ml })
  }

  async function setBearComment(comment) {
    await saveTodayLog({ ...todayLog, bearComment: comment })
  }

  async function getHistoryLog(key) {
    // Try localStorage first for speed
    const cached = localStorage.getItem(`bear_log_${key}`)
    if (cached) return JSON.parse(cached)
    if (!user) return null
    const snap = await getDoc(doc(db, 'users', user.uid, 'logs', key))
    return snap.exists() ? snap.data() : null
  }

  const totals = todayLog.entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
      fat: acc.fat + (e.fat || 0),
      carbs: acc.carbs + (e.carbs || 0),
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0 }
  )

  return (
    <NutritionContext.Provider value={{
      profile, goals, todayLog, totals,
      saveProfile, addFoodEntry, deleteFoodEntry, updateFoodEntry,
      addWater, setBearComment, getHistoryLog,
    }}>
      {children}
    </NutritionContext.Provider>
  )
}

export const useNutrition = () => useContext(NutritionContext)
