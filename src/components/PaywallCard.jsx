// 오늘 무료 스캔을 다 썼을 때 보여주는 카드예요. (예전엔 결제 없이 무제한을 열어주는
// 버튼이 있었는데, 비용이 끝없이 늘어서 "내일 다시 충전" 안내로 바꿨어요.)
export default function PaywallCard({ t, onGoCurrency }) {
  return (
    <div className="paywall-card">
      <p className="paywall-eyebrow">{t.paywallEyebrow}</p>
      <h2 className="paywall-title">
        {t.paywallTitle1}
        <br />
        {t.paywallTitle2}
      </h2>
      <p className="paywall-body">{t.paywallBody}</p>

      <ul className="paywall-perks">
        {t.paywallPerks.map((perk) => (
          <li key={perk}>{perk}</li>
        ))}
      </ul>

      <button className="paywall-cta" onClick={onGoCurrency}>
        {t.paywallCta}
      </button>
    </div>
  )
}
