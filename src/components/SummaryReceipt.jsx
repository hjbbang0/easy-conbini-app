export default function SummaryReceipt({ t, result, onReset, isFallback }) {
  const isLowConfidence = result.confidence === 'low'
  const confidenceLabel = {
    high: t.confidenceHigh,
    medium: t.confidenceMedium,
    low: t.confidenceLow,
  }[result.confidence]

  return (
    <div className="receipt">
      {isLowConfidence && (
        <div className="receipt-retake-banner">
          <p>{t.retakeBanner}</p>
          <button onClick={onReset}>{t.retake}</button>
        </div>
      )}

      <div className="receipt-head">
        <p className={`receipt-label ${result.hasRealReviews ? 'receipt-label-real' : ''}`}>
          {result.hasRealReviews ? t.receiptRealLabel : t.receiptAiLabel}
        </p>
        <h2>{result.productName}</h2>
        <p className="receipt-sub">
          {result.category} · {confidenceLabel ?? ''}
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
        {result.hasRealReviews ? t.disclaimerReal : t.disclaimerEstimate}
        {isFallback && ' (demo)'}
      </p>

      <button className="receipt-reset" onClick={onReset}>
        {t.resetButton}
      </button>
    </div>
  )
}
