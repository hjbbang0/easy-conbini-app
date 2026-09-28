// 제휴 마케팅 링크 모음. url이 빈 문자열이면 해당 배너는 화면에 노출되지 않습니다.
// 새 제휴가 승인되면 이 파일의 url만 채워 넣으면 바로 반영됩니다.
// 언어별로 다른 링크가 필요하면 urls: { ko: '...', ja: '...' } 를 추가하세요.
// 해당 언어의 urls 값이 있으면 그것을, 없으면 url 을 쓰고, 둘 다 없으면 배너가 노출되지 않습니다.
// group: 'before' = 출발 전 준비, 'during' = 여행 중 편리하게 (마이 탭에서 소제목으로 구분됩니다)
// 라벨/설명 문구는 언어별로 달라야 하므로 여기가 아니라 src/i18n/translations.js에 있습니다.
export const AFFILIATE_LINKS = [
  {
    id: 'esim',
    icon: '📶',
    group: 'before',
    // 앱 언어에 맞는 Airalo 화면(주소에 언어 코드 포함)으로 연결합니다. 모두 Konbinisnap 프로젝트에서 발급.
    // Sub ID: app-my-esim-{언어}. 아래에 없는 언어는 기본 url(언어 자동 감지)로 연결됩니다.
    urls: {
      ko: 'https://airalo.tpx.lv/wAjNZs4F',
      en: 'https://airalo.tpx.lv/UOl5tYZZ',
      ja: 'https://airalo.tpx.lv/dFQGai87',
      'zh-CN': 'https://airalo.tpx.lv/bQRpHLpc',
      'zh-TW': 'https://airalo.tpx.lv/1IeBnp0Y',
      th: 'https://airalo.tpx.lv/ned8CPl3',
    },
    url: 'https://airalo.tpx.lv/xGsOuZzZ', // 기본(언어 자동 감지) 링크 (Sub ID: app-my-esim)
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
    // 한국어 Klook 페이지(/ko/)로 가는 링크라서 한국어 화면에서만 노출합니다. (Sub ID: app-my-klook)
    // 다른 언어용 링크를 만들면 urls 에 추가하거나, 기본 url 에 넣으세요.
    urls: { ko: 'https://klook.tpx.lv/q28zhItD' },
    url: '',
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
