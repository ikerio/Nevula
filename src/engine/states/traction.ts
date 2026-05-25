import * as THREE from 'three'
import type { StateGenerator } from '../types'

/**
 * Traction state — V2 (spatial + animated).
 *
 * Background reads as the chapter's narrative diagram:
 *
 *   • Four tight clusters anchored behind each partner card (JCI, Honeywell,
 *     Inter-Con, ADT). Each cluster is a small gaussian dot of particles —
 *     these are the "nodes."
 *   • Convergence flow: ~63% of all particles travel along quadratic Bezier
 *     paths from their source cluster down-and-inward to a single convergence
 *     point below the cards. They actually move — t advances each frame.
 *     This is the "momentum."
 *   • Timeline spine: a thin, sparse line of particles drifting left → right
 *     along the chapter's trajectory rail. Reinforces the HTML rail without
 *     competing with it.
 *
 * ADT cluster gets orange accents (more orange-tinted particles); its flow
 * stream picks up the brightest orange dots so the live pilot reads as the
 * strongest source of momentum.
 *
 * Index layout (matters because `buildLines` in slot.ts connects particles
 * by INDEX-adjacency — clustering by index keeps connector lines inside
 * each cluster instead of crossing between them):
 *
 *   [0           .. PER_CLUSTER*1 - 1]  JCI cluster
 *   [PER_CLUSTER .. PER_CLUSTER*2 - 1]  Honeywell
 *   [PER_CLUSTER*2 .. PER_CLUSTER*3 - 1] Inter-Con
 *   [PER_CLUSTER*3 .. PER_CLUSTER*4 - 1] ADT (orange accents)
 *   [PER_CLUSTER*4 .. ... + FLOW - 1]   Convergence flow particles
 *   [... .. count - 1]                  Timeline spine
 *
 * Per-frame animation is driven by `tickTraction()`, called from the slot
 * update loop alongside tickPublicSafety / tickMicroprocessor.
 */

// ---------------------------------------------------------------------------
// Layout constants — world coordinates.
// ---------------------------------------------------------------------------

interface ClusterAnchor {
  cx: number; cy: number; cz: number
  /** Cluster gaussian σ — tight (0.10) so each cluster reads as a discrete
   *  node, not a cloud. Originally 0.22 in V1; user feedback noted the
   *  clouds bled together. */
  sx: number; sy: number; sz: number
}

const CLUSTERS: ClusterAnchor[] = [
  { cx: -1.55, cy: 0.10, cz:  0.00, sx: 0.10, sy: 0.10, sz: 0.05 }, // JCI
  { cx: -0.50, cy: 0.10, cz: -0.04, sx: 0.10, sy: 0.10, sz: 0.05 }, // Honeywell
  { cx:  0.50, cy: 0.10, cz:  0.04, sx: 0.10, sy: 0.10, sz: 0.05 }, // Inter-Con
  { cx:  1.55, cy: 0.10, cz:  0.00, sx: 0.09, sy: 0.09, sz: 0.05 }, // ADT (slightly tighter)
]

const CONVERGENCE = { x: 0.0, y: -0.65, z: 0.0 }

const SPINE_Y = -1.00
const SPINE_X_MIN = -1.60
const SPINE_X_MAX =  1.60
const SPINE_Y_JITTER = 0.025

// Particle role allocation (fractions of total count).
// V2.1: pulled ~10% off flow into clusters — user feedback said flow felt
// dense even with motion working. Solid-looking cluster anchors + a calmer
// flow read better.
const CLUSTER_FRAC = 0.43  // 4 clusters split this evenly → ~10–11% per cluster (~130/cluster at count=1200)
const FLOW_FRAC    = 0.52
// Spine = 1 - CLUSTER_FRAC - FLOW_FRAC → ~5%. Sparse on purpose; the HTML
// trajectory rail is the primary timeline.

// Roles
const ROLE_CLUSTER = 0
const ROLE_FLOW    = 1
const ROLE_SPINE   = 2

// ---------------------------------------------------------------------------
// Per-particle metadata, cached at generation, read by tickTraction.
//
// Sized to the count of the slot the generator was called with. Reset on
// every generation call (state morph).
// ---------------------------------------------------------------------------

