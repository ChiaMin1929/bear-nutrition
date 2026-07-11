// API base URL:
//   - 本地開發：Vite proxy 轉發到 localhost:3001（或直接 /api）
//   - GitHub Pages production：指向 Vercel deployment URL
//   設定方式：GitHub Secret VITE_API_BASE_URL = https://your-project.vercel.app

const BASE = import.meta.env.VITE_API_BASE_URL || ''

const ANALYZE_TIMEOUT_MS = 30000

export async function analyzeFood({ images = [], textInput = '' }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${BASE}/api/analyze-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ images, textInput }),
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('TIMEOUT')
    throw err
  } finally {
    clearTimeout(timer)
  }
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (res.status === 503) throw new Error('SERVICE_UNAVAILABLE')
  if (!res.ok) throw Object.assign(new Error('API_ERROR'), { code: res.status })
  return res.json()
}

export async function getBearComment({ nickname, caloriesToday, caloriesGoal, proteinToday, proteinGoal, foodList }) {
  const res = await fetch(`${BASE}/api/bear-comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, caloriesToday, caloriesGoal, proteinToday, proteinGoal, foodList }),
  })
  if (!res.ok) throw new Error('API_ERROR')
  return res.json()
}
