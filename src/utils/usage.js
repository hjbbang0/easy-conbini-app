// MVP 단계의 임시 사용량 추적입니다. 브라우저(localStorage)에만 저장되므로
// 사용자가 브라우저 데이터를 지우면 횟수가 리셋돼요.
// 실제 서비스로 넘어갈 땐 로그인 + 서버 DB + 결제(Stripe 등) 연동이 필요합니다.

const SCAN_COUNT_KEY = 'travelConbini.scanCount'
const PREMIUM_KEY = 'travelConbini.isPremium'

export const FREE_SCAN_LIMIT = 5

export function getScanCount() {
  try {
    return Number(localStorage.getItem(SCAN_COUNT_KEY) ?? '0')
  } catch {
    return 0
  }
}

export function incrementScanCount() {
  const next = getScanCount() + 1
  try {
    localStorage.setItem(SCAN_COUNT_KEY, String(next))
  } catch {
    // 저장 실패해도 앱이 멈추면 안 되니 조용히 무시
  }
  return next
}

export function isPremium() {
  try {
    return localStorage.getItem(PREMIUM_KEY) === 'true'
  } catch {
    return false
  }
}

// 실제 결제 연동 전까지 임시로 프리미엄 상태를 켜는 함수.
// TODO: Stripe Checkout 등 실제 결제 완료 콜백에서만 호출하도록 교체.
export function setPremium(value) {
  try {
    localStorage.setItem(PREMIUM_KEY, value ? 'true' : 'false')
  } catch {
    // 무시
  }
}
