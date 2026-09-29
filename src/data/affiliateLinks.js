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
    logo: '/icons/airalo.png', // Airalo 로고 (마케팅 임팩트를 위해 이모지 대신 사용)
    accent: '#FF6A3D', // Airalo 브랜드 컬러(오렌지)
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
    logo: '/icons/klook.png', // Klook 로고
    accent: '#FF5B00', // Klook 브랜드 컬러(오렌지)
    group: 'during',
    // 앱 언어에 맞는 Klook 액티비티 화면으로 연결합니다. Sub ID: app-my-klook-{언어}.
    urls: {
      ko: 'https://klook.tpx.lv/q28zhItD',
      en: 'https://klook.tpx.lv/BLhT13VQ',
      ja: 'https://klook.tpx.lv/VCyXUCT8',
      'zh-CN': 'https://klook.tpx.lv/9e6UzKZk',
      'zh-TW': 'https://klook.tpx.lv/GSVUU5eU',
      th: 'https://klook.tpx.lv/fsn1xtGq',
    },
    url: '',
  },
  {
    id: 'transfer',
    icon: '🚕',
    logo: '/icons/klook.png', // 공항 픽업도 Klook 페이지로 연결되므로 동일 로고 사용
    accent: '#FF5B00',
    group: 'during',
    // Klook 공항 픽업/샌딩 페이지. 앱 언어에 맞는 화면으로 연결합니다. Sub ID: app-my-transfer-{언어}.
    urls: {
      ko: 'https://klook.tpx.lv/2T2uW21T',
      en: 'https://klook.tpx.lv/UTNtNlTB',
      ja: 'https://klook.tpx.lv/dl6kqk8T',
      'zh-CN': 'https://klook.tpx.lv/oV4TOtxY',
      'zh-TW': 'https://klook.tpx.lv/LXOWCtYr',
      th: 'https://klook.tpx.lv/rTnSJoVU',
    },
    url: '',
  },
  {
    id: 'rentalcars',
    icon: '🚗',
    group: 'during',
    url: '', // 승인되면 여기에 실제 추적 링크를 넣으세요 (일본/대만은 대중교통 위주라 우선순위 낮음)
  },
]
