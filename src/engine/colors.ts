import * as THREE from 'three'
import type { ParticleState } from './types'
import { getLogoTags, getLogoCachedColors } from './states/logo'

// Official Nevula brand colors — Manuel Valdez guidelines v#3.
//   azul   #00529C  ·  naranja #FF6600  ·  negro #000000
export const COBALT       = new THREE.Color('#1a5fb4')  // mid brand-blue
export const COBALT_DEEP  = new THREE.Color('#00529c')  // official azul
export const ORANGE       = new THREE.Color('#ff6600')  // official naranja
export const ORANGE_SOFT  = new THREE.Color('#ffa566')
// "WHITE" is the highlight tier in the palette. On the matte-silver page it
// needs to read as a dark accent (ink slate), not a bright off-white —
// otherwise NormalBlending disappears it into the surface.
export const WHITE        = new THREE.Color('#1a2240')

/**
 * Per-state color generator. Reads `_logoTags` (per-particle region tags)
 * from states/logo when state === 'logo'.
 */
export function colorize(count: number, state: ParticleState): Float32Array {
  // GLB-sampled logo writes direct material colors per particle — bypass the
  // random palette entirely so the brand mesh reads with its baked colors.
  if (state === 'logo') {
    const direct = getLogoCachedColors()
    if (direct && direct.length === count * 3) return direct.slice()
  }
  const c = new Float32Array(count * 3)
  const tags = state === 'logo' ? getLogoTags() : null
  for (let i = 0; i < count; i++) {
    let col: THREE.Color
    const r = Math.random()
    if (state === 'logo') {
      const tag = tags ? tags[i] : 0
      if (tag === 0) {
        // V interior — predominantly orange, sparse white highlights.
        col = r < 0.06 ? WHITE : (r < 0.92 ? ORANGE : ORANGE_SOFT)
      } else if (tag === 1) {
        // Upper blue arch.
        col = r < 0.06 ? WHITE : (r < 0.78 ? COBALT_DEEP : COBALT)
      } else {
        // Orange wings sweeping out.
        col = r < 0.10 ? ORANGE_SOFT : (r < 0.96 ? ORANGE : WHITE)
      }
    } else if (state === 'city') {
      col = r < 0.05 ? ORANGE : (r < 0.08 ? WHITE : (r < 0.7 ? COBALT_DEEP : COBALT))
    } else if (state === 'building') {
      col = r < 0.09 ? ORANGE : (r < 0.14 ? WHITE : (r < 0.65 ? COBALT_DEEP : COBALT))
    } else if (state === 'home') {
      col = r < 0.07 ? ORANGE : (r < 0.12 ? ORANGE_SOFT : (r < 0.7 ? COBALT_DEEP : COBALT))
    } else if (state === 'device') {
      col = r < 0.16 ? ORANGE : (r < 0.22 ? WHITE : (r < 0.65 ? COBALT : COBALT_DEEP))
    } else if (state === 'trails') {
      col = r < 0.78 ? COBALT : (r < 0.95 ? ORANGE : WHITE)
    } else if (state === 'flow') {
      col = r < 0.7 ? COBALT : (r < 0.92 ? COBALT_DEEP : ORANGE)
    } else if (state === 'constellation') {
      col = r < 0.86 ? COBALT : (r < 0.98 ? WHITE : ORANGE)
    } else {
      // nebula
      col = r < 0.7 ? COBALT_DEEP : (r < 0.92 ? COBALT : ORANGE)
    }
    c[i * 3]     = col.r
    c[i * 3 + 1] = col.g
    c[i * 3 + 2] = col.b
  }
  return c
}
