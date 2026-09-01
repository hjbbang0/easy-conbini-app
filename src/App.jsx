import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import PhotoScanCard from './components/PhotoScanCard.jsx'
import SummaryReceipt from './components/SummaryReceipt.jsx'
import PaywallCard from './components/PaywallCard.jsx'
import LandmarkStrip from './components/LandmarkStrip.jsx'
import BottomNav from './components/BottomNav.jsx'
import { MOCK_SCAN_RESULT, COUNTRIES, LANDMARKS, NAV_ITEMS } from './data/mockData.js'
import { FREE_SCAN_LIMIT, getScanCount, incrementScanCount, isPremium, setPremium } from './utils/usage.js'

export default function App() {
  const [scanStatus, setScanStatus] = useState('idle') // idle | loading | done | error
  const [result, setResult] = useState(null)
  const [isFallback, setIsFallback] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [countryIndex, setCountryIndex] = useState(0)
  const [activeTab, setActiveTab] = useState('scan')

  const [scanCount, setScanCount] = useState(0)
  const [premium, setPremiumState] = useState(false)

  useEffect(() => {
    setScanCount(getScanCount())
    setPremiumState(isPremium())
  }, [])

  const country = COUNTRIES[countryIndex]
  const remaining = Math.max(FREE_SCAN_LIMIT - scanCount, 0)
  const isPaywalled = !premium && remaining <= 0

  async function handleFileSelected(file) {
    // 무료 횟수를 다 썼는데 어떤 경로로든 여기까지 왔다면(경쟁 상태 방지) 다시 막기
    if (isPaywalled) return

    setScanStatus('loading')
    setErrorMessage(null)

    // 스캔을 "시도"하는 시점에 차감. API 호출 자체가 크레딧을 쓰기 때문에
    // 결과 성공 여부와 무관하게 여기서 카운트합니다.
    const nextCount = incrementScanCount()
    setScanCount(nextCount)

    try {
      const { base64, mediaType } = await fileToBase64(file)

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType }),
      })

      if (!response.ok) throw new Error('scan-api-failed')

      const data = await response.json()
      setResult(data)
      setIsFallback(false)
      setScanStatus('done')
    } catch (err) {
      console.warn('AI 분석 실패, 데모 데이터로 대체:', err)
      setResult(MOCK_SCAN_RESULT)
      setIsFallback(true)
      setScanStatus('done')
    }
  }

  function handleReset() {
    setScanStatus('idle')
    setResult(null)
  }

  function handleCountryCycle() {
    setCountryIndex((i) => (i + 1) % COUNTRIES.length)
  }

  // TODO: 실제 결제(Stripe Checkout 등) 완료 콜백에서 setPremium(true)를 호출하도록 교체
  function handleSubscribe() {
    setPremium(true)
    setPremiumState(true)
  }

  return (
    <div className="app-shell">
      <div className="phone-frame">
        <Header
          country={country}
          onOpenCountryPicker={handleCountryCycle}
          remaining={remaining}
          isPremium={premium}
        />

        <main className="main-scroll">
          {isPaywalled && scanStatus !== 'done' ? (
            <PaywallCard onSubscribe={handleSubscribe} />
          ) : scanStatus === 'done' && result ? (
            <SummaryReceipt result={result} onReset={handleReset} isFallback={isFallback} />
          ) : (
            <PhotoScanCard
              status={scanStatus}
              onFileSelected={handleFileSelected}
              errorMessage={errorMessage}
            />
          )}

          <LandmarkStrip landmarks={LANDMARKS} />
        </main>

        <BottomNav items={NAV_ITEMS} active={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  )
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve({ base64, mediaType: file.type })
    }
    reader.onerror = () => reject(new Error('파일을 읽지 못했어요.'))
    reader.readAsDataURL(file)
  })
}
