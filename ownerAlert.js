// 운영자(혜진님) 알림 도구 — AI 분석이 멈추면 카카오톡 "나와의 채팅"으로 알려줘요.
//
// 쓰이는 곳
//   - api/scan.js, api/reviews.js : Anthropic이 한도 초과/키 문제로 요청을 거절하면 알림
//   - api/kakao-setup.js          : 카카오 계정 연결(처음 한 번)
//   - api/kakao-keepalive.js      : 매주 자동으로 토큰을 갱신해서 연결이 끊기지 않게 유지
//
// 필요한 환경변수 (없으면 알림만 조용히 건너뛰고 앱은 정상 동작해요)
//   KAKAO_REST_API_KEY            카카오 디벨로퍼스 > REST API 키
//   KAKAO_CLIENT_SECRET           (카카오에서 Client Secret을 켰을 때만)
//   KV_REST_API_URL / KV_REST_API_TOKEN  또는  UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
//                                 (Vercel Storage의 Upstash Redis를 연결하면 자동으로 생겨요)
//
// 카카오 토큰은 액세스 6시간 / 리프레시 2달이고, 리프레시를 쓸 때마다(만료 1달 전부터)
// 새 리프레시 토큰이 나오면서 옛것은 폐기돼요. 그래서 새 토큰을 반드시 저장해둬야 하고,
// 그 저장소로 Upstash Redis(KV)를 써요.

const KAKAO_TOKEN_URL = 'https://kauth.kakao.com/oauth/token'
const KAKAO_ME_URL = 'https://kapi.kakao.com/v2/user/me'
const KAKAO_MEMO_URL = 'https://kapi.kakao.com/v2/api/talk/memo/default/send'
const REFRESH_KEY = 'konbinisnap:kakao:refresh_token'
const THROTTLE_PREFIX = 'konbinisnap:alert:throttle:'
export const DEFAULT_REDIRECT_URI = 'https://www.konbinisnap.com/api/kakao-setup'
const CONSOLE_URL = 'https://console.anthropic.com/settings/limits'

// ── Anthropic 오류가 "서비스 멈춤급"인지 "잠깐 바쁨"인지 구분 ─────────────────────────
// service_paused : 월 지출 한도/크레딧 소진, API 키 문제 → 운영자가 손써야 풀려요
// busy           : 순간적인 호출 한도·과부하 → 잠시 뒤 다시 하면 돼요
// failed         : 그 외 일반 오류
export function classifyAnthropicFailure(status, bodyText) {
  let type = ''
  let message = ''
  try {
    const parsed = JSON.parse(bodyText)
    type = String(parsed?.error?.type ?? '')
    message = String(parsed?.error?.message ?? '')
  } catch {
    message = String(bodyText ?? '').slice(0, 300)
  }
  const haystack = `${type} ${message}`.toLowerCase()

  if (/usage limit|spend(ing)? limit|regain access|credit balance|billing|purchase credits|plans & billing/.test(haystack)) {
    return { kind: 'service_paused', reason: 'limit', detail: message }
  }
  if (status === 401 || status === 403 || /authentication_error|permission_error/.test(haystack)) {
    return { kind: 'service_paused', reason: 'auth', detail: message }
  }
  if (status === 429 || status === 529 || /rate_limit_error|overloaded_error/.test(haystack)) {
    return { kind: 'busy', detail: message }
  }
  return { kind: 'failed', detail: message }
}

export function buildAlertText(reason, now = new Date()) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const stamp = `${kst.getUTCMonth() + 1}/${kst.getUTCDate()} ${String(kst.getUTCHours()).padStart(2, '0')}:${String(kst.getUTCMinutes()).padStart(2, '0')}`
  if (reason === 'auth') {
    return `🚨 콘비니스냅 AI 분석이 멈췄어요 (${stamp})\n원인: Anthropic API 키 문제(만료·삭제 등)\n→ 새 키 발급 → Vercel ANTHROPIC_API_KEY 교체 → Redeploy`
  }
  return `🚨 콘비니스냅 AI 분석이 멈췄어요 (${stamp})\n원인: Anthropic 월 지출 한도 또는 크레딧 소진\n→ Console에서 한도를 올리면 바로 풀려요`
}

