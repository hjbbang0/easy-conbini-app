// /api/reviews (2단계: 백그라운드 후기 검색)
// /api/scan이 식별한 상품명으로 실제 후기를 검색합니다. 이미지가 필요 없어서
// 텍스트만 주고받는 가벼운 요청이고, 화면에는 이미 1단계 결과가 떠 있는 상태에서
// 조용히 뒤에서 실행돼요.

const LANGUAGE_NAMES = {
  ko: '한국어',
  ja: '일본어(日本語)',
  en: 'English',
  'zh-TW': '번체 중국어(繁體中文, 대만식)',
  'zh-CN': '간체 중국어(简体中文)',
}

function buildSystemPrompt(languageLabel) {
  return `너는 여행자에게 편의점 상품의 실제 후기를 찾아주는 어시스턴트야.
모든 응답은 ${languageLabel}로 작성해.

web_search 도구를 딱 한 번만 사용해서, 주어진 정확한 상품에 대한 실제 사용자 후기나
리뷰를 검색해. 제조사 공식 홍보 페이지가 아니라 실제 소비자가 쓴 후기/블로그/커뮤니티
글을 찾아야 해.

- 관련성 높은 실제 후기를 찾았다면: 절대 그대로 인용하지 말고 반드시 너의 말로
  바꿔서(paraphrase) 2~4개 문장으로 요약해. 한 출처에서 문장을 그대로 옮기지 마.
  hasRealReviews를 true로 설정해.
- 이 특정 상품에 대한 실제 후기를 찾지 못했다면: hasRealReviews를 false로 설정하고
  highlights는 빈 배열로 둬. 있지도 않은 후기를 지어내지 마.

아래 스키마 외의 텍스트는 절대 포함하지 마. 최종 응답은 반드시 순수 JSON 하나여야 해.

스키마:
{
  "hasRealReviews": boolean,
  "highlights": string[]
}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POST만 지원해요.' })
    return
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았어요.' })
    return
  }

  const { productName, category, language } = req.body ?? {}
  if (!productName) {
    res.status(400).json({ error: 'productName이 필요해요.' })
    return
  }

  const languageLabel = LANGUAGE_NAMES[language] ?? LANGUAGE_NAMES.ko

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 600,
        system: buildSystemPrompt(languageLabel),
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
        messages: [
          {
            role: 'user',
            content: `상품명: ${productName}\n카테고리: ${category ?? '알 수 없음'}\n\n이 상품의 실제 후기를 검색해서 스키마대로 JSON만 응답해줘.`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error (reviews):', errText)
      res.status(502).json({ error: '후기 검색 중 오류가 발생했어요.' })
      return
    }

    const data = await response.json()
    const textBlocks = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text)
    const candidate = textBlocks[textBlocks.length - 1] ?? ''
    const cleaned = candidate.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      const joined = textBlocks.join('\n')
      const match = joined.match(/\{[\s\S]*\}/)
      if (!match) {
        console.error('JSON parse 실패 (reviews):', joined)
        res.status(502).json({ error: 'AI 응답을 해석하지 못했어요.' })
        return
      }
      parsed = JSON.parse(match[0])
    }

    res.status(200).json(parsed)
  } catch (err) {
    console.error('reviews handler 오류:', err)
    res.status(500).json({ error: '서버 오류가 발생했어요.' })
  }
}
