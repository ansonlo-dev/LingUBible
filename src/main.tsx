import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'

// PWA Service Worker 由 VitePWA 插件自動處理
// 在開發模式下減少 Service Worker 相關的日誌輸出
if (import.meta.env.DEV) {
  // 覆蓋 console.warn 來過濾 workbox 相關的警告
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (
      message.includes('workbox') ||
      message.includes('Precaching did not find a match') ||
      message.includes('No route found for')
    ) {
      return; // 忽略這些日誌
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LanguageProvider>
);
