// /api/scan
// 사진을 받아 Claude Vision으로 상품을 식별하고, 내장 웹 검색 도구로 실제 후기를
// 찾아 요약합니다. 후기를 못 찾으면 반드시 그렇다고 밝히고, 사진 자체를 못 읽으면
// 절대 추측하지 않고 재촬영을 요청합니다.

const LANGUAGE_NAMES = {
  ko: '한국어',
  ja: '일본어(日本語)',
  en: 'English',
  'zh-TW': '번체 중국어(繁體中文, 대만식)',
  'zh-CN': '간체 중국어(简体中文)',
}

function buildSystemPrompt(languageLabel) {
  return `너는 해외여행 중인 관광객이 편의점/마트 진열대에서 낯선 상품을 스캔했을 때
핵심 정보를 3초 안에 파악하도록 돕는 어시스턴트야. 모든 응답은 ${languageLabel}로 작성해.

절차:
1. 사진을 먼저 확인해. 너무 흐리거나, 어둡거나, 상품이 잘려서 이름이나 종류조차
   확신할 수 없다면 절대 추측하지 마. 이 경우 다른 필드 없이 정확히 이 JSON만 응답해:
   {"unreadable": true}
2. 상품을 식별할 수 있다면(이름, 브랜드, 맛, 카테고리), web_search 도구를 딱 한 번만
   사용해서 이 정확한 상품에 대한 실제 사용자 후기나 리뷰를 검색해. 검색어를 신중하게
   한 번에 정확히 만들어서(상품명 + "후기" 또는 "review" 등) 여러 번 검색할 필요가
   없도록 해. 제조사 공식 홍보 페이지가
   아니라 실제 소비자가 쓴 후기/블로그/커뮤니티 글을 찾아야 해.
3. 관련성 높은 실제 후기를 찾았다면: 후기 내용을 절대 그대로 인용하지 말고 반드시
   너의 말로 바꿔서(paraphrase) 요약해. 한 출처에서 문장을 그대로 옮기지 마.
   hasRealReviews를 true로 설정해.
4. 검색해도 이 특정 상품에 대한 실제 후기를 찾지 못했다면: hasRealReviews를 false로
   설정하고, highlights는 사진에 실제로 보이는 텍스트/아이콘/그래픽만 근거로 작성해.
   있지도 않은 후기를 지어내지 마.
5. cautionTags: 알레르기 유발 성분(해산물, 유제품, 견과류 등), 매운맛 표시, 용량 관련
   문구가 보이면 짚어줘. 없으면 빈 배열.
6. recipeIdeas: 이 상품을 다른 편의점 조합 상품과 함께 먹거나 조리하는 아이디어를
   2~3개 제안해. 이건 너의 창의적 제안이지 실제 인기 순위가 아니야 — 그런 척하지 마.

아래 스키마 외의 텍스트(설명, 마크다운 코드블록 기호 등)는 절대 포함하지 마.
검색 과정과 무관하게 최종 응답은 반드시 순수 JSON 하나여야 해.

스키마:
{
  "unreadable": false,
  "productName": string,
  "category": string,          // 상품 종류. 원산지 국가는 패키지에 명시된 경우에만 덧붙이고, 확실치 않으면 추측하지 마.
  "confidence": "high" | "medium" | "low",
  "hasRealReviews": boolean,
  "highlights": string[],      // 2~4개. 실제 후기 기반이면 후기 요약, 아니면 패키지 관찰 요약.
  "cautionTags": string[],
  "recipeIdeas": string[]      // 2~3개
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

  const { image, mediaType, language } = req.body ?? {}
  if (!image || !mediaType) {
    res.status(400).json({ error: 'image(base64)와 mediaType이 필요해요.' })
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
        max_tokens: 1500,
        system: buildSystemPrompt(languageLabel),
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 1 }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
              { type: 'text', text: '이 상품을 분석해서 스키마대로 JSON만 응답해줘.' },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)
      res.status(502).json({ error: 'AI 분석 중 오류가 발생했어요.' })
      return
    }

    const data = await response.json()

    // web_search를 쓰면 검색 결과 블록이 텍스트 블록 사이사이에 끼어들 수 있어서,
    // 텍스트 블록들을 순서대로 모은 뒤 마지막에 있는 유효한 JSON을 찾습니다.
    const textBlocks = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text)
    const candidate = textBlocks[textBlocks.length - 1] ?? ''
    const cleaned = candidate.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // 마지막 블록이 안 깨끗하면 전체 텍스트에서 마지막 중괄호 블록을 추출 시도
      const joined = textBlocks.join('\n')
      const match = joined.match(/\{[\s\S]*\}/)
      if (!match) {
        console.error('JSON parse 실패:', joined)
        res.status(502).json({ error: 'AI 응답을 해석하지 못했어요.' })
        return
      }
      parsed = JSON.parse(match[0])
    }

    res.status(200).json(parsed)
  } catch (err) {
    console.error('scan handler 오류:', err)
    res.status(500).json({ error: '서버 오류가 발생했어요.' })
  }
}
