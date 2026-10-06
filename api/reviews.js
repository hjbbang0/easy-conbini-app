// /api/reviews (2단계: 백그라운드 후기 검색)
// /api/scan이 식별한 상품명으로 실제 후기를 검색합니다. 이미지가 필요 없어서
// 텍스트만 주고받는 가벼운 요청이고, 화면에는 이미 1단계 결과가 떠 있는 상태에서
// 조용히 뒤에서 실행돼요.

import { classifyAnthropicFailure, alertOwnerWithin } from '../ownerAlert.js'

const LANGUAGE_NAMES = {
  ko: '한국어',
  ja: '일본어(日本語)',
  en: 'English',
  'zh-TW': '번체 중국어(繁體中文, 대만식)',
  'zh-CN': '간체 중국어(简体中文)',
  th: '태국어(ภาษาไทย)',
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


// ── 방어 장치 (홍보로 트래픽이 몰리거나 누가 API를 직접 두드려도 비용이 새지 않게) ──
// 서버리스 특성상 인스턴스마다 따로 세는 "최선 노력" 제한이에요. 완벽한 차단이 아니라
// 과도한 남용(봇, 무한 반복)을 막는 용도예요. 한국 통신사는 여러 사람이 같은 IP를 공유하니
// 일반 사용자는 걸리지 않을 만큼 넉넉하게 잡았어요.
const ALLOWED_LANGUAGES = new Set(['ko', 'ja', 'en', 'zh-TW', 'zh-CN', 'th'])
const hitLog = new Map() // ip -> 최근 요청 시각들

function isRateLimited(req, maxHits, windowMs) {
  const ip = String(req.headers?.['x-forwarded-for'] ?? req.socket?.remoteAddress ?? 'unknown')
    .split(',')[0]
    .trim()
  const now = Date.now()
  const recent = (hitLog.get(ip) ?? []).filter((t) => now - t < windowMs)
  recent.push(now)
  hitLog.set(ip, recent)
  if (hitLog.size > 5000) {
    for (const [key, times] of hitLog) {
      if (times.every((t) => now - t >= windowMs)) hitLog.delete(key)
    }
  }
  return recent.length > maxHits
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

  if (isRateLimited(req, 60, 10 * 60 * 1000)) {
    res.status(429).json({ error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' })
    return
  }

  const { productName, category, language } = req.body ?? {}
  if (!productName || typeof productName !== 'string') {
    res.status(400).json({ error: 'productName이 필요해요.' })
    return
  }
  // 검색어로 그대로 들어가니 길이를 제한해서 비용·악용을 막아요.
  if (productName.length > 200 || (category != null && String(category).length > 100)) {
    res.status(400).json({ error: '입력이 너무 길어요.' })
    return
  }

  const languageLabel = LANGUAGE_NAMES[ALLOWED_LANGUAGES.has(language) ? language : 'ko']

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
        max_tokens: 1200,
        // scan.js와 같은 이유로 생각(thinking)을 꺼서 max_tokens 예산이 전부 JSON 응답에만
        // 쓰이도록 합니다. (검색 도구 사용 자체에는 영향 없어요.)
        thinking: { type: 'disabled' },
        system: [{ type: 'text', text: buildSystemPrompt(languageLabel), cache_control: { type: 'ephemeral' } }],
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
      const failure = classifyAnthropicFailure(response.status, errText)

      if (failure.kind === 'service_paused') {
        // 사진 분석(scan)과 같은 원인이라 같은 알림이에요. 6시간에 한 번만 가서 중복되지 않아요.
        await alertOwnerWithin({ reason: failure.reason })
        res.status(503).json({ error: '후기 검색이 잠시 쉬고 있어요.', code: 'service_paused' })
        return
      }
      if (failure.kind === 'busy') {
        res.status(503).json({ error: '지금 이용자가 많아요.', code: 'busy' })
        return
      }
      res.status(502).json({ error: '후기 검색 중 오류가 발생했어요.', code: 'failed' })
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
