import { useEffect, useState } from 'react'

// 간이 개인정보처리방침 / 이용약관. 실제 사업자 정보(상호, 대표자, 문의 이메일 등)가
// 확정되면 아래 [ ] 표시된 자리에 채워 넣으세요.
const POLICY_TEXT = {
  privacy: {
    ko: [
      ['수집하는 정보', 'KonbiniSnap 앱은 로그인 기능이 없으며, 무료 스캔 횟수·프리미엄 여부 등 이용 현황은 이용자 기기의 브라우저(localStorage)에만 저장되고 서버로 전송되지 않습니다.'],
      ['사진 처리', '스캔 시 촬영한 사진은 상품 식별을 위해 AI 분석 서비스(Anthropic)로 전송되며, 앱 자체는 사진을 별도로 저장하지 않습니다.'],
      ['블로그 구독', '블로그(blog.konbinisnap.com)의 이메일 구독은 별도 서비스(inblog)를 통해 처리되며, 해당 서비스의 정책이 적용됩니다.'],
      ['제휴 링크', '이심·여행자보험·Trip.com 등 제휴 링크를 통해 이동하는 외부 사이트에는 각 사이트의 개인정보처리방침이 적용됩니다.'],
      ['문의', '개인정보 관련 문의: konbinisnap.help@gmail.com'],
    ],
    en: [
      ['Data we collect', 'KonbiniSnap has no login. Usage status (free scan count, premium status) is stored only in your browser (localStorage) and is never sent to our server.'],
      ['Photo handling', 'Photos you scan are sent to an AI analysis service (Anthropic) to identify the product. The app itself does not store your photos.'],
      ['Blog subscription', 'Email subscriptions on our blog (blog.konbinisnap.com) are handled by a separate service (inblog) under its own policy.'],
      ['Affiliate links', 'External sites reached via affiliate links (eSIM, travel insurance, Trip.com, etc.) are governed by their own privacy policies.'],
      ['Contact', 'For privacy questions: konbinisnap.help@gmail.com'],
    ],
  },
  terms: {
    ko: [
      ['정보의 성격', '앱이 제공하는 AI 추정 요약·실제 후기 요약은 참고용 정보이며, 실제 구매 결정과 그 결과에 대한 책임은 이용자 본인에게 있습니다.'],
      ['알레르기·건강 정보', '알레르기 유발 성분 등 건강 관련 표시는 AI가 사진에서 추정한 참고 정보로, 정확성을 보장하지 않습니다. 실제 섭취 전 반드시 제품 포장의 원문 표기를 확인하세요.'],
      ['제휴 수익', '앱 내 일부 링크는 제휴 마케팅 링크이며, 해당 링크를 통한 구매·예약 시 운영자가 제휴사로부터 소정의 수수료를 받을 수 있습니다.'],
    ],
    en: [
      ['Nature of information', 'AI-estimated summaries and review summaries are for reference only. Purchase decisions and their outcomes are the user\u2019s own responsibility.'],
      ['Allergy & health info', 'Allergy and health-related tags are AI estimates based on photos and are not guaranteed accurate. Always check the actual product packaging before consuming.'],
      ['Affiliate income', 'Some links in the app are affiliate links. Purchases or bookings made through them may earn the operator a commission from the partner.'],
    ],
  },
}

export default function PolicyModal({ open, onClose }) {
  const [tab, setTab] = useState('privacy')

  useEffect(() => {
    if (!open) setTab('privacy')
  }, [open])

  if (!open) return null

  return (
    <div className="policy-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="policy-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="policy-tabs">
          <button
            className={`policy-tab ${tab === 'privacy' ? 'is-active' : ''}`}
            onClick={() => setTab('privacy')}
          >
            개인정보처리방침
          </button>
          <button
            className={`policy-tab ${tab === 'terms' ? 'is-active' : ''}`}
            onClick={() => setTab('terms')}
          >
            이용약관
          </button>
          <button className="policy-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        <div className="policy-body">
          {['ko', 'en'].map((lang) => (
            <div key={lang} className="policy-lang-block">
              <p className="policy-lang-label">{lang === 'ko' ? '한국어' : 'English'}</p>
              {POLICY_TEXT[tab][lang].map(([heading, body]) => (
                <div key={heading} className="policy-item">
                  <p className="policy-item-heading">{heading}</p>
                  <p className="policy-item-body">{body}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