let _role:          Int8Array    | null = null
let _clusterIdx:    Int8Array    | null = null
let _localOffset:   Float32Array | null = null  // cluster: gaussian offset from center
let _phase:         Float32Array | null = null  // per-particle phase for breathing

// Flow-particle metadata
let _flowT:         Float32Array | null = null  // current t along Bezier (0..1)
let _flowSpeed:     Float32Array | null = null  // dt-rate of t per second
let _flowJitter:    Float32Array | null = null  // per-particle xyz jitter on the Bezier point

// Spine metadata
let _spineT:        Float32Array | null = null  // current x position along spine (0..1)
let _spineSpeed:    Float32Array | null = null
let _spineY:        Float32Array | null = null  // per-particle y jitter
let _spineZ:        Float32Array | null = null

let _cachedColors:  Float32Array | null = null

export function getTractionCachedColors(): Float32Array | null {
  return _cachedColors
}

// ---------------------------------------------------------------------------
// Box-Muller gaussian sampler.
// ---------------------------------------------------------------------------

function gauss(): number {
  const u1 = Math.random() || 1e-9
  const u2 = Math.random()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

// ---------------------------------------------------------------------------
// Palette.
// ---------------------------------------------------------------------------

const COBALT      = new THREE.Color('#1a5fb4')
const COBALT_DEEP = new THREE.Color('#00529c')
const COBALT_SOFT = new THREE.Color('#5d8fc8')
const COBALT_FAINT = new THREE.Color('#92a8c8')  // de-saturated; for flow/spine so they don't compete with cluster nodes
const ORANGE      = new THREE.Color('#ff6600')
const ORANGE_SOFT = new THREE.Color('#ffa566')
const INK         = new THREE.Color('#1a2240')

// ---------------------------------------------------------------------------
// State generator — fills positions, colors, and the per-particle metadata
// that tickTraction will use each frame.
// ---------------------------------------------------------------------------

export const genTraction: StateGenerator = (count) => {
  const positions = new Float32Array(count * 3)
  const colors    = new Float32Array(count * 3)

  _role        = new Int8Array(count)
  _clusterIdx  = new Int8Array(count)
  _localOffset = new Float32Array(count * 3)
  _phase       = new Float32Array(count)
  _flowT       = new Float32Array(count)
  _flowSpeed   = new Float32Array(count)
  _flowJitter  = new Float32Array(count * 3)
  _spineT      = new Float32Array(count)
  _spineSpeed  = new Float32Array(count)
  _spineY      = new Float32Array(count)
  _spineZ      = new Float32Array(count)

  const clusterTotal = Math.floor(count * CLUSTER_FRAC)
  const perCluster   = Math.floor(clusterTotal / CLUSTERS.length)
  const flowCount    = Math.floor(count * FLOW_FRAC)
  const spineStart   = perCluster * CLUSTERS.length + flowCount
  const spineCount   = count - spineStart

  // -- CLUSTERS ------------------------------------------------------------
  let i = 0
  for (let ci = 0; ci < CLUSTERS.length; ci++) {
    const a = CLUSTERS[ci]
    const isADT = ci === 3
    for (let k = 0; k < perCluster; k++, i++) {
      const ix = i * 3
      _role[i]        = ROLE_CLUSTER
      _clusterIdx[i]  = ci
      _phase[i]       = Math.random() * Math.PI * 2
      // Gaussian offset cached so the breathing animation can wiggle
      // around it rather than redraw a new random position each frame.
      const dx = gauss() * a.sx
      const dy = gauss() * a.sy
      const dz = gauss() * a.sz
      _localOffset[ix]     = dx
      _localOffset[ix + 1] = dy
      _localOffset[ix + 2] = dz
      positions[ix]     = a.cx + dx
      positions[ix + 1] = a.cy + dy
      positions[ix + 2] = a.cz + dz

      // Color — LOI clusters cobalt only; ADT picks up orange accents.
      let col: THREE.Color
      const r = Math.random()
      if (isADT) {
        col = r < 0.08 ? ORANGE
            : r < 0.26 ? ORANGE_SOFT
            : r < 0.30 ? INK
            : r < 0.68 ? COBALT_DEEP
            :            COBALT
      } else {
        col = r < 0.04 ? INK
            : r < 0.06 ? COBALT_SOFT
            : r < 0.68 ? COBALT_DEEP
            :            COBALT
      }
      colors[ix]     = col.r
      colors[ix + 1] = col.g
      colors[ix + 2] = col.b
    }
  }

  // -- CONVERGENCE FLOW ----------------------------------------------------
  // Each flow particle is bound to a source cluster; it carries its own
  // Bezier `t` and per-second speed. The tick function advances t each
  // frame and recomputes the particle's position along the curve.
  for (let k = 0; k < flowCount; k++, i++) {
    const ix = i * 3
    const ci = Math.floor(Math.random() * CLUSTERS.length)
    const isFromADT = ci === 3

    _role[i]         = ROLE_FLOW
    _clusterIdx[i]   = ci
    _phase[i]        = Math.random() * Math.PI * 2
    // Initial t spread evenly with some randomness so particles aren't
    // stacked on top of each other at t=0 — gives an instant filled-path
    // look when the state mounts.
    _flowT[i]        = Math.random()
    // Speed variance — slower particles trail faster ones, giving the
    // path a continuously-replenished look rather than a synchronized
    // wave. Avg ~14s end-to-end.
    _flowSpeed[i]    = 0.04 + Math.random() * 0.07
    // Per-particle perpendicular jitter so the path isn't a hard
    // 1-pixel line.
    _flowJitter[ix]     = (Math.random() - 0.5) * 0.05
    _flowJitter[ix + 1] = (Math.random() - 0.5) * 0.05
    _flowJitter[ix + 2] = (Math.random() - 0.5) * 0.03

    // Initial position computed via the same Bezier formula tickTraction uses.
    const tInit = _flowT[i]
    writeFlowPosition(positions, ix, ci, tInit)

    // Color — flow particles are visually subordinate to clusters (smaller
    // signal, less saturation) — they're the "between" not the "nodes."
    let col: THREE.Color
    const r = Math.random()
    if (isFromADT && r < 0.18) {
      col = r < 0.05 ? ORANGE : ORANGE_SOFT
    } else if (r < 0.30) {
      col = COBALT_FAINT
    } else if (r < 0.75) {
      col = COBALT_SOFT
    } else {
      col = COBALT
    }
    colors[ix]     = col.r
    colors[ix + 1] = col.g
    colors[ix + 2] = col.b
  }

  // -- TIMELINE SPINE ------------------------------------------------------
  // Sparse — the HTML trajectory rail is the primary timeline. Particles
  // here just reinforce the line and drift left → right to imply
  // forward progression.
  for (let k = 0; k < spineCount; k++, i++) {
    const ix = i * 3
    _role[i]      = ROLE_SPINE
    _spineT[i]    = Math.random()  // initial x position along spine, 0..1
    _spineSpeed[i] = 0.025 + Math.random() * 0.035  // very slow drift
    _spineY[i]    = (Math.random() - 0.5) * 2 * SPINE_Y_JITTER
    _spineZ[i]    = (Math.random() - 0.5) * 0.05
    _phase[i]     = Math.random() * Math.PI * 2

    const x = SPINE_X_MIN + _spineT[i] * (SPINE_X_MAX - SPINE_X_MIN)
    positions[ix]     = x
    positions[ix + 1] = SPINE_Y + _spineY[i]
    positions[ix + 2] = _spineZ[i]

    // Color — faint cobalt with orange ramp on the right end (mirrors
    // the trajectory rail's orange "now" node).
    const tNow = _spineT[i]  // 0 → 1 left → right
    const r = Math.random()
    let col: THREE.Color
    if (r < 0.35 * tNow) {
      col = r < 0.10 * tNow ? ORANGE : ORANGE_SOFT
    } else {
      col = r < 0.5 ? COBALT_FAINT : COBALT_SOFT
    }
    colors[ix]     = col.r
    colors[ix + 1] = col.g
    colors[ix + 2] = col.b
  }

  _cachedColors = colors
  return positions
}

// ---------------------------------------------------------------------------
// Per-frame animation tick. Called by slot.ts each render frame BEFORE
// applyStateBehavior — we update `targetPos` here, then applyStateBehavior
// writes target → position attribute.
//
// `dt` is the frame delta in seconds.
// ---------------------------------------------------------------------------

const SPINE_RANGE = SPINE_X_MAX - SPINE_X_MIN

/** Compute the Bezier position for a flow particle and write into target[ix..ix+2]. */
function writeFlowPosition(target: Float32Array, ix: number, clusterIdx: number, t: number): void {
  const src = CLUSTERS[clusterIdx]
  // Bezier control: pull inward (toward x=0) and sag below the midpoint
  // so the curve arcs naturally down-and-in.
  const ctrlX = src.cx * 0.35
  const ctrlY = (src.cy + CONVERGENCE.y) * 0.5 - 0.25
  const ctrlZ = (src.cz + CONVERGENCE.z) * 0.5
  const u = 1 - t
  const u2 = u * u
  const t2 = t * t
  const m  = 2 * u * t
  target[ix]     = u2 * src.cx + m * ctrlX + t2 * CONVERGENCE.x
  target[ix + 1] = u2 * src.cy + m * ctrlY + t2 * CONVERGENCE.y
  target[ix + 2] = u2 * src.cz + m * ctrlZ + t2 * CONVERGENCE.z
}

export function tickTraction(target: Float32Array, count: number, t: number, dt: number): void {
  if (!_role || !_clusterIdx || !_localOffset || !_phase || !_flowT || !_flowSpeed
      || !_flowJitter || !_spineT || !_spineSpeed || !_spineY || !_spineZ) return

  // Clamp dt so a tab-pause spike doesn't catapult flow particles past their
  // end positions in one frame (would manifest as visible "snap" on resume).
  const safeDt = Math.min(dt, 0.05)

  for (let i = 0; i < count; i++) {
    const ix = i * 3
    const role = _role[i]

    if (role === ROLE_CLUSTER) {
      // Synchronized cluster breathing — all particles in a given cluster
      // expand outward and contract inward together like a chest rising
      // and falling. Implemented as a radial scale factor applied to each
      // particle's CACHED gaussian offset from the cluster center.
      //
      // Why this works: with random per-particle phases (V2.0), particles
      // moved in random directions at different times — that reads as
      // noise, not breathing. Sharing the phase across the cluster makes
      // the whole node "inflate" and "deflate" coherently.
      //
      // Each cluster carries a small per-cluster offset (`ci * 1.6`) so
      // they don't all breathe in unison — staggered breathing reads more
      // alive than four synchronized lungs.
      const ci = _clusterIdx[i]
      const c = CLUSTERS[ci]
      const cPhase = t * 0.55 + ci * 1.6
      // Pulse ranges 0.88 → 1.12 (±12% radial). The cluster's apparent
      // diameter visibly expands and contracts.
      const pulse = 1 + Math.sin(cPhase) * 0.12
      // Plus a tiny per-particle high-frequency wiggle for life — adds
      // jitter so the cluster doesn't read as a single solid rubber band.
      const ph = _phase[i]
      const wiggle = 0.003
      target[ix]     = c.cx + _localOffset[ix]     * pulse + Math.sin(t * 0.9 + ph) * wiggle
      target[ix + 1] = c.cy + _localOffset[ix + 1] * pulse + Math.cos(t * 1.0 + ph) * wiggle
      target[ix + 2] = c.cz + _localOffset[ix + 2] * pulse + Math.sin(t * 0.7 + ph) * (wiggle * 0.6)
    } else if (role === ROLE_FLOW) {
      // Advance along the Bezier. When the particle reaches the
      // convergence end (t >= 1), recycle to a position just outside
      // its source cluster so the path stays continuously fed.
      let ft = _flowT[i] + _flowSpeed[i] * safeDt
      if (ft >= 1) {
        // Wrap. Reset to a small random t so the stream looks naturally
        // continuous instead of pulsing every cycle.
        ft = Math.random() * 0.10
      }
      _flowT[i] = ft
      writeFlowPosition(target, ix, _clusterIdx[i], ft)
      target[ix]     += _flowJitter[ix]
      target[ix + 1] += _flowJitter[ix + 1]
      target[ix + 2] += _flowJitter[ix + 2]
    } else {
      // SPINE — left → right drift. When a particle reaches x=1, wrap
      // to x=0 so the spine looks continuously fed from the left.
      let st = _spineT[i] + _spineSpeed[i] * safeDt
      if (st >= 1) st -= 1
      _spineT[i] = st
      const x = SPINE_X_MIN + st * SPINE_RANGE
      target[ix]     = x
      target[ix + 1] = SPINE_Y + _spineY[i]
      target[ix + 2] = _spineZ[i]
    }
  }
}
