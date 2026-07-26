import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { initializeDataPreloading } from './utils/preloader'

// 當 JS chunk 載入失敗（舊部署被新部署取代）時自動重新整理頁面
// 避免因快取的舊 index.html 指向已不存在的 chunk 而顯示黑屏
window.addEventListener('vite:preloadError', () => {
  window.location.reload();
});

// 🚀 啟動數據預載入系統，提供超快首次載入體驗
initializeDataPreloading();

// scripts/generate-seo.mjs 會把純文字的 SEO 預渲染內容寫進 #root（給爬蟲讀原始 HTML）。
// React 要等首次 commit 才會清掉它，因此在掛載前先自行移除，順便清掉它注入的 <style>。
const rootElement = document.getElementById('root')!;
if (rootElement.firstChild) rootElement.replaceChildren();

ReactDOM.createRoot(rootElement).render(
  <LanguageProvider>
    <AuthProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </AuthProvider>
  </LanguageProvider>
);
