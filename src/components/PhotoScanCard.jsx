import { useRef } from 'react'

export default function PhotoScanCard({ status, onFileSelected, errorMessage }) {
  const inputRef = useRef(null)

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (file) onFileSelected(file)
    e.target.value = '' // 같은 파일 다시 선택해도 onChange 트리거되게
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
          <span className="scan-trigger-title">진열대를 비춰보세요</span>
          <span className="scan-trigger-sub">사진 한 장이면 AI 요약 끝</span>
        </button>
      )}

      {status === 'loading' && (
        <div className="scan-loading">
          <span className="scan-loading-bar" />
          <p>사진 분석하는 중...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="scan-loading">
          <p className="scan-error-text">{errorMessage ?? '분석에 실패했어요. 다시 시도해주세요.'}</p>
          <button className="scan-retry" onClick={() => inputRef.current?.click()}>
            다시 찍기
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
