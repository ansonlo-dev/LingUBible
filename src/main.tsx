import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'

// 註冊 Service Worker (PWA 支援)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // 嘗試註冊開發環境的 Service Worker
      const registration = await navigator.serviceWorker.register('/dev-sw.js?dev-sw', { 
        scope: '/',
        type: 'classic'
      });
      console.log('SW registered: ', registration);
      
      // 監聽 Service Worker 更新
      registration.addEventListener('updatefound', () => {
        console.log('SW update found');
      });
      
    } catch (registrationError) {
      console.log('SW registration failed: ', registrationError);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </LanguageProvider>
);