// ── 아주 작은 fetch 도우미 (오래 걸리면 포기) ──────────────────────────────────────
async function fetchWithTimeout(url, options = {}, ms = 4000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// ── 저장소(Upstash Redis REST) ────────────────────────────────────────────────────
const kvUrl = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
const kvToken = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
export const kvConfigured = () => Boolean(kvUrl() && kvToken())
export const kakaoConfigured = () => Boolean(process.env.KAKAO_REST_API_KEY) && kvConfigured()

async function kv(command) {
  const res = await fetchWithTimeout(kvUrl(), {
    method: 'POST',
    headers: { Authorization: `Bearer ${kvToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  })
  if (!res.ok) throw new Error(`kv ${res.status}`)
  const data = await res.json()
  return data.result
}

function form(fields) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  return params
}

const FORM_HEADERS = { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }

// ── 카카오 ───────────────────────────────────────────────────────────────────────
export async function exchangeKakaoCode(code, redirectUri = process.env.KAKAO_REDIRECT_URI || DEFAULT_REDIRECT_URI) {
  const res = await fetchWithTimeout(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({
      grant_type: 'authorization_code',
      client_id: process.env.KAKAO_REST_API_KEY,
      redirect_uri: redirectUri,
      code,
      client_secret: process.env.KAKAO_CLIENT_SECRET,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`kakao code exchange failed: ${data.error_code ?? data.error ?? res.status}`)
  return data
}

// 가입 미완료 처리(24시간 뒤 연결 해제)를 막으려면 토큰을 받은 직후 사용자 정보를 한 번 조회해야 해요.
export async function touchKakaoUser(accessToken) {
  const res = await fetchWithTimeout(KAKAO_ME_URL, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`kakao user/me failed: ${res.status}`)
  return res.json()
}

export async function saveKakaoRefreshToken(refreshToken) {
  await kv(['SET', REFRESH_KEY, refreshToken])
}

// 저장된 리프레시 토큰으로 새 액세스 토큰을 받아요. 리프레시 토큰이 갱신돼서 오면 바로 저장해요.
export async function getKakaoAccessToken() {
  const refreshToken = await kv(['GET', REFRESH_KEY])
  if (!refreshToken) return null
  const res = await fetchWithTimeout(KAKAO_TOKEN_URL, {
    method: 'POST',
    headers: FORM_HEADERS,
    body: form({
      grant_type: 'refresh_token',
      client_id: process.env.KAKAO_REST_API_KEY,
      refresh_token: refreshToken,
      client_secret: process.env.KAKAO_CLIENT_SECRET,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`kakao refresh failed: ${data.error_code ?? data.error ?? res.status}`)
  if (data.refresh_token) await saveKakaoRefreshToken(data.refresh_token)
  return data.access_token
}

export async function sendKakaoMemo(accessToken, text, linkUrl = CONSOLE_URL) {
  const template = {
    object_type: 'text',
    text: String(text).slice(0, 190), // 카카오 텍스트 템플릿은 200자까지
    link: { web_url: linkUrl, mobile_web_url: linkUrl },
    button_title: '확인하기',
  }
  const res = await fetchWithTimeout(KAKAO_MEMO_URL, {
    method: 'POST',
    headers: { ...FORM_HEADERS, Authorization: `Bearer ${accessToken}` },
    body: form({ template_object: JSON.stringify(template) }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || (data.result_code !== undefined && data.result_code !== 0)) {
    throw new Error(`kakao memo failed: ${res.status} ${data.msg ?? ''}`)
  }
  return data
}

// ── 운영자 알림 (같은 원인은 6시간에 한 번만) ──────────────────────────────────────
export async function alertOwner({ reason, throttleSeconds = 6 * 60 * 60 } = {}) {
  if (!kakaoConfigured()) return { sent: false, reason: 'not_configured' }
  const throttleKey = `${THROTTLE_PREFIX}${reason}`
  try {
    // 서버 인스턴스가 여러 개여도 딱 한 번만 보내려고 "없을 때만 저장(NX)"을 써요.
    const first = await kv(['SET', throttleKey, '1', 'EX', String(throttleSeconds), 'NX'])
    if (first !== 'OK') return { sent: false, reason: 'throttled' }

    try {
      const accessToken = await getKakaoAccessToken()
      if (!accessToken) throw new Error('kakao not linked yet')
      await sendKakaoMemo(accessToken, buildAlertText(reason))
      return { sent: true }
    } catch (err) {
      // 보내는 데 실패했는데 6시간 동안 막아버리면 안 되니 잠금을 풀어줘요.
      await kv(['DEL', throttleKey]).catch(() => {})
      throw err
    }
  } catch (err) {
    console.error('운영자 카카오 알림 실패:', err?.message ?? err)
    return { sent: false, reason: 'error' }
  }
}

// 응답을 오래 붙잡지 않도록, 알림은 최대 5초만 기다려요.
export function alertOwnerWithin(args, ms = 5000) {
  return Promise.race([alertOwner(args), new Promise((resolve) => setTimeout(() => resolve({ sent: false, reason: 'timeout' }), ms))])
}
