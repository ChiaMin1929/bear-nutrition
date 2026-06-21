// API base URL:
//   - 本地開發：Vite proxy 轉發到 localhost:3001（或直接 /api）
//   - GitHub Pages production：指向 Vercel deployment URL
//   設定方式：GitHub Secret VITE_API_BASE_URL = https://your-project.vercel.app

const BASE = import.meta.env.VITE_API_BASE_URL || ''

export async function analyzeFood({ images = [], textInput = '' }) {
  const res = await fetch(`${BASE}/api/analyze-food`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images, textInput }),
  })
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error('API_ERROR')
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
