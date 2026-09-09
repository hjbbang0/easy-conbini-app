import { useRef } from 'react'
import ScanLoadingRing from './ScanLoadingRing.jsx'

export default function PhotoScanCard({ t, status, onFileSelected, errorMessage }) {
  const inputRef = useRef(null)

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
    e.target.value = ''
  }

  return (
    <div className="scan-card">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        hidden
      />

      {status === 'idle' && (
        <button className="scan-trigger" onClick={() => inputRef.current?.click()}>
          <ScanIcon />
          <span className="scan-trigger-title">{t.scanCta}</span>
          <span className="scan-trigger-sub">{t.scanCtaSub}</span>
        </button>
      )}

      {status === 'loading' && (
        <div className="scan-loading">
          <ScanLoadingRing label={t.scanLoading} />
        </div>
      )}

      {status === 'error' && (
        <div className="scan-loading">
          <p className="scan-error-text">{errorMessage ?? t.scanErrorDefault}</p>
          <button className="scan-retry" onClick={() => inputRef.current?.click()}>
            {t.retake}
          </button>
        </div>
      )}
    </div>
  )
}

function ScanIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path
        d="M8 12V9a2 2 0 0 1 2-2h3M32 12V9a2 2 0 0 0-2-2h-3M8 28v3a2 2 0 0 0 2 2h3M32 28v3a2 2 0 0 1-2 2h-3"
        stroke="var(--ink)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="13" y="16" width="14" height="8" rx="1" stroke="var(--sticker)" strokeWidth="2" />
    </svg>
  )
}
