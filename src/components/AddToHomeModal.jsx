import { useState } from 'react'

// 처음 접속했을 때 딱 한 번만(App.jsx의 localStorage 플래그로 제어) 뜨는
// "홈 화면에 아이콘 추가" 안내 팝업. 기기(안드로이드/아이폰)에 따라
// 메뉴 아이콘 위치와 절차가 달라서 탭으로 나눠서 보여줍니다.
export default function AddToHomeModal({ t, onClose }) {
  const [os, setOs] = useState('android')

  return (
    <div className="policy-overlay" role="dialog" aria-modal="true" aria-label={t.homePromptTitle}>
      <div className="policy-sheet home-prompt-sheet">
        <div className="policy-tabs">
          <button
            className={`policy-tab${os === 'android' ? ' is-active' : ''}`}
            onClick={() => setOs('android')}
          >
            {t.homePromptAndroidTab}
          </button>
          <button
            className={`policy-tab${os === 'ios' ? ' is-active' : ''}`}
            onClick={() => setOs('ios')}
          >
            {t.homePromptIosTab}
          </button>
          <button className="policy-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="policy-body">
          <h2 className="home-prompt-title">{t.homePromptTitle}</h2>
          <p className="home-prompt-desc">{t.homePromptBody}</p>

          <ol className="home-prompt-steps">
            <li>{os === 'android' ? t.homePromptAndroidStep1 : t.homePromptIosStep1}</li>
            <li>{os === 'android' ? t.homePromptAndroidStep2 : t.homePromptIosStep2}</li>
            <li>{os === 'android' ? t.homePromptAndroidStep3 : t.homePromptIosStep3}</li>
          </ol>

          <button className="home-prompt-confirm" onClick={onClose}>
            {t.homePromptClose}
          </button>
        </div>
      </div>
    </div>
  )
}
