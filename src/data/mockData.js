// API 호출이 실패했을 때만 보여주는 폴백용 데모 데이터입니다.
export const MOCK_SCAN_RESULT = {
  unreadable: false,
  productName: '초면왕 컵라면',
  category: '컵라면 · 대만',
  confidence: 'medium',
  hasRealReviews: false,
  highlights: [
    '패키지에 마늘/조미 향 강조 문구가 크게 적혀 있음',
    '고추 아이콘 3단계 중 2단계 표기 — 중간 매운맛으로 추정',
    '용량 표기가 일반형보다 커서 다소 넉넉한 양으로 보임',
  ],
  cautionTags: ['해산물 성분 표기 있음', '매운맛 표시 있음'],
  recipeIdeas: [
    '삼각김밥과 함께 먹으면 짭짤한 국물이 밥과 잘 어울려요',
    '치즈를 살짝 얹어 전자레인지에 30초 더 돌리면 크리미해져요',
  ],
}

export const COUNTRIES = [
  { code: 'JP', name: '일본', currency: 'JPY', symbol: '¥' },
  { code: 'TW', name: '대만', currency: 'TWD', symbol: 'NT$' },
  { code: 'FR', name: '프랑스', currency: 'EUR', symbol: '€' },
  { code: 'CN', name: '중국', currency: 'CNY', symbol: '¥' },
  { code: 'TH', name: '태국', currency: 'THB', symbol: '฿' },
  { code: 'US', name: '미국', currency: 'USD', symbol: '$' },
]

export const LANDMARKS = [
  { id: 'eiffel' },
  { id: 'tokyo-tower' },
  { id: 'great-wall' },
  { id: 'temple' },
]
