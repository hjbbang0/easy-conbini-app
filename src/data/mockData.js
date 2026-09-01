// 2단계(정적 뼈대)용 더미 데이터
// 3단계에서 실제 Claude Vision API 응답으로 교체됩니다.

// 실제 후기 DB가 없는 MVP 단계라, 평점/후기수처럼 "진짜 데이터인 척"하는
// 값은 넣지 않습니다. 사진에서 읽어낸 것만 보여주는 게 원칙입니다.
export const MOCK_SCAN_RESULT = {
  productName: '초면왕 컵라면',
  category: '컵라면 · 대만',
  confidence: 'medium', // high | medium | low — 패키지 정보가 얼마나 명확했는지
  highlights: [
    '패키지에 마늘/조미 향 강조 문구가 크게 적혀 있음',
    '고추 아이콘 3단계 중 2단계 표기 — 중간 매운맛으로 추정',
    '용량 표기가 일반형보다 커서 다소 넉넉한 양으로 보임',
  ],
  cautionTags: ['해물 성분 표기 있음', '매운맛 표시 있음'],
}

export const COUNTRIES = [
  { code: 'JP', name: '일본', currency: 'JPY', symbol: '¥' },
  { code: 'TW', name: '대만', currency: 'TWD', symbol: 'NT$' },
  { code: 'FR', name: '프랑스', currency: 'EUR', symbol: '€' },
  { code: 'CN', name: '중국', currency: 'CNY', symbol: '¥' },
  { code: 'TH', name: '태국', currency: 'THB', symbol: '฿' },
  { code: 'US', name: '미국', currency: 'USD', symbol: '$' },
  { code: 'KR', name: '대한민국', currency: 'KRW', symbol: '₩' },
]

export const LANDMARKS = [
  { id: 'eiffel', label: '파리' },
  { id: 'tokyo-tower', label: '도쿄' },
  { id: 'great-wall', label: '베이징' },
  { id: 'temple', label: '방콕' },
]

export const NAV_ITEMS = [
  { id: 'scan', label: '스캔' },
  { id: 'currency', label: '환율' },
  { id: 'recipe', label: '레시피' },
  { id: 'my', label: '마이' },
]
