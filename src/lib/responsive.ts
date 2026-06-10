/**
 * Mobile / capability detection — single source of truth for the JS side.
 *
 * Mirrors the CSS breakpoint used across the stylesheets (the cinematic stage
 * flips to stacked flow at `≤820px` in layout.css). Keeping the same query here
 * means the engine/boot logic always agrees with what the CSS is doing.
 */

/** The breakpoint below which the site runs its lightweight stacked mobile mode. */
export const MOBILE_MQ = '(max-width: 820px)'

/**
 * True when the viewport is at or below the mobile breakpoint. Evaluated live
 * (not cached) so it reflects the current viewport — callers that only branch
 * once at boot get a stable value, and the few that re-check on resize get a
 * fresh answer.
 */
export function isMobile(): boolean {
  return window.matchMedia(MOBILE_MQ).matches
}

/** True when the user has asked the OS to minimize non-essential motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
