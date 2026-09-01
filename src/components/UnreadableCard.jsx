export default function UnreadableCard({ t, onRetake }) {
  return (
    <div className="unreadable-card">
      <div className="unreadable-icon" aria-hidden="true">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path
            d="M6 10h4l2-3h12l2 3h4v18H6z"
            stroke="var(--sticker)"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M11 19a7 7 0 1 0 14 0 7 7 0 0 0-14 0Z" stroke="var(--sticker)" strokeWidth="2" />
          <path d="M4 4l28 28" stroke="var(--sticker)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="unreadable-title">{t.unreadableTitle}</h2>
      <p className="unreadable-body">{t.unreadableBody}</p>
      <button className="unreadable-retake" onClick={onRetake}>
        {t.retake}
      </button>
    </div>
  )
}
