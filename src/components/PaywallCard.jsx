export default function PaywallCard({ onSubscribe }) {
  return (
    <div className="paywall-card">
      <p className="paywall-eyebrow">무료 스캔 다 썼어요</p>
      <h2 className="paywall-title">
        이번 여행,
        <br />
        계속 스캔할까요?
      </h2>
      <p className="paywall-body">
        무료로 제공되는 5번의 스캔을 모두 사용했어요. 프리미엄으로 전환하면 여행 내내 횟수
        걱정 없이 스캔할 수 있어요.
      </p>

      <ul className="paywall-perks">
        <li>스캔 무제한</li>
        <li>레시피·환율 프리미엄 기능 잠금 해제</li>
        <li>오프라인에서도 마지막 결과 저장</li>
      </ul>

      <button className="paywall-cta" onClick={onSubscribe}>
        프리미엄 구독하기
      </button>
      <p className="paywall-note">* 결제 연동 전 데모 버튼이에요. 실제 결제는 아직 붙지 않았어요.</p>
    </div>
  )
}
