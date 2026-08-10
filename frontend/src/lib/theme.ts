/**
 * Typed accessors for TechOS design tokens.
 * Prefer Tailwind semantic classes (`bg-brand`, `text-ink`) in components.
 * Use these when you need raw CSS variable strings (charts, inline styles, etc.).
 */
export const tokens = {
  brand: 'var(--brand)',
  brandSoft: 'var(--brand-soft)',
  brandDeep: 'var(--brand-deep)',
  brandMist: 'var(--brand-mist)',
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  border: 'var(--border)',
  text: 'var(--text)',
  textMuted: 'var(--text-muted)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  radiusLg: 'var(--radius-lg)',
  shadowMd: 'var(--shadow-md)',
} as const;

export type TokenName = keyof typeof tokens;
