// MVP 단계의 임시 사용량 추적입니다. 브라우저(localStorage)에만 저장되므로
// 사용자가 브라우저 데이터를 지우면 횟수가 리셋돼요. 그래서 진짜 비용 방어선은
// 서버 쪽 호출 횟수 제한(api/*.js)과 Anthropic 월 지출 한도예요.
// 실제 서비스로 넘어갈 땐 로그인 + 서버 DB + 결제 연동이 필요합니다.

// 예전 키(travelConbini.scanCount / travelConbini.isPremium)는 일부러 안 읽어요.
// 예전에는 "무제한 열기" 버튼이 결제 없이 무제한을 열어줬는데, 그 기록이 남은 브라우저가
// 하루 한도를 우회하지 않게 새 키를 쓰는 거예요.
const DAILY_SCAN_KEY = 'travelConbini.dailyScan' // { date: 'YYYY-MM-DD', count: n }
const PASS_KEY = 'travelConbini.passActive' // 나중에 실제 결제(기간제 패스) 연동 시 사용. 지금은 아무것도 켜지 않아요.
const HOME_PROMPT_SEEN_KEY = 'travelConbini.homePromptSeen'
const SERVICE_PAUSED_UNTIL_KEY = 'travelConbini.servicePausedUntil'

// 하루 무료 스캔 횟수. 자정(기기 현지 시간)이 지나면 다시 채워져요.
export const FREE_SCAN_LIMIT = 5

// 저장소를 못 쓰는 환경(일부 시크릿 모드 등)에서도 최소한 앱을 켜 둔 동안은 한도가 지켜지도록
// 메모리에도 같이 들고 있어요.
let memoryScan = { date: null, count: 0 }

function todayKey() {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function getScanCount() {
  const today = todayKey()
  try {
    const raw = JSON.parse(localStorage.getItem(DAILY_SCAN_KEY))
    if (raw && raw.date === today && Number.isFinite(raw.count)) {
      return Math.max(raw.count, memoryScan.date === today ? memoryScan.count : 0)
    }
  } catch {
    // 저장소를 못 읽으면 아래 메모리 값을 써요
  }
  return memoryScan.date === today ? memoryScan.count : 0
}

export function incrementScanCount() {
  const today = todayKey()
  const next = getScanCount() + 1
  memoryScan = { date: today, count: next }
  try {
    localStorage.setItem(DAILY_SCAN_KEY, JSON.stringify({ date: today, count: next }))
  } catch {
    // 저장 실패해도 앱이 멈추면 안 되니 조용히 무시 (메모리에는 이미 기록했어요)
  }
  return next
}

export function isPremium() {
  try {
    return localStorage.getItem(PASS_KEY) === 'true'
  } catch {
    return false
  }
}

// 실제 결제(기간제 패스) 연동이 생기면 결제 완료 확인 뒤에만 호출하세요.
// 지금은 앱 어디에서도 호출하지 않아요 (결제 없이 무제한이 열리면 비용이 새요).
export function setPremium(value) {
  try {
    localStorage.setItem(PASS_KEY, value ? 'true' : 'false')
  } catch {
    // 무시
  }
}

// 화면 처음 켤 때 딱 한 번만 보여주는 "홈 화면에 추가" 안내 팝업용.
export function hasSeenHomePrompt() {
  try {
    return localStorage.getItem(HOME_PROMPT_SEEN_KEY) === 'true'
  } catch {
    return true // 저장소를 못 읽으면 계속 뜨는 것보단 안 뜨는 쪽이 안전
  }
}

export function markHomePromptSeen() {
  try {
    localStorage.setItem(HOME_PROMPT_SEEN_KEY, 'true')
  } catch {
    // 무시
  }
}

// 서버가 "AI 분석 잠시 쉬는 중(한도·키 문제)"이라고 알려주면, 몇 분 동안은 같은 요청을 계속
// 보내지 않고 안내 화면만 보여줘요. (사용자는 다시 누를수록 더 답답하고, 서버도 불필요한 호출을 받아요)
let memoryPausedUntil = 0

export function markServicePaused(minutes = 5) {
  const until = Date.now() + minutes * 60 * 1000
  memoryPausedUntil = until
  try {
    localStorage.setItem(SERVICE_PAUSED_UNTIL_KEY, String(until))
  } catch {
    // 무시 (메모리에는 기록했어요)
  }
}

export function isServicePaused() {
  let until = memoryPausedUntil
  try {
    until = Math.max(until, Number(localStorage.getItem(SERVICE_PAUSED_UNTIL_KEY) ?? '0'))
  } catch {
    // 메모리 값 사용
  }
  return until > Date.now()
}
