/**
 * Sizing math shared by the intro cinematic and the mobile field backdrop.
 *
 * Both render particle shapes (the "nevula" wordmark, the V mark, the detonation
 * burst) normalised to a fixed world extent that was tuned for a LANDSCAPE
 * frustum. A three.js PerspectiveCamera's FOV is *vertical*, so on a narrow /
 * portrait viewport the horizontal field of view is much tighter and those wide
 * shapes overflow the sides (the wordmark and the explosion get cropped).
 *
 * We compensate purely from the live viewport aspect:
 *   - `introCamZ()`        pulls the intro camera back so the wordmark/V/burst
 *                          stay framed the same way they are on desktop.
 *   - `cinematicFitScale()` is the matching shrink factor to apply to the engine
 *                          field's V scale so it stays the same on-screen size as
 *                          the intro V through the hand-off crossfade.
 *
 * On wide viewports both are no-ops (camera stays at the landscape base, factor
 * is 1), so desktop is unaffected.
 */

/** Landscape resting camera distance — the original intro/field default. */
const FIT_BASE_Z = 3.4
/** Vertical FOV (deg) — matches the intro camera and the engine slot camera. */
const FOV_DEG = 50
/** Wordmark half-width in world units: WORDMARK_EXTENT (3.0, its widest dim) / 2. */
const WORDMARK_HALF = 1.5
/** Fraction of the viewport WIDTH the wordmark should span (matches the desktop
 *  composition; leaves headroom for the burst to expand toward the edges). */
const WORDMARK_FILL = 0.62

const TAN_HALF_FOV = Math.tan((FOV_DEG * Math.PI / 180) / 2)

/**
 * Camera distance that frames the wordmark at `WORDMARK_FILL` of the viewport
 * width for the current aspect. Never closer than the landscape base, so wide
 * viewports keep the original framing.
 */
export function introCamZ(): number {
  const aspect = window.innerWidth / window.innerHeight
  return Math.max(FIT_BASE_Z, WORDMARK_HALF / (WORDMARK_FILL * TAN_HALF_FOV * aspect))
}

/**
 * ≤1 factor: how much smaller the intro content renders versus its landscape
 * base (`FIT_BASE_Z / introCamZ()`). Multiply the field V's scale by this so the
 * field V matches the intro V at hand-off. Returns 1 on wide viewports.
 */
export function cinematicFitScale(): number {
  return FIT_BASE_Z / introCamZ()
}
