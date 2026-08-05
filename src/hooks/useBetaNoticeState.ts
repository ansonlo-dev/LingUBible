import { useSyncExternalStore } from 'react';

// Shared state for the WIP / beta notice so the banner (rendered at the top of
// the layout) and the restore capsule in the footer stay in sync.
//  - 'expanded'  : full banner with the detail message
//  - 'collapsed' : single-line banner (header only)
//  - 'hidden'    : banner removed; a capsule in the footer brings it back
export type BetaNoticeState = 'expanded' | 'collapsed' | 'hidden';

// v2：預設改為 'hidden'（新舊訪客都不再預設顯示 banner）。改用新 key，
// 舊 key 儲存的 'expanded'/'collapsed' 一律忽略——只有在本次改版後透過
// footer 膠囊主動打開的用戶（寫入 v2 key）才會再看到 banner。
const STATE_KEY = 'betaNoticeStateV2';
const CHANGE_EVENT = 'beta-notice-state-change';

export const readBetaNoticeState = (): BetaNoticeState => {
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (stored === 'expanded' || stored === 'collapsed' || stored === 'hidden') {
      return stored;
    }
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
  return 'hidden';
};

export const setBetaNoticeState = (next: BetaNoticeState) => {
  try {
    localStorage.setItem(STATE_KEY, next);
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
  // Notify listeners in this tab (the native 'storage' event only fires in
  // other tabs).
  window.dispatchEvent(new Event(CHANGE_EVENT));
};

const subscribe = (callback: () => void) => {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
};

export const useBetaNoticeState = (): BetaNoticeState =>
  useSyncExternalStore(subscribe, readBetaNoticeState, () => 'hidden');
