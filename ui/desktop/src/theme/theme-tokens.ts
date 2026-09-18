/**
 * Theme tokens — the single source of truth for all MCP semantic token values.
 *
 * Every key in McpUiStyleVariableKey must be present in both lightTokens and
 * darkTokens. The TypeScript compiler enforces this: if the SDK adds a new key,
 * the build breaks until both maps are updated.
 *
 * Values are applied to :root via style.setProperty() before first paint
 * (see renderer.tsx). main.css only registers the variable names for Tailwind
 * class generation — it does NOT define values.
 *
 * These tokens serve two purposes:
 *  1. Goose desktop — applied to :root per resolved theme.
 *  2. MCP apps — encoded as light-dark() in hostContext.styles.variables.
 */
import type {
  McpUiHostStyles,
  McpUiStyleVariableKey,
  McpUiStyles,
} from '@modelcontextprotocol/ext-apps/app-bridge';

type ThemeTokens = Record<McpUiStyleVariableKey, string>;

// Subset of keys that are the same across both themes.
type BaseTokenKey = Extract<
  McpUiStyleVariableKey,
  `--font-${string}` | `--border-radius-${string}` | `--border-width-${string}`
>;

type ColorTokenKey = Exclude<McpUiStyleVariableKey, BaseTokenKey>;

// ---------------------------------------------------------------------------
// Base tokens — shared across light and dark themes
// ---------------------------------------------------------------------------
const baseTokens: Pick<ThemeTokens, BaseTokenKey> = {
  // Typography — families (Loukri AI CoWork: Inter + JetBrains Mono)
  '--font-sans': "'Inter Variable', 'Inter', system-ui, sans-serif",
  '--font-mono': "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",

  // Typography — weights
  '--font-weight-normal': '400',
  '--font-weight-medium': '500',
  '--font-weight-semibold': '600',
  '--font-weight-bold': '700',

  // Typography — text sizes
  '--font-text-xs-size': '0.75rem',
  '--font-text-sm-size': '0.875rem',
  '--font-text-md-size': '1rem',
  '--font-text-lg-size': '1.125rem',

  // Typography — heading sizes
  '--font-heading-xs-size': '1rem',
  '--font-heading-sm-size': '1.125rem',
  '--font-heading-md-size': '1.25rem',
  '--font-heading-lg-size': '1.5rem',
  '--font-heading-xl-size': '1.875rem',
  '--font-heading-2xl-size': '2.25rem',
  '--font-heading-3xl-size': '3rem',

  // Typography — text line heights
  '--font-text-xs-line-height': '1rem',
  '--font-text-sm-line-height': '1.25rem',
  '--font-text-md-line-height': '1.5rem',
  '--font-text-lg-line-height': '1.75rem',

  // Typography — heading line heights
  '--font-heading-xs-line-height': '1.5rem',
  '--font-heading-sm-line-height': '1.75rem',
  '--font-heading-md-line-height': '1.75rem',
  '--font-heading-lg-line-height': '2rem',
  '--font-heading-xl-line-height': '2.25rem',
  '--font-heading-2xl-line-height': '2.5rem',
  '--font-heading-3xl-line-height': '3.5rem',

  // Border radius
  '--border-radius-xs': '2px',
  '--border-radius-sm': '4px',
  '--border-radius-md': '8px',
  '--border-radius-lg': '12px',
  '--border-radius-xl': '16px',
  '--border-radius-full': '9999px',

  // Border width
  '--border-width-regular': '1px',
};

// Theme-specific color/shadow tokens only.
type ColorTokens = Pick<ThemeTokens, ColorTokenKey>;

// ---------------------------------------------------------------------------
// Light theme — colors & shadows
// Jarvis light: cream surfaces, ink text, TokenKey apricot accent (#f0a06f)
// ---------------------------------------------------------------------------
const lightColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#fcf6e6',
  '--color-background-secondary': '#f6eedb',
  '--color-background-tertiary': '#efe4c8',
  '--color-background-inverse': '#0f172c',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#f0a06f',
  '--color-background-danger': '#f94b4b',
  '--color-background-success': '#91cb80',
  '--color-background-warning': '#fbcd44',
  '--color-background-disabled': '#efe4c8',

  // Text
  '--color-text-primary': '#0f172c',
  '--color-text-secondary': '#5b6472',
  '--color-text-tertiary': '#98a1ad',
  '--color-text-inverse': '#fcf6e6',
  '--color-text-ghost': '#5b6472',
  '--color-text-info': '#c96f3b',
  '--color-text-danger': '#d93b3b',
  '--color-text-success': '#4e7d3c',
  '--color-text-warning': '#8a6d0b',
  '--color-text-disabled': '#c2c4bd',

  // Borders
  '--color-border-primary': '#ece1c6',
  '--color-border-secondary': '#e2d5b4',
  '--color-border-tertiary': '#d5c7a4',
  '--color-border-inverse': '#0f172c',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#f0a06f',
  '--color-border-danger': '#f94b4b',
  '--color-border-success': '#91cb80',
  '--color-border-warning': '#fbcd44',
  '--color-border-disabled': '#ece1c6',

  // Rings
  '--color-ring-primary': '#e2d5b4',
  '--color-ring-secondary': '#d5c7a4',
  '--color-ring-inverse': '#fcf6e6',
  '--color-ring-info': '#f0a06f',
  '--color-ring-danger': '#f94b4b',
  '--color-ring-success': '#91cb80',
  '--color-ring-warning': '#fbcd44',

  // Shadows
  '--shadow-hairline': '0 0 0 1px rgba(15, 23, 44, 0.06)',
  '--shadow-sm': '0 1px 2px 0 rgba(15, 23, 44, 0.06)',
  '--shadow-md': '0 4px 6px -1px rgba(15, 23, 44, 0.1), 0 2px 4px -2px rgba(15, 23, 44, 0.1)',
  '--shadow-lg': '0 10px 15px -3px rgba(15, 23, 44, 0.1), 0 4px 6px -4px rgba(15, 23, 44, 0.1)',
};

