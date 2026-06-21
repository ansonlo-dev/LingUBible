/**
 * Catppuccin palette (https://catppuccin.com/palette) used for course colours.
 * Two variants — Latte (dark, saturated accents) and Mocha (light, pastel
 * accents) — each with the same 10 rainbow colours in spectrum order:
 * red, maroon, peach, yellow, green, teal, sky, blue, mauve, pink.
 */
export const CATPPUCCIN_PALETTE: { variant: string; colors: string[] }[] = [
  {
    variant: 'Latte',
    colors: ['#d20f39', '#e64553', '#fe640b', '#df8e1d', '#40a02b', '#179299', '#04a5e5', '#1e66f5', '#8839ef', '#ea76cb'],
  },
  {
    variant: 'Mocha',
    colors: ['#f38ba8', '#eba0ac', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5', '#89dceb', '#89b4fa', '#cba6f7', '#f5c2e7'],
  },
];

const LATTE = CATPPUCCIN_PALETTE[0].colors;
const MOCHA = CATPPUCCIN_PALETTE[1].colors;

// Indices of the 7 accents auto-assigned to new courses, in order:
// red, peach, yellow, green, teal, blue, mauve.
const DEFAULT_INDICES = [0, 2, 3, 4, 5, 7, 8];
const LATTE_DEFAULTS = DEFAULT_INDICES.map((i) => LATTE[i]);
const MOCHA_DEFAULTS = DEFAULT_INDICES.map((i) => MOCHA[i]);

const LATTE_SET = new Set(LATTE.map((c) => c.toLowerCase()));
const MOCHA_SET = new Set(MOCHA.map((c) => c.toLowerCase()));

/**
 * Default colour for the Nth-added course. The variant contrasts the site theme
 * so blocks stand out: dark theme → Latte (dark accents), light theme → Mocha
 * (light accents). Cycles through the 7 default accents.
 */
export function defaultCourseColor(index: number, dark: boolean): string {
  const seq = dark ? LATTE_DEFAULTS : MOCHA_DEFAULTS;
  return seq[((index % seq.length) + seq.length) % seq.length];
}

/**
 * Fixed, always-readable text colour for a palette colour, used to override the
 * dynamic (luminance-based) choice: Latte (dark) → white, Mocha (light) → black.
 * Returns null for non-palette (custom) colours so the caller falls back.
 */
export function paletteTextColor(bg: string): '#ffffff' | '#000000' | null {
  const c = (bg || '').toLowerCase();
  if (LATTE_SET.has(c)) return '#ffffff';
  if (MOCHA_SET.has(c)) return '#000000';
  return null;
}
