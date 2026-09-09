// 카카오톡 인앱 브라우저(웹뷰)는 카메라 접근이 불안정한 경우가 많아서
// 감지되면 외부 브라우저로 열도록 안내하는 배너를 띄웁니다.
export function isKakaoInApp() {
  if (typeof navigator === 'undefined') return false
  return /KAKAOTALK/i.test(navigator.userAgent)
}
