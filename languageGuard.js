// 선택한 언어와 다른 언어(주로 한국어)로 AI 답이 오면 잡아서 번역해주는 안전장치예요.
//
// 왜 필요한가: 프롬프트 본문과 사용자 메시지가 한국어라서, AI가 "태국어로 써"라는 한 줄보다
// 한국어 문맥에 끌려서 한국어로 답하는 일이 있어요. 프롬프트를 고쳐도 100%는 아니라서,
// 결과에 한글이 많이 섞여 있으면(한국어를 고른 게 아닌데) 한 번 더 번역 호출을 해서 바로잡아요.
// 번역에 실패하면 원래 답을 그대로 돌려줘서, 이 장치 때문에 스캔이 실패하는 일은 없어요.

// 사용자에게 보이는 글자가 한글인 비율(문자 중 한글이 차지하는 비율)
export function hangulShare(texts) {
  const joined = texts.filter((t) => typeof t === 'string').join(' ')
  const letters = (joined.match(/\p{L}/gu) ?? []).length
  if (letters === 0) return 0
  const hangul = (joined.match(/[\uAC00-\uD7A3]/g) ?? []).length
  return hangul / letters
}

const TEXT_KEYS = ['productName', 'category', 'highlights', 'cautionTags', 'recipeIdeas']

// 번역 대상 필드만 뽑아요 (confidence 같은 고정 값은 건드리지 않아요)
export function pickTextFields(data, keys = TEXT_KEYS) {
  const picked = {}
  for (const key of keys) {
    if (typeof data?.[key] === 'string' || Array.isArray(data?.[key])) picked[key] = data[key]
  }
  return picked
}

export function looksWrongLanguage(data, language, keys = TEXT_KEYS) {
  if (language === 'ko') return false // 한국어를 골랐으면 한글이 정상이에요
  const strings = []
  for (const value of Object.values(pickTextFields(data, keys))) {
    if (Array.isArray(value)) strings.push(...value)
    else strings.push(value)
  }
  return hangulShare(strings) > 0.2
}

function sameShape(original, translated) {
  if (!translated || typeof translated !== 'object') return false
  for (const [key, value] of Object.entries(original)) {
    const next = translated[key]
    if (Array.isArray(value)) {
      if (!Array.isArray(next) || next.length !== value.length || !next.every((x) => typeof x === 'string')) return false
    } else if (typeof next !== 'string') {
      return false
    }
  }
  return true
}

// 번역 호출. 실패하거나 모양이 이상하면 null을 돌려줘요(= 원래 답을 쓰라는 뜻).
export async function translateFields(fields, languageNameEn, apiKey) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        thinking: { type: 'disabled' },
        system:
          `You are a precise translator. The user sends one JSON object. Translate every human-readable string value ` +
          `(including words inside parentheses) into ${languageNameEn}. Keep all keys, the number and order of array items, ` +
          `and the JSON structure exactly as they are. Keep brand names and product names in their original script ` +
          `(for example Japanese packaging text), but translate any Korean words around them into ${languageNameEn}. ` +
          `Reply with the JSON object only, with no explanation and no code fences.`,
        messages: [{ role: 'user', content: JSON.stringify(fields) }],
      }),
    })
    if (!response.ok) return null
    const data = await response.json()
    const text = data.content?.find((b) => b.type === 'text')?.text ?? ''
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
    return sameShape(fields, parsed) ? parsed : null
  } catch (err) {
    console.error('언어 보정 번역 실패(원래 답을 그대로 써요):', err?.message ?? err)
    return null
  } finally {
    clearTimeout(timer)
  }
}

// 결과의 언어가 어긋났으면 번역해서 합쳐 돌려줘요. 어긋나지 않았으면 그대로 돌려줘요.
export async function ensureLanguage(data, { language, languageNameEn, apiKey, keys = TEXT_KEYS }) {
  if (!looksWrongLanguage(data, language, keys)) return data
  console.warn(`AI 답변 언어가 선택한 언어(${language})와 달라서 번역 보정을 해요.`)
  const fixed = await translateFields(pickTextFields(data, keys), languageNameEn, apiKey)
  return fixed ? { ...data, ...fixed } : data
}
