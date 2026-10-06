import { useEffect, useRef, useState } from 'react'
import Header from './components/Header.jsx'
import LanguageTabs from './components/LanguageTabs.jsx'
import PhotoScanCard from './components/PhotoScanCard.jsx'
import SummaryReceipt from './components/SummaryReceipt.jsx'
import UnreadableCard from './components/UnreadableCard.jsx'
import PaywallCard from './components/PaywallCard.jsx'
import ServicePausedCard from './components/ServicePausedCard.jsx'
import InAppBrowserBanner from './components/InAppBrowserBanner.jsx'
import AddToHomeModal from './components/AddToHomeModal.jsx'
import BottomNav from './components/BottomNav.jsx'
import CurrencyView from './components/CurrencyView.jsx'
import RecipeView from './components/RecipeView.jsx'
import MyView from './components/MyView.jsx'
import { COUNTRIES } from './data/mockData.js'
import {
  FREE_SCAN_LIMIT,
  getScanCount,
  incrementScanCount,
  isPremium,
  setPremium,
  hasSeenHomePrompt,
  markHomePromptSeen,
  markServicePaused,
  isServicePaused,
} from './utils/usage.js'
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
  th: "'Noto Sans Thai', sans-serif",
}

export default function App() {
  const [language, setLanguage] = useState('ko')
  const t = getDictionary(language)

  const [activeTab, setActiveTab] = useState('scan')

  // 스캔 관련 상태
  const [scanStatus, setScanStatus] = useState('idle') // idle | loading | done | unreadable | error | paused
  const [result, setResult] = useState(null)
  const [isFallback, setIsFallback] = useState(false)
  const [errorMessage, setErrorMessage] = useState(null)
  const [lastProduct, setLastProduct] = useState(null) // 레시피 탭에서 참조
  const [reviewStatus, setReviewStatus] = useState('idle') // idle | loading | done | unavailable
  const scanIdRef = useRef(0) // 새 스캔이 시작되면 이전 후기 검색 결과를 무시하기 위한 가드
  const reviewCacheRef = useRef(new Map()) // 같은 상품의 후기를 같은 접속 중에 또 찾지 않게 (비용 절약)

  // 환율 탭에서 선택 중인 나라
  const [currencyCountry, setCurrencyCountry] = useState(COUNTRIES[0])

  // 사용량/구독 상태
  const [scanCount, setScanCount] = useState(0)
  const [premium, setPremiumState] = useState(false)
  const [showInAppWarning, setShowInAppWarning] = useState(false)
  const [showHomePrompt, setShowHomePrompt] = useState(false)

  useEffect(() => {
    setScanCount(getScanCount())
    setPremiumState(isPremium())
    if (isServicePaused()) setScanStatus('paused')
    const inApp = isKakaoInApp()
    setShowInAppWarning(inApp)
    if (!inApp && !hasSeenHomePrompt()) {
      setShowHomePrompt(true)
    }
  }, [])

  // 자정이 지나 하루 한도가 다시 채워졌는데 화면은 예전 상태로 남아 있는 일이 없게,
  // 앱으로 돌아올 때마다 오늘 사용량을 다시 읽어요.
  useEffect(() => {
    function refreshUsage() {
      if (document.visibilityState !== 'visible') return
      setScanCount(getScanCount())
      // 안내 시간이 지났으면 다시 스캔할 수 있게 풀어줘요.
      setScanStatus((prev) => (prev === 'paused' && !isServicePaused() ? 'idle' : prev))
    }
    document.addEventListener('visibilitychange', refreshUsage)
    window.addEventListener('focus', refreshUsage)
    return () => {
      document.removeEventListener('visibilitychange', refreshUsage)
      window.removeEventListener('focus', refreshUsage)
    }
  }, [])

  // 화면 언어에 맞춰 <html lang>을 바꿔요. 안 바꾸면 중국어·일본어 한자가 한국식 글자 모양으로
  // 보일 수 있고, 브라우저가 태국어·영어 화면을 보고 "한국어 페이지를 번역할까요?"라고 물어볼 수 있어요.
  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  function handleCloseHomePrompt() {
    setShowHomePrompt(false)
    markHomePromptSeen()
  }

  const remaining = Math.max(FREE_SCAN_LIMIT - scanCount, 0)
  const isPaywalled = !premium && remaining <= 0
  // 결과 카드가 떠 있을 때는 헤더/언어탭을 숨기고 결과 + 하단 탭바만 꽉 채워서 보여줘요.
  const isResultView = activeTab === 'scan' && scanStatus === 'done' && result && !isPaywalled

  async function handleFileSelected(file) {
    // 화면에 떠 있는 값이 오래됐을 수 있어서 시작할 때 오늘 사용량을 다시 확인해요.
    const freshCount = getScanCount()
    if (freshCount !== scanCount) setScanCount(freshCount)
    if (!premium && FREE_SCAN_LIMIT - freshCount <= 0) return
    // 방금 서버가 "잠시 쉬는 중"이라고 했다면 같은 요청을 또 보내지 않고 안내 화면을 보여줘요.
    if (isServicePaused()) {
      setScanStatus('paused')
      return
    }

    const thisScanId = ++scanIdRef.current
    setScanStatus('loading')
    setErrorMessage(null)
    setReviewStatus('idle')

    try {
      const { base64, mediaType } = await resizeAndEncode(file)

      // 1단계: 빠른 식별 (웹 검색 없음) — 여기까지만 와도 바로 화면에 보여줘요
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mediaType, language }),
      })

      if (!response.ok) {
        // 서버가 "한도·키 문제로 멈춤"(service_paused)인지 "잠깐 바쁨"(busy)인지 알려줘요.
        const info = await response.json().catch(() => null)
        if (scanIdRef.current !== thisScanId) return
        if (info?.code === 'service_paused') {
          markServicePaused()
          setScanStatus('paused')
          return
        }
        if (info?.code === 'busy') {
          setErrorMessage(t.scanBusy)
          setScanStatus('error')
          return
        }
        throw new Error('scan-api-failed')
      }

      const data = await response.json()
      if (scanIdRef.current !== thisScanId) return // 그 사이 새 스캔이 시작됐으면 무시

      if (data.unreadable) {
        // 사진 자체가 안 읽혀서 결과를 못 준 거라 무료 횟수를 깎지 않아요.
        // 사용자 잘못이 아닌데 차감되면 "찍을 때마다 손해"라는 느낌을 줘서 초반 이탈로 이어져요.
        setScanStatus('unreadable')
        return
      }

      // 무료 스캔은 실제로 결과를 받았을 때만 차감해요.
      const nextCount = incrementScanCount()
      setScanCount(nextCount)

      setResult(data)
      setLastProduct(data)
      setIsFallback(false)
      setScanStatus('done')

      // 실제 후기 검색은 자동으로 하지 않아요. 비용의 대부분이 여기서 나가서,
      // 사용자가 "실제 후기 찾아보기"를 눌렀을 때만 찾아요 (handleRequestReviews).
    } catch (err) {
      // 예전에는 실패하면 항상 똑같은 데모 상품(mockData.js)을 진짜 결과인 척 보여줬어요.
      // 그러면 사용자는 자기가 스캔한 것과 전혀 다른 상품이 나와도 그게 실제 분석 결과인 줄
      // 알게 되고, 실패가 반복되면(예: 일시적 서버 오류) 매번 같은 가짜 결과만 보게 돼요 —
      // 신뢰를 잃기 딱 좋은 상황이라 제거했어요. 이제는 정직하게 "실패했어요, 다시 시도해주세요"
      // 오류 화면을 보여주고 바로 재시도할 수 있게 해요. 이때도 무료 횟수는 안 깎여요.
      console.warn('AI 분석 실패:', err)
      if (scanIdRef.current !== thisScanId) return
      setScanStatus('error')
      setErrorMessage(null) // PhotoScanCard가 언어별 기본 문구(scanErrorDefault)를 보여줘요
    }
  }

  function applyReviewData(reviewData) {
    if (reviewData.hasRealReviews && reviewData.highlights?.length > 0) {
      setResult((prev) =>
        prev ? { ...prev, hasRealReviews: true, highlights: reviewData.highlights } : prev
      )
      setLastProduct((prev) =>
        prev ? { ...prev, hasRealReviews: true, highlights: reviewData.highlights } : prev
      )
    }
  }

  async function fetchReviews(productData, scanId) {
    const cacheKey = `${productData.productName}|${language}`
    const cached = reviewCacheRef.current.get(cacheKey)
    if (cached) {
      applyReviewData(cached)
      setReviewStatus('done')
      return
    }

    setReviewStatus('loading')
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productData.productName,
          category: productData.category,
          language,
        }),
      })
      if (!response.ok) {
        const info = await response.json().catch(() => null)
        if (scanIdRef.current !== scanId) return
        if (info?.code === 'service_paused') {
          markServicePaused()
          setReviewStatus('unavailable') // 후기 검색이 쉬는 중이라는 안내만 보여줘요
          return
        }
        throw new Error('reviews-api-failed')
      }

      const reviewData = await response.json()
      if (scanIdRef.current !== scanId) return // 그 사이 새 스캔이 시작됐으면 결과 버림

      reviewCacheRef.current.set(cacheKey, reviewData)
      setReviewStatus('done')
      applyReviewData(reviewData)
    } catch (err) {
      console.warn('후기 검색 실패, 기존 추정 요약 유지:', err)
      if (scanIdRef.current !== scanId) return
      setReviewStatus('idle') // 실패했으면 다시 누를 수 있게 버튼 상태로 되돌려요
    }
  }

  // "실제 후기 찾아보기" 버튼 — 검색 중이거나 이미 끝났으면 다시 안 나가요 (실패했을 때만 다시 시도 가능).
  function handleRequestReviews() {
    if (reviewStatus !== 'idle' || !result || scanStatus !== 'done') return
    fetchReviews(result, scanIdRef.current)
  }

  function handleReset() {
    setScanStatus(isServicePaused() ? 'paused' : 'idle')
    setResult(null)
    setReviewStatus('idle')
  }

  function handleResetPremium() {
    setPremium(false)
    setPremiumState(false)
  }

  return (
    <div className="app-shell">
      <div className="phone-frame" style={{ '--font-display': DISPLAY_FONT_BY_LANG[language] }}>
        {!isResultView && (
          <>
            <Header t={t} remaining={remaining} isPremium={premium} />
            <LanguageTabs language={language} onChange={setLanguage} />
          </>
        )}

        <main className="main-scroll">
          {showInAppWarning && <InAppBrowserBanner t={t} />}

          <div key={`${activeTab}-${scanStatus}`} className="view-fade">
            {activeTab === 'scan' &&
              (scanStatus === 'paused' ? (
                <ServicePausedCard t={t} onGoCurrency={() => setActiveTab('currency')} />
              ) : isPaywalled && scanStatus !== 'done' ? (
                <PaywallCard t={t} onGoCurrency={() => setActiveTab('currency')} />
              ) : scanStatus === 'unreadable' ? (
                <UnreadableCard t={t} onRetake={handleReset} />
              ) : scanStatus === 'done' && result ? (
                <SummaryReceipt
                  t={t}
                  result={result}
                  onReset={handleReset}
                  isFallback={isFallback}
                  reviewStatus={reviewStatus}
                  onRequestReviews={handleRequestReviews}
                />
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
          </div>
        </main>

        <BottomNav t={t} active={activeTab} onChange={setActiveTab} />
      </div>

      {showHomePrompt && <AddToHomeModal t={t} onClose={handleCloseHomePrompt} />}
    </div>
  )
}
