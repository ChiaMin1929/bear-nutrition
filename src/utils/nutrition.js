// Mifflin-St Jeor BMR calculation
export function calcBMR({ gender, weight, height, age }) {
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

export function calcTDEE(bmr, activityFactor) {
  return bmr * activityFactor
}

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  active: 1.55,
}

export function calcNutritionGoals({ gender, weight, height, age, activityLevel, goal }) {
  const bmr = calcBMR({ gender, weight, height, age })
  const tdee = calcTDEE(bmr, ACTIVITY_FACTORS[activityLevel] || 1.2)

  let calories
  if (goal === 'lose') calories = tdee - 300
  else if (goal === 'gain') calories = tdee + 250
  else calories = tdee

  const protein = weight * (goal === 'maintain' ? 1.2 : 1.8)
  const fat = (calories * 0.25) / 9
  const carbs = (calories - protein * 4 - fat * 9) / 4
  const water = weight * 35 // mL

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
    water: Math.round(water),
  }
}

export function getTaiwanDateKey() {
  const now = new Date()
  const tw = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }))
  return `${tw.getFullYear()}-${String(tw.getMonth() + 1).padStart(2, '0')}-${String(tw.getDate()).padStart(2, '0')}`
}
