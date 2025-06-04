import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from './contexts/AuthContext'
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker
let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;
let offlineReady = false;
let needRefresh = false;

if ('serviceWorker' in navigator) {
  updateSW = registerSW({
    onNeedRefresh() {
      needRefresh = true;
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('pwa-need-refresh', { 
        detail: { updateSW, needRefresh: true } 
      }));
    },
    onOfflineReady() {
      offlineReady = true;
      console.log('App ready to work offline');
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('pwa-offline-ready', { 
        detail: { offlineReady: true } 
      }));
    },
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </AuthProvider>
);
