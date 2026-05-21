import type { SlotInternal } from '../types'

/**
 * Apply the per-state position drift to slot.geo's position attribute.
 * Reads the (post-morph) `targetPos` and writes wiggle-around values into
 * the attribute array. Caller must set `needsUpdate = true` after.
 */
export function applyStateBehavior(slot: SlotInternal, t: number): void {
  const pos = slot.geo.getAttribute('position').array as Float32Array
  const target = slot.targetPos
  const count = slot.count
  const state = slot.state

  if (state === 'flow') {
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      pos[ix] += 0.004
      pos[ix + 1] = target[ix + 1] + Math.sin(t * 0.6 + target[ix] * 1.8) * 0.04
      pos[ix + 2] = target[ix + 2] + Math.cos(t * 0.5 + target[ix] * 1.2) * 0.02
      if (pos[ix] > 1.3) pos[ix] = -1.3
    }
  } else if (state === 'trails') {
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const x = pos[ix], y = pos[ix + 1]
      const rr = Math.hypot(x, y)
      if (rr < 0.05) {
        const a = Math.atan2(y, x) + (Math.random() - 0.5) * 0.05
        const newR = 1.2 + Math.random() * 0.3
        pos[ix]     = Math.cos(a) * newR
        pos[ix + 1] = Math.sin(a) * newR
        pos[ix + 2] = (Math.random() - 0.5) * 0.2
      } else {
        pos[ix]     -= (x / rr) * 0.006
        pos[ix + 1] -= (y / rr) * 0.006
      }
    }
  } else if (state === 'logo') {
    // Logo is the brand mark. Drift is intentionally slow + low-frequency
    // (cycles every 12–25 seconds) and uses a coherent per-particle phase
    // offset (`i * 0.05`) so neighboring particles move in similar
    // directions — the effect reads as breathing waves through the mark
    // rather than chaotic noise. Amplitude stays small (0.005) so the V/arch
    // silhouette doesn't soften.
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      pos[ix]     = target[ix]     + Math.sin(t * 0.28 + i * 0.05) * 0.005
      pos[ix + 1] = target[ix + 1] + Math.cos(t * 0.36 + i * 0.05) * 0.005
      pos[ix + 2] = target[ix + 2] + Math.sin(t * 0.22 + i * 0.03) * 0.003
    }
  } else if (state === 'city' || state === 'building' || state === 'home' || state === 'device') {
    const amp = 0.004
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      pos[ix]     = target[ix]     + Math.sin(t * 0.7 + i * 0.13) * amp
      pos[ix + 1] = target[ix + 1] + Math.cos(t * 0.6 + i * 0.11) * amp
      pos[ix + 2] = target[ix + 2] + Math.sin(t * 0.5 + i * 0.09) * (amp * 0.7)
    }
  } else if (state === 'nebula') {
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      pos[ix]     = target[ix]     + Math.sin(t * 0.18 + i * 0.04) * 0.015
      pos[ix + 1] = target[ix + 1] + Math.cos(t * 0.22 + i * 0.05) * 0.012
      pos[ix + 2] = target[ix + 2] + Math.sin(t * 0.16 + i * 0.03) * 0.01
    }
  } else {
    // constellation — gentle vibration
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      pos[ix]     = target[ix]     + Math.sin(t * 0.5 + i * 0.1) * 0.006
      pos[ix + 1] = target[ix + 1] + Math.cos(t * 0.4 + i * 0.12) * 0.006
      pos[ix + 2] = target[ix + 2] + Math.sin(t * 0.3 + i * 0.08) * 0.004
    }
  }
}
