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

// Order accents are auto-assigned to new courses (indices into a variant's 10):
// red, peach, yellow, green, teal, blue, mauve, maroon, sky, pink.
const DEFAULT_INDICES = [0, 2, 3, 4, 5, 7, 8, 1, 6, 9];

const LATTE_SET = new Set(LATTE.map((c) => c.toLowerCase()));
const MOCHA_SET = new Set(MOCHA.map((c) => c.toLowerCase()));

/**
 * Default colour for the Nth-added course. The primary variant contrasts the
 * site theme so blocks stand out: dark theme → Latte (dark accents), light
 * theme → Mocha (light accents). The first 10 use that variant in spectrum
 * order, the next 10 the other variant in the same order, then it cycles.
 */
export function defaultCourseColor(index: number, dark: boolean): string {
  const primary = dark ? LATTE : MOCHA;
  const other = dark ? MOCHA : LATTE;
  const seq = [
    ...DEFAULT_INDICES.map((i) => primary[i]),
    ...DEFAULT_INDICES.map((i) => other[i]),
  ];
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
