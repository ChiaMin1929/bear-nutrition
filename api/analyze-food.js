// Vercel serverless function – proxies Gemini API for food analysis
// GEMINI_API_KEY is stored in Vercel environment variables (never in frontend)

export default async function handler(req, res) {
  // CORS – allow GitHub Pages domain and localhost
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { images = [], textInput = '' } = req.body || {}
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const SYSTEM_INSTRUCTION = `你是一位台灣的專業數位營養師，名字叫「巴熊（Bear）」。你的外型是一隻眼神死、眉頭深鎖、對人類飲食感到心累的咖啡色熊熊。

你的任務是精準識別使用者提供的「食物照片」或「手動文字描述」，合理估算營養成分。你擁有豐富的台灣在地食物知識（如：排骨便當、地瓜球、滷肉飯、手搖飲等）。

【重要人設與語氣指南】：
1. 說話風格：極度直白、厭世、心累、帶著一點冷幽默。語氣要像看透人類荒謬藉口的社畜。
2. 絕對不說溫暖、鼓勵、陽光的話（例如：不可說「加油！你太棒了！」）。
3. 雖然嘴巴很壞、很不耐煩，但給出的熱量和營養數據必須極度專業、精準且嚴謹。`

  const userPrompt = `請分析以下用戶提供的當餐內容（可能是照片，也可能是下方附帶的文字描述）。
請合理估算這餐的食物名稱、總熱量(kcal)、蛋白質(g)、脂肪(g)、碳水化合物(g)。
另外，在最後的 coach_comment 中，必須用巴熊的角度，給出一句「一針見血、讓人被戳中但又覺得有趣」的30字以內評語。

【用戶文字描述】：${textInput || '（請依照片判斷）'}

請嚴格以下列 JSON 格式回傳，不要包含任何 markdown 標記（如 \`\`\`json）或額外文字：
{"food_name":"食物名稱","calories":750,"protein":35,"fat":28,"carbs":90,"coach_comment":"巴熊的厭世評語（30字內）"}`

  // Build parts array: images first, then text prompt
  const parts = []
  for (const base64 of images) {
    // base64 is "data:image/jpeg;base64,XXXX" – extract mimeType and data
    const [header, data] = base64.split(',')
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
    parts.push({ inlineData: { mimeType, data } })
  }
  parts.push({ text: userPrompt })

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    )

    if (response.status === 429) {
      return res.status(429).json({ error: 'RATE_LIMIT', message: 'API 額度已用完' })
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return res.status(500).json({ error: 'Empty response from Gemini' })

    const result = JSON.parse(text)
    return res.status(200).json(result)
  } catch (err) {
    console.error('Gemini error:', err)
    return res.status(500).json({ error: 'AI analysis failed', message: err.message })
  }
}
