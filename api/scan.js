// /api/scan (1단계: 빠른 식별)
// 사진을 보고 상품을 즉시 식별만 합니다. 웹 검색을 하지 않아서 훨씬 빨라요.
// 실제 후기는 /api/reviews가 이어서 백그라운드로 찾아요.
// 사진 자체를 못 읽으면 절대 추측하지 않고 재촬영을 요청합니다.

import { classifyAnthropicFailure, alertOwnerWithin } from '../ownerAlert.js'
import { ensureLanguage } from '../languageGuard.js'

const LANGUAGE_NAMES = {
  ko: '한국어',
  ja: '일본어(日本語)',
  en: 'English',
  'zh-TW': '번체 중국어(繁體中文, 대만식)',
  'zh-CN': '간체 중국어(简体中文)',
  th: '태국어(ภาษาไทย)',
}

function buildSystemPrompt(languageLabel, languageNameEn) {
  return `OUTPUT LANGUAGE (highest priority): ${languageNameEn}.
Every human-readable text in your reply (category, highlights, cautionTags, recipeIdeas and any note next to productName) MUST be written in ${languageNameEn}. These instructions are written in Korean, but do NOT answer in Korean unless the output language is Korean. Keep original brand and product names in their original script.

너는 해외여행 중인 관광객이 편의점·마트·드럭스토어 진열대에서 낯선 상품
(음식, 음료, 과자뿐 아니라 화장품, 상비약, 생활용품 등 무엇이든)을 스캔했을 때
핵심 정보를 3초 안에 파악하도록 돕는 어시스턴트야. 모든 응답은 ${languageLabel}로 작성해.

절차:
1. 사진을 먼저 확인해. 너무 흐리거나, 어둡거나, 상품이 잘려서 이름이나 종류조차
   확신할 수 없다면 절대 추측하지 마. 이 경우 다른 필드 없이 정확히 이 JSON만 응답해:
   {"unreadable": true}
   단, 음식이 아니라 화장품·의약품·생활용품이라는 이유만으로는 절대 unreadable로
   처리하지 마 — 이 앱은 편의점·드럭스토어에서 파는 모든 종류의 상품을 다뤄.
2. 상품을 식별할 수 있다면(이름, 브랜드, 종류), highlights는 사진에 실제로
   보이는 텍스트/아이콘/그래픽만 근거로 작성해. 후기가 있는 척하지 마 —
   hasRealReviews는 항상 false로 고정해.
3. cautionTags: 패키지에 실제로 보이는 주의 문구를 짚어줘. 음식·음료라면 알레르기
   유발 성분(해산물, 유제품, 견과류 등)·매운맛 표시·용량 관련 문구. 화장품이라면
   피부 자극 성분이나 사용상 주의사항 표시. 의약품이라면 효능·주의사항 표시. 아무것도
   안 보이면 빈 배열.
4. recipeIdeas: 이 상품이 음식이나 음료일 때만, 다른 편의점 조합 상품과 함께 먹거나
   조리하는 아이디어를 2~3개 제안해. 이건 너의 창의적 제안이지 실제 인기 순위가
   아니야 — 그런 척하지 마. 화장품·의약품·생활용품처럼 먹는 것과 무관한 상품이면
   반드시 빈 배열로 둬 — 억지로 먹는 방법을 지어내면 안 돼.

아래 스키마 외의 텍스트(설명, 마크다운 코드블록 기호 등)는 절대 포함하지 마.
응답은 반드시 순수 JSON 하나여야 해.

스키마:
{
  "unreadable": false,
  "productName": string,
  "category": string,          // 상품 종류(예: 컵라면, 스킨케어, 감기약 등). 원산지 국가는 패키지에 명시된 경우에만 덧붙이고, 확실치 않으면 추측하지 마.
  "confidence": "high" | "medium" | "low",
  "hasRealReviews": false,
  "highlights": string[],      // 2~4개. 패키지 관찰 요약.
  "cautionTags": string[],
  "recipeIdeas": string[]      // 음식/음료가 아니면 빈 배열
}

(Reminder: write every text value in ${languageNameEn}.)`
}


