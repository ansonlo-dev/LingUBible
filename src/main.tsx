import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { initializeDataPreloading } from './utils/preloader'

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
