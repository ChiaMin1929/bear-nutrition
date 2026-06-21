// Vercel serverless function – generates Bear's daily dashboard comment

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { nickname, caloriesToday, caloriesGoal, proteinToday, proteinGoal, foodList } = req.body || {}
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const prompt = `用戶暱稱：${nickname}
今日攝取熱量：${caloriesToday} / ${caloriesGoal} kcal
蛋白質：${proteinToday} / ${proteinGoal} g
今日飲食清單：${foodList || '尚無紀錄'}

請用巴熊的厭世口吻，針對這位用戶今日的飲食狀況，
生成一句帶入暱稱「${nickname}」的個人化評語，40字以內。
不可說鼓勵陽光的話，但數據要準確。
直接回傳評語文字，不要加任何 JSON 格式或標記。`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        }),
      }
    )

    if (response.status === 429) {
      return res.status(429).json({ error: 'RATE_LIMIT' })
    }

    const data = await response.json()
    const comment = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!comment) return res.status(500).json({ error: 'Empty response' })

    return res.status(200).json({ comment })
  } catch (err) {
    return res.status(500).json({ error: 'Failed', message: err.message })
  }
}
