import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import LanguageTabs from './components/LanguageTabs.jsx'
import PhotoScanCard from './components/PhotoScanCard.jsx'
import SummaryReceipt from './components/SummaryReceipt.jsx'
import UnreadableCard from './components/UnreadableCard.jsx'
import PaywallCard from './components/PaywallCard.jsx'
import InAppBrowserBanner from './components/InAppBrowserBanner.jsx'
import BottomNav from './components/BottomNav.jsx'
import CurrencyView from './components/CurrencyView.jsx'
import RecipeView from './components/RecipeView.jsx'
import MyView from './components/MyView.jsx'
import { MOCK_SCAN_RESULT, COUNTRIES } from './data/mockData.js'
import { FREE_SCAN_LIMIT, getScanCount, incrementScanCount, isPremium, setPremium } from './utils/usage.js'
import { isKakaoInApp } from './utils/browserDetect.js'
import { resizeAndEncode } from './utils/imageResize.js'
import { getDictionary } from './i18n/translations.js'

// 언어마다 다른 CJK 폰트를 써야 글자 모양이 깨지지 않아요 (Latin 전용 폰트는
// 한글/일본어/중국어 글리프가 아예 없어서 시스템 기본 폰트로 떨어져버려요).
const DISPLAY_FONT_BY_LANG = {
  ko: "'Noto Sans KR', sans-serif",
  ja: "'Noto Sans JP', sans-serif",
  en: "'Archivo Black', sans-serif",
  'zh-TW': "'Noto Sans TC', sans-serif",
  'zh-CN': "'Noto Sans SC', sans-serif",
}

export default function App() {
  const [language, setLanguage] = useState('ko')
  const t = getDictionary(language)

  const [activeTab, setActiveTab] = useState('scan')

  // 스캔 관련 상태
  const [scanStatus, setScanStatus] = useState('idle') // idle | loading | done | unreadable | error
  const [result, setResult] = useState(null)
  const [isFallback, setIsFallback] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [lastProduct, setLastProduct] = useState(null) // 레시피 탭에서 참조

  // 환율 탭에서 선택 중인 나라
  const [currencyCountry, setCurrencyCountry] = useState(COUNTRIES[0])

  // 사용량/구독 상태
  const [scanCount, setScanCount] = useState(0)
  const [premium, setPremiumState] = useState(false)
  const [showInAppWarning, setShowInAppWarning] = useState(false)

  useEffect(() => {
    setScanCount(getScanCount())
    setPremiumState(isPremium())
    setShowInAppWarning(isKakaoInApp())
  }, [])

  const remaining = Math.max(FREE_SCAN_LIMIT - scanCount, 0)
  const isPaywalled = !premium && remaining <= 0

  async function handleFileSelected(file) {
    if (isPaywalled) return

    setScanStatus('loading')
    setErrorMessage(null)

    const nextCount = incrementScanCount()
    setScanCount(nextCount)

    try {
      const { base64, mediaType } = await resizeAndEncode(file)

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType, language }),
      })

      if (!response.ok) throw new Error('scan-api-failed')

      const data = await response.json()

      if (data.unreadable) {
        setScanStatus('unreadable')
        return
      }

      setResult(data)
      setLastProduct(data)
      setIsFallback(false)
      setScanStatus('done')
    } catch (err) {
      console.warn('AI 분석 실패, 데모 데이터로 대체:', err)
      setResult(MOCK_SCAN_RESULT)
      setLastProduct(MOCK_SCAN_RESULT)
      setIsFallback(true)
      setScanStatus('done')
    }
  }

  function handleReset() {
    setScanStatus('idle')
    setResult(null)
  }

  function handleSubscribe() {
    setPremium(true)
    setPremiumState(true)
  }

  function handleResetPremium() {
    setPremium(false)
    setPremiumState(false)
  }

  return (
    <div className="app-shell">
      <div className="phone-frame" style={{ '--font-display': DISPLAY_FONT_BY_LANG[language] }}>
        <Header t={t} remaining={remaining} isPremium={premium} />
        <LanguageTabs language={language} onChange={setLanguage} />

        <main className="main-scroll">
          {showInAppWarning && <InAppBrowserBanner t={t} />}

          {activeTab === 'scan' &&
            (isPaywalled && scanStatus !== 'done' ? (
              <PaywallCard t={t} onSubscribe={handleSubscribe} />
            ) : scanStatus === 'unreadable' ? (
              <UnreadableCard t={t} onRetake={handleReset} />
            ) : scanStatus === 'done' && result ? (
              <SummaryReceipt t={t} result={result} onReset={handleReset} isFallback={isFallback} />
            ) : (
              <PhotoScanCard
                t={t}
                status={scanStatus}
                onFileSelected={handleFileSelected}
                errorMessage={errorMessage}
              />
            ))}

          {activeTab === 'currency' && (
            <CurrencyView
              t={t}
              countries={COUNTRIES}
              selectedCountry={currencyCountry}
              onSelectCountry={setCurrencyCountry}
            />
          )}

          {activeTab === 'recipe' && (
            <RecipeView t={t} lastProduct={lastProduct} onGoScan={() => setActiveTab('scan')} />
          )}

          {activeTab === 'my' && (
            <MyView
              t={t}
              language={language}
              onChangeLanguage={setLanguage}
              premium={premium}
              scanCount={scanCount}
              onResetPremium={handleResetPremium}
            />
          )}
        </main>

        <BottomNav t={t} active={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  )
}
