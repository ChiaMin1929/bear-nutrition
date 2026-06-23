// Mifflin-St Jeor BMR calculation
export function calcBMR({ gender, weight, height, age }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

export const ACTIVITY_FACTORS = {
  sedentary: 1.2,    // 久坐不動
  light:     1.375,  // 輕度活動（每週運動 1-3 天）
  moderate:  1.55,   // 中度活動（每週運動 3-5 天）
  active:    1.725,  // 高度活動（每週運動 6-7 天）
}

export function calcNutritionGoals({ gender, weight, height, age, activityLevel, goal }) {
  const bmr  = calcBMR({ gender, weight, height, age })
  const tdee = bmr * (ACTIVITY_FACTORS[activityLevel] ?? 1.375)

  // Calorie target — ensure never below BMR
  let calories
  if (goal === 'lose')       calories = Math.max(tdee - 400, bmr)
  else if (goal === 'gain')  calories = tdee + 400
  else                       calories = tdee

  // Protein: midpoint of clinical ranges per goal
  // lose: 2.0~2.4 → 2.2 g/kg | gain: 1.6~2.2 → 2.0 g/kg | maintain: 1.4~1.8 → 1.6 g/kg
  const proteinPerKg = goal === 'lose' ? 2.2 : goal === 'gain' ? 2.0 : 1.6
  const protein = weight * proteinPerKg

  // Fat: midpoint of clinical ranges per goal
  // lose: 20~30% → 25% | gain: 20~25% → 22% | maintain: 25~30% → 27%
  const fatPct = goal === 'lose' ? 0.25 : goal === 'gain' ? 0.22 : 0.27
  const fat = (calories * fatPct) / 9

  // Carbs: remaining calories
  const carbs = Math.max((calories - protein * 4 - fat * 9) / 4, 0)

  return {
    calories: Math.round(calories),
    protein:  Math.round(protein),
    fat:      Math.round(fat),
    carbs:    Math.round(carbs),
    water:    Math.round(weight * 35), // mL
  }
}

export function getTaiwanDateKey() {
  const now = new Date()
  const tw = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  return `${tw.getFullYear()}-${String(tw.getMonth() + 1).padStart(2, '0')}-${String(tw.getDate()).padStart(2, '0')}`
}
