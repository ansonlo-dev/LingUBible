import { useSyncExternalStore } from 'react';

// Shared state for the WIP / beta notice so the banner (rendered at the top of
// the layout) and the restore capsule in the footer stay in sync.
//  - 'expanded'  : full banner with the detail message
//  - 'collapsed' : single-line banner (header only)
//  - 'hidden'    : banner removed; a capsule in the footer brings it back
export type BetaNoticeState = 'expanded' | 'collapsed' | 'hidden';

const STATE_KEY = 'betaNoticeState';
const LEGACY_EXPANDED_KEY = 'betaNoticeExpanded';
const CHANGE_EVENT = 'beta-notice-state-change';

export const readBetaNoticeState = (): BetaNoticeState => {
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (stored === 'expanded' || stored === 'collapsed' || stored === 'hidden') {
      return stored;
    }
    // Migrate from the old boolean-style key.
    if (localStorage.getItem(LEGACY_EXPANDED_KEY) === 'false') {
      return 'collapsed';
    }
  } catch {
    // Ignore storage errors (e.g. private mode)
  }
  return 'expanded';
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
  useSyncExternalStore(subscribe, readBetaNoticeState, () => 'expanded');
