// 제휴 마케팅 링크 모음. url이 빈 문자열이면 해당 배너는 화면에 노출되지 않습니다.
// 새 제휴가 승인되면 이 파일의 url만 채워 넣으면 바로 반영됩니다.
// group: 'before' = 출발 전 준비, 'during' = 여행 중 편리하게 (마이 탭에서 소제목으로 구분됩니다)
// 라벨/설명 문구는 언어별로 달라야 하므로 여기가 아니라 src/i18n/translations.js에 있습니다.
export const AFFILIATE_LINKS = [
  {
    id: 'esim',
    icon: '📶',
    group: 'before',
    url: 'https://airalo.tpx.lv/dpB7skIA',
  },
  {
    id: 'insurance',
    icon: '🛡️',
    group: 'before',
    url: '', // 승인되면 여기에 실제 추적 링크를 넣으세요
  },
  {
    id: 'tripcom',
    icon: '✈️',
    group: 'before',
    url: '', // 승인되면 여기에 실제 추적 링크를 넣으세요
  },
  {
    id: 'klook',
    icon: '🎟️',
    group: 'during',
    url: '', // 승인되면 여기에 실제 추적 링크를 넣으세요
  },
  {
    id: 'transfer',
    icon: '🚕',
    group: 'during',
    url: '', // 승인되면 여기에 실제 추적 링크를 넣으세요
  },
  {
    id: 'rentalcars',
    icon: '🚗',
    group: 'during',
    url: '', // 승인되면 여기에 실제 추적 링크를 넣으세요 (일본/대만은 대중교통 위주라 우선순위 낮음)
  },
]
