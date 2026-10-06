// AI 분석이 잠시 멈췄을 때(월 지출 한도·키 문제 등) 보여주는 안내 카드예요.
// 원인을 단정하지 않고("이용자가 많아서" 같은 말 X), 곧 다시 열린다는 것과
// 지금 쓸 수 있는 기능(환율 계산기)만 알려줘요. 재시도 버튼은 일부러 두지 않았어요.
export default function ServicePausedCard({ t, onGoCurrency }) {
  return (
    <div className="paywall-card">
      <p className="paywall-eyebrow">{t.pausedEyebrow}</p>
      <h2 className="paywall-title">
        {t.pausedTitle1}
        <br />
        {t.pausedTitle2}
      </h2>
      <p className="paywall-body">{t.pausedBody}</p>
      <button className="paywall-cta" onClick={onGoCurrency}>
        {t.paywallCta}
      </button>
    </div>
  )
}