// ---------------------------------------------------------------------------
// Dark theme — colors & shadows
// Jarvis night: ink surfaces, warm cream text, apricot accent
// ---------------------------------------------------------------------------
const darkColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#0f172c',
  '--color-background-secondary': '#16203a',
  '--color-background-tertiary': '#1d2a4a',
  '--color-background-inverse': '#fcf6e6',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#f0a06f',
  '--color-background-danger': '#ff6b6b',
  '--color-background-success': '#a3d795',
  '--color-background-warning': '#ffd966',
  '--color-background-disabled': '#1d2a4a',

  // Text
  '--color-text-primary': '#f3ead6',
  '--color-text-secondary': '#9aa4b8',
  '--color-text-tertiary': '#5d6880',
  '--color-text-inverse': '#0f172c',
  '--color-text-ghost': '#9aa4b8',
  '--color-text-info': '#f0a06f',
  '--color-text-danger': '#ff6b6b',
  '--color-text-success': '#a3d795',
  '--color-text-warning': '#ffd966',
  '--color-text-disabled': '#3a4768',

  // Borders
  '--color-border-primary': '#24304e',
  '--color-border-secondary': '#2d3a5c',
  '--color-border-tertiary': '#3a4768',
  '--color-border-inverse': '#fcf6e6',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#f0a06f',
  '--color-border-danger': '#ff6b6b',
  '--color-border-success': '#a3d795',
  '--color-border-warning': '#ffd966',
  '--color-border-disabled': '#24304e',

  // Rings
  '--color-ring-primary': '#2d3a5c',
  '--color-ring-secondary': '#3a4768',
  '--color-ring-inverse': '#0f172c',
  '--color-ring-info': '#f0a06f',
  '--color-ring-danger': '#ff6b6b',
  '--color-ring-success': '#a3d795',
  '--color-ring-warning': '#ffd966',

  // Shadows (darker for dark mode)
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.25)',
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
  '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.35), 0 2px 4px -2px rgba(0, 0, 0, 0.25)',
  '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -4px rgba(0, 0, 0, 0.25)',
};

// ---------------------------------------------------------------------------
// Aura theme — colors & shadows (dark variant)
// Ported from OpenChamber's Aura preset: purple-black surfaces, purple accent,
// mint/peach/cyan/coral status colors, monospace typography.
// ---------------------------------------------------------------------------
const auraColorTokens: ColorTokens = {
  // Backgrounds
  '--color-background-primary': '#15141b',
  '--color-background-secondary': '#1a1921',
  '--color-background-tertiary': '#201e2b',
  '--color-background-inverse': '#a277ff',
  '--color-background-ghost': 'transparent',
  '--color-background-info': '#82e2ff',
  '--color-background-danger': '#ff6767',
  '--color-background-success': '#61ffca',
  '--color-background-warning': '#ffca85',
  '--color-background-disabled': '#25232f',

  // Text
  '--color-text-primary': '#edecee',
  '--color-text-secondary': '#8a8282',
  '--color-text-tertiary': '#6d6d6d',
  '--color-text-inverse': '#15141b',
  '--color-text-ghost': '#8a8282',
  '--color-text-info': '#82e2ff',
  '--color-text-danger': '#ff6767',
  '--color-text-success': '#61ffca',
  '--color-text-warning': '#ffca85',
  '--color-text-disabled': '#525b68',

  // Borders
  '--color-border-primary': '#2d2b38',
  '--color-border-secondary': '#47415a',
  '--color-border-tertiary': '#4e496c',
  '--color-border-inverse': '#edecee',
  '--color-border-ghost': 'transparent',
  '--color-border-info': '#82e2ff',
  '--color-border-danger': '#ff6767',
  '--color-border-success': '#61ffca',
  '--color-border-warning': '#ffca85',
  '--color-border-disabled': '#2d2b38',

  // Rings
  '--color-ring-primary': '#47415a',
  '--color-ring-secondary': '#2d2b38',
  '--color-ring-inverse': '#15141b',
  '--color-ring-info': '#82e2ff',
  '--color-ring-danger': '#ff6767',
  '--color-ring-success': '#61ffca',
  '--color-ring-warning': '#ffca85',

  // Shadows (dark)
  '--shadow-hairline': '0 0 0 1px rgba(0, 0, 0, 0.2)',
  '--shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.2)',
  '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.2)',
};

