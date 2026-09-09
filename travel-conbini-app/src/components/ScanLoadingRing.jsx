import { useEffect, useState } from 'react'

const RADIUS = 36
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const EMOJIS = ['🍣', '🍚', '☕', '🍕', '🍡', '🍙']

export default function ScanLoadingRing({ label }) {
  const [percent, setPercent] = useState(4)

  useEffect(() => {
    // 실제 완료 시점을 모르기 때문에, 92%까지는 점점 느려지며 채워지다가
    // 실제 응답이 도착하면(이 컴포넌트가 사라지면서) 자연스럽게 끝나는
    // 착시형 진행바예요. 92%에서 멈춰있으면 "거의 다 됐다"는 인상을 줘요.
    const interval = setInterval(() => {
      setPercent((prev) => {
        if (prev >= 92) return prev
        const remaining = 92 - prev
        return prev + Math.max(remaining * 0.06, 0.4)
      })
    }, 180)
    return () => clearInterval(interval)
  }, [])

  const offset = CIRCUMFERENCE * (1 - percent / 100)

  return (
    <div className="scan-loading-wrap">
      <div className="scan-bubbles" aria-hidden="true">
        {EMOJIS.map((emoji, i) => (
          <span
            key={i}
            className="scan-bubble"
            style={{
              animationDelay: `${i * 0.35}s`,
              left: `${8 + i * 16}%`,
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="scan-ring-box">
        <svg width="96" height="96" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={RADIUS} fill="none" stroke="var(--paper-dim)" strokeWidth="8" />
          <circle
            cx="48"
            cy="48"
            r={RADIUS}
            fill="none"
            stroke="var(--sticker)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            transform="rotate(-90 48 48)"
          />
        </svg>
        <span className="scan-ring-percent">{Math.floor(percent)}%</span>
      </div>

      <p className="scan-loading-label">{label}</p>
    </div>
  )
}
