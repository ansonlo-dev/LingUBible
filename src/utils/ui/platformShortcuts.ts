/**
 * Platform-aware keyboard shortcut hints.
 *
 * Mac users expect ⌘/⇧/⌥ symbols with no "+" between them; everyone else
 * expects "Ctrl+Shift+Z". Detection runs once at module load — the OS cannot
 * change mid-session.
 */

/** True when the browser runs on macOS (or an iPad/iPhone with a keyboard). */
export const isMacPlatform = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // navigator.platform is deprecated, so prefer userAgentData where available
  // (Chromium). Both fall back to the UA string.
  const uaPlatform = (navigator as any).userAgentData?.platform;
  if (typeof uaPlatform === 'string' && uaPlatform) {
    return /mac/i.test(uaPlatform);
  }

  // iPadOS 13+ reports "MacIntel", which is what we want here anyway.
  const legacy = navigator.platform || navigator.userAgent || '';
  return /mac|iphone|ipad|ipod/i.test(legacy);
};

export const IS_MAC = isMacPlatform();

/** The modifier label shown on its own, e.g. in a `<kbd>` next to a letter. */
export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';
export const SHIFT_KEY = IS_MAC ? '⇧' : 'Shift';
export const ALT_KEY = IS_MAC ? '⌥' : 'Alt';

/**
 * Build a full shortcut hint for the current platform.
 *
 * `formatShortcut('Z')`               → "⌘Z"        / "Ctrl+Z"
 * `formatShortcut('Z', { shift: true })` → "⇧⌘Z"    / "Ctrl+Shift+Z"
 * `formatShortcut('L', { alt: true, mod: false })` → "⌥L" / "Alt+L"
 */
export const formatShortcut = (
  key: string,
  { mod = true, shift = false, alt = false }: { mod?: boolean; shift?: boolean; alt?: boolean } = {}
): string => {
  if (IS_MAC) {
    // Mac order is fixed by convention: ⌃ ⌥ ⇧ ⌘, then the key, joined tightly.
    return `${alt ? ALT_KEY : ''}${shift ? SHIFT_KEY : ''}${mod ? MOD_KEY : ''}${key}`;
  }
  const parts: string[] = [];
  if (mod) parts.push('Ctrl');
  if (alt) parts.push('Alt');
  if (shift) parts.push('Shift');
  parts.push(key);
  return parts.join('+');
};

/**
 * The sidebar toggle answers to two chords (see the handler in App.tsx), and the
 * hint is shown from three places — keep it here so they cannot drift apart.
 */
export const SIDEBAR_TOGGLE_SHORTCUT = `${formatShortcut('L', { mod: false, alt: true })} / ${formatShortcut('L', { shift: true })}`;