// Aura is monospace-first — override the shared sans family.
const auraFontTokens: Partial<Pick<ThemeTokens, BaseTokenKey>> = {
  '--font-sans': 'ui-monospace, "SFMono-Regular", "Menlo", "Cascadia Mono", "Segoe UI Mono", monospace',
  '--font-mono': 'ui-monospace, "SFMono-Regular", "Menlo", "Cascadia Mono", "Segoe UI Mono", monospace',
};

// ---------------------------------------------------------------------------
// Merged token maps — used by applyThemeTokens() and buildMcpHostStyles()
// ---------------------------------------------------------------------------
export const lightTokens: ThemeTokens = { ...baseTokens, ...lightColorTokens };
export const darkTokens: ThemeTokens = { ...baseTokens, ...darkColorTokens };
export const auraTokens: ThemeTokens = { ...baseTokens, ...auraFontTokens, ...auraColorTokens };

// ---------------------------------------------------------------------------
// Theme registry — the set of selectable named themes.
// `variant` drives the .dark/.light class and colorScheme for anything outside
// the token system; `tokens` is the map applied to :root. Adding a future theme
// is a single entry here plus its token map above.
// ---------------------------------------------------------------------------
export type ThemeId = 'light' | 'dark' | 'aura';
export type ThemeVariant = 'light' | 'dark';

interface ThemeDefinition {
  variant: ThemeVariant;
  tokens: ThemeTokens;
}

export const themes: Record<ThemeId, ThemeDefinition> = {
  light: { variant: 'light', tokens: lightTokens },
  dark: { variant: 'dark', tokens: darkTokens },
  aura: { variant: 'dark', tokens: auraTokens },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// @font-face rules passed to MCP apps so sandboxed iframes can load host fonts.
// Inter is bundled with the app; iframes resolve it via a locally installed copy
// when available and fall back to their own sans-serif otherwise.
const HOST_FONT_CSS = `
@font-face {
  font-family: 'Inter Variable';
  src: local('Inter Variable'), local('Inter');
  font-weight: 100 900;
  font-style: normal;
}
@font-face {
  font-family: 'JetBrains Mono Variable';
  src: local('JetBrains Mono Variable'), local('JetBrains Mono');
  font-weight: 100 800;
  font-style: normal;
}
`.trim();

/**
 * Build the McpUiHostStyles object for MCP apps.
 *
 * For the built-in light/dark pair, color keys use light-dark() so a single
 * payload resolves correctly against the guest's color-scheme. Custom themes
 * (e.g. aura) share a variant with dark but carry their own palette and fonts,
 * so light-dark() can't express them — emit that theme's concrete token values
 * instead. Non-color keys always use the theme's own values so overrides like
 * Aura's monospace font family reach the guest.
 * css.fonts provides @font-face rules so sandboxed apps can load host fonts.
 */
export function buildMcpHostStyles(themeId: ThemeId = 'light'): McpUiHostStyles {
  const tokens = (themes[themeId] ?? themes.light).tokens;
  const isBuiltinVariant = themeId === 'light' || themeId === 'dark';
  const variables: McpUiStyles = {} as McpUiStyles;
  for (const key of Object.keys(lightTokens) as McpUiStyleVariableKey[]) {
    if (key.startsWith('--color-') && isBuiltinVariant) {
      variables[key] = `light-dark(${lightTokens[key]}, ${darkTokens[key]})`;
    } else {
      variables[key] = tokens[key];
    }
  }
  return { variables, css: { fonts: HOST_FONT_CSS } };
}

/**
 * Resolve the current theme id from localStorage / system preference.
 * Best-effort pre-paint resolution; the authoritative preference lives in the
 * Electron settings store and is applied by ThemeContext once loaded.
 */
export function getResolvedTheme(): ThemeId {
  const useSystem = localStorage.getItem('use_system_theme') !== 'false';
  if (useSystem) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  const stored = localStorage.getItem('theme');
  if (stored === 'aura') return 'aura';
  return stored === 'dark' ? 'dark' : 'light';
}

/**
 * Apply a theme's tokens to the document root as CSS custom properties.
 * When called without an argument, resolves the theme from localStorage.
 */
export function applyThemeTokens(theme?: ThemeId): void {
  const resolved = theme ?? getResolvedTheme();
  const { tokens } = themes[resolved] ?? themes.light;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}
