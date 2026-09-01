const CONFIDENCE_LABEL = {
  high: '정보 뚜렷함',
  medium: '일부 추정 포함',
  low: '추정 위주',
}

export default function SummaryReceipt({ result, onReset, isFallback }) {
  const isLowConfidence = result.confidence === 'low'

  return (
    <div className="receipt">
      {isLowConfidence && (
        <div className="receipt-retake-banner">
          <p>사진이 흐리거나 정보가 부족해서 잘 못 읽었어요.</p>
          <button onClick={onReset}>다시 찍기</button>
        </div>
      )}

      <div className="receipt-head">
        <p className="receipt-label">AI 추정 요약 · 실제 후기 아님</p>
        <h2>{result.productName}</h2>
        <p className="receipt-sub">
          {result.category} · {CONFIDENCE_LABEL[result.confidence] ?? '추정'}
        </p>
      </div>

      <div className="receipt-divider" aria-hidden="true" />

      <ul className="receipt-summary">
        {result.highlights.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>

      {result.cautionTags?.length > 0 && (
        <div className="receipt-tags">
          {result.cautionTags.map((tag) => (
            <span key={tag} className="receipt-tag receipt-tag-caution">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="receipt-barcode" aria-hidden="true" />

      <p className="receipt-disclaimer">
        사진 속 패키지 정보로 AI가 추정한 내용이에요. 실제 맛·성분은 제품 뒷면을 확인하세요.
        {isFallback && ' (지금은 데모 데이터로 보여드리고 있어요)'}
      </p>

      <button className="receipt-reset" onClick={onReset}>
        다른 상품 스캔하기
      </button>
    </div>
  )
}
