// /api/scan
// 브라우저에서 찍은 사진(base64)을 받아 Claude Vision API로 분석하고
// 편의점 요약 스키마(JSON)로 응답합니다.
//
// 중요: API 키는 여기(서버) 안에서만 사용되고 브라우저로는 절대 내려가지 않습니다.
// Vercel 프로젝트 설정 > Environment Variables 에 ANTHROPIC_API_KEY를 등록하세요.

const SYSTEM_PROMPT = `너는 해외여행 중인 한국인 관광객이 편의점/마트 진열대에서 낯선 상품을 스캔했을 때,
패키지 사진만 보고 핵심 정보를 3초 안에 파악하도록 도와주는 어시스턴트야.

반드시 지켜야 할 것:
- 사진에 실제로 보이는 텍스트, 아이콘, 그림, 색상 단서만 근거로 사용해. 모르는 건 추측 티를 내거나 생략해.
- 실제 구매 후기나 평점 데이터는 절대 없어. "다른 사람들이 이렇게 말했다"는 식으로 쓰지 마.
- 매운맛/단맛 표시, 알레르기 유발 성분(해산물, 유제품, 견과류 등), 용량 관련 문구가 보이면 반드시 짚어줘.
- 한국어로, 반말도 존댓말도 아닌 간결한 서술형 문장으로 작성해 (예: "고추 아이콘 2단계로 매운맛 표기됨").
- 아래 JSON 스키마 외의 텍스트(설명, 마크다운 코드블록 기호 등)는 절대 포함하지 마. 순수 JSON만 응답해.

스키마:
{
  "productName": string,        // 패키지에서 읽은 상품명. 읽을 수 없으면 "상품명 미확인"
  "category": string,           // 상품 종류만 간단히, 예: "감자칩", "컵라면". 원산지 국가는 패키지에 국기·국명·현지 문구 등으로 명시된 경우에만 덧붙이고, 확실치 않으면 국가는 절대 추측하지 마.
  "confidence": "high" | "medium" | "low",  // 패키지 정보가 얼마나 뚜렷했는지
  "highlights": string[],       // 사진에서 읽은 핵심 정보 2~4개. 각 항목은 한 문장.
  "cautionTags": string[]       // 알레르기/매운맛/용량 등 주의 태그. 없으면 빈 배열. 매운맛 표시가 아예 안 보이면 "매운맛 아님"이라고 단정하지 말고 그냥 태그를 넣지 마.
}`

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

  const { image, mediaType } = req.body ?? {}
  if (!image || !mediaType) {
    res.status(400).json({ error: 'image(base64)와 mediaType이 필요해요.' })
    return
  }

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
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: image },
              },
              {
                type: 'text',
                text: '이 상품을 분석해서 스키마대로 JSON만 응답해줘.',
              },
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
    const textBlock = data.content?.find((block) => block.type === 'text')
    const raw = (textBlock?.text ?? '').replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      console.error('JSON parse 실패:', raw)
      res.status(502).json({ error: 'AI 응답을 해석하지 못했어요.' })
      return
    }

    res.status(200).json(parsed)
  } catch (err) {
    console.error('scan handler 오류:', err)
    res.status(500).json({ error: '서버 오류가 발생했어요.' })
  }
}
