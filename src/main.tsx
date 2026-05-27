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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <AuthProvider>
      <React.StrictMode>
        <App />
      </React.StrictMode>
    </AuthProvider>
  </LanguageProvider>
);