// ── 방어 장치 (홍보로 트래픽이 몰리거나 누가 API를 직접 두드려도 비용이 새지 않게) ──
// 서버리스 특성상 인스턴스마다 따로 세는 "최선 노력" 제한이에요. 완벽한 차단이 아니라
// 과도한 남용(봇, 무한 반복)을 막는 용도예요. 한국 통신사는 여러 사람이 같은 IP를 공유하니
// 일반 사용자는 걸리지 않을 만큼 넉넉하게 잡았어요.
const LANGUAGE_NAMES_EN = {
  ko: 'Korean (한국어)',
  ja: 'Japanese (日本語)',
  en: 'English',
  'zh-TW': 'Traditional Chinese (繁體中文, Taiwan)',
  'zh-CN': 'Simplified Chinese (简体中文)',
  th: 'Thai (ภาษาไทย)',
}

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

const ALLOWED_MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_BASE64_CHARS = 3_000_000 // 앱이 1280px로 줄여서 보내서 보통 0.5MB 안팎이에요

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

  if (isRateLimited(req, 30, 10 * 60 * 1000)) {
    res.status(429).json({ error: '요청이 너무 많아요. 잠시 후 다시 시도해주세요.' })
    return
  }

  const { image, mediaType, language } = req.body ?? {}
  if (!image || !mediaType) {
    res.status(400).json({ error: 'image(base64)와 mediaType이 필요해요.' })
    return
  }
  if (typeof image !== 'string' || image.length > MAX_IMAGE_BASE64_CHARS || !ALLOWED_MEDIA_TYPES.has(mediaType)) {
    res.status(400).json({ error: '지원하지 않는 이미지예요.' })
    return
  }

  const effectiveLanguage = ALLOWED_LANGUAGES.has(language) ? language : 'ko'
  const languageLabel = LANGUAGE_NAMES[effectiveLanguage]
  const languageNameEn = LANGUAGE_NAMES_EN[effectiveLanguage]

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
        max_tokens: 1024,
        // Claude Sonnet 5부터는 thinking 필드를 안 주면 기본적으로 내부적으로 '생각'을 먼저 하고,
        // 그 생각한 토큰도 max_tokens 예산에서 깎여요. 사진 하나 보고 짧은 JSON만 뱉으면 되는
        // 단순 작업이라 생각이 필요 없는데, 생각이 예산을 다 먹어버리면 정작 JSON 응답이
        // 텅 비거나 잘려서 파싱에 실패하고, 그때마다 화면엔 항상 같은 데모 상품(mockData.js)이
        // 뜨는 버그로 이어졌어요. 그래서 이 작업에는 생각을 아예 꺼둡니다.
        thinking: { type: 'disabled' },
        system: [{ type: 'text', text: buildSystemPrompt(languageLabel, languageNameEn), cache_control: { type: 'ephemeral' } }],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
              { type: 'text', text: `Analyze this product photo and reply with the JSON object only. Write every text value in ${languageNameEn}.` },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Anthropic API error:', errText)
      const failure = classifyAnthropicFailure(response.status, errText)

      if (failure.kind === 'service_paused') {
        // 월 지출 한도 소진/API 키 문제 — 운영자가 손써야 풀려요. 카카오톡으로 알리고,
        // 사용자에게는 원인을 단정하지 않는 "잠시 쉬는 중" 안내만 보여줘요.
        await alertOwnerWithin({ reason: failure.reason })
        res.status(503).json({ error: 'AI 분석이 잠시 쉬고 있어요.', code: 'service_paused' })
        return
      }
      if (failure.kind === 'busy') {
        res.status(503).json({ error: '지금 이용자가 많아요.', code: 'busy' })
        return
      }
      res.status(502).json({ error: 'AI 분석 중 오류가 발생했어요.', code: 'failed' })
      return
    }

    const data = await response.json()
    const textBlock = data.content?.find((b) => b.type === 'text')
    const cleaned = (textBlock?.text ?? '').replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('JSON parse 실패:', cleaned)
      res.status(502).json({ error: 'AI 응답을 해석하지 못했어요.' })
      return
    }

    // 선택한 언어와 다른 언어(보통 한국어)로 답이 왔으면 번역해서 바로잡아요.
    const finalResult = parsed.unreadable
      ? parsed
      : await ensureLanguage(parsed, { language: effectiveLanguage, languageNameEn, apiKey })

    res.status(200).json(finalResult)
  } catch (err) {
    console.error('scan handler 오류:', err)
    res.status(500).json({ error: '서버 오류가 발생했어요.' })
  }
}
