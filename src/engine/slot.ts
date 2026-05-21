import * as THREE from 'three'
import type { ParticleState, SlotInternal, SlotOptions } from './types'
import { STATE_FNS } from './states'
import { colorize } from './colors'
import { createParticleMaterial, STATE_BLENDING } from './materials'
import { applyStateBehavior } from './behaviors/per-state-update'
import { tickLogoTrails, resetLogoTrails } from './states/logo'

/** Duration (ms) of each half of the blending crossfade (fade-out + fade-in). */
const BLEND_FADE_MS = 120

const DEFAULTS: Required<SlotOptions> = {
  count: 1200,
  size: 0.016,
  state: 'nebula',
  scale: 1.0,
  clearColor: 0x0a0f1f,
  clearAlpha: 0,
  interactive: false,
  lines: false,
  fogColor: 0xe6e8ef,
  fogDensity: 0,
}

/** Builds the geometry, material, points (and optional lineSegs) for a slot. */
export function makeSlot(pixelRatio: number, optsIn: SlotOptions): SlotInternal {
  const opts: Required<SlotOptions> = { ...DEFAULTS, ...optsIn }

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 50)
  camera.position.z = 3.4

  const count = opts.count
  const fn = STATE_FNS[opts.state]
  const positions = fn(count)
  const colors = colorize(count, opts.state)
  const sizes = new Float32Array(count)
  for (let i = 0; i < count; i++) sizes[i] = 0.6 + Math.random() * 1.6

  const alphas = new Float32Array(count)
  for (let i = 0; i < count; i++) alphas[i] = 1

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  // Per-particle alpha — surface particles default to 1; logo trails override
  // this each frame to drive fade-in/out cycles along the mesh wireframe.
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))

  const { material, uniforms } = createParticleMaterial({
    size: opts.size,
    pixelRatio,
    blending: STATE_BLENDING[opts.state],
    fogColor: opts.fogColor,
    fogDensity: opts.fogDensity,
  })

  const points = new THREE.Points(geo, material)
  scene.add(points)

  let lineSegs: THREE.LineSegments | null = null
  if (opts.lines) {
    const maxLines = 1200
    const linesGeo = new THREE.BufferGeometry()
    const linePos = new Float32Array(maxLines * 2 * 3)
    linesGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
    const linesMat = new THREE.LineBasicMaterial({
      color: 0x00529c,
      transparent: true,
      opacity: 0.22,
      blending: THREE.NormalBlending,
      depthWrite: false,
    })
    lineSegs = new THREE.LineSegments(linesGeo, linesMat)
    lineSegs.visible = (opts.state === 'constellation')
    scene.add(lineSegs)
  }

  return {
    scene,
    camera,
    points,
    geo,
    material,
    uniforms,
    lineSegs,
    targetPos: positions.slice(),
    pendingTargets: null,
    pendingColors: null,
    isMorphing: false,
    count,
    state: opts.state,
    scale: opts.scale,
    scaleTarget: opts.scale,
    opts,
    mouseTx: 0,
    mouseTy: 0,
    mouseX: 0,
    mouseY: 0,
    offsetX: 0,
    offsetY: 0,
    offsetXTarget: 0,
    offsetYTarget: 0,
    blendingTransition: null,
  }
}

/** Schedules a morph toward a new state. The actual lerp happens in updateSlot. */
export function setSlotState(slot: SlotInternal, state: ParticleState): void {
  if (slot.state === state) return
  const wasLogo = slot.state === 'logo'
  slot.state = state
  // Wireframe-trail state is module-level in logo.ts. Reset on logo exit so
  // the next logo entry spawns fresh trails rather than resuming stale phases.
  if (wasLogo) resetLogoTrails()
  const fn = STATE_FNS[state]
  if (!fn) return
  slot.pendingTargets = fn(slot.count)
  slot.pendingColors = colorize(slot.count, state)
  slot.isMorphing = true
  if (slot.lineSegs) slot.lineSegs.visible = (state === 'constellation')

  // Reset per-particle alpha — the logo trail particles may have left
  // aAlpha at fractional values; without this they'd be partially invisible
  // for any subsequent state.
  const alphaAttr = slot.geo.getAttribute('aAlpha')
  const alphaArr = alphaAttr.array as Float32Array
  alphaArr.fill(1)
  alphaAttr.needsUpdate = true

  // If the new state's blending mode differs from the current one, start a
  // smooth uBlendFade crossfade (1 → 0 → 1 across ~240ms total) to hide the
  // pop of swapping blending modes mid-render.
  const targetBlending = STATE_BLENDING[state]
  const currentBlending = slot.blendingTransition
    ? slot.blendingTransition.targetBlending
    : slot.material.blending
  if (targetBlending !== currentBlending) {
    slot.blendingTransition = {
      phase: 'fading-out',
      startedAt: performance.now(),
      fromFade: slot.uniforms.uBlendFade.value,
      targetBlending,
    }
  }
}

/** Build the constellation connector lines (stride-sampled neighbors). */
export function buildLines(slot: SlotInternal): void {
  if (!slot.lineSegs) return
  const linePos = slot.lineSegs.geometry.getAttribute('position').array as Float32Array
  const positions = slot.geo.getAttribute('position').array as Float32Array
  const count = slot.count
  const maxLines = linePos.length / 6
  let li = 0
  const stride = Math.max(1, Math.floor(count / 600))
  const threshold = 0.18
  for (let i = 0; i < count && li < maxLines; i += stride) {
    const x1 = positions[i * 3],     y1 = positions[i * 3 + 1], z1 = positions[i * 3 + 2]
    for (let k = 1; k <= 4 && li < maxLines; k++) {
      const j = (i + k * stride) % count
      const x2 = positions[j * 3],     y2 = positions[j * 3 + 1], z2 = positions[j * 3 + 2]
      const d = Math.hypot(x1 - x2, y1 - y2, z1 - z2)
      if (d < threshold) {
        linePos[li * 6]     = x1; linePos[li * 6 + 1] = y1; linePos[li * 6 + 2] = z1
        linePos[li * 6 + 3] = x2; linePos[li * 6 + 4] = y2; linePos[li * 6 + 5] = z2
        li++
      }
    }
  }
  for (let r = li; r < maxLines; r++) {
    linePos[r * 6]     = 0; linePos[r * 6 + 1] = 0; linePos[r * 6 + 2] = 0
    linePos[r * 6 + 3] = 0; linePos[r * 6 + 4] = 0; linePos[r * 6 + 5] = 0
  }
  slot.lineSegs.geometry.getAttribute('position').needsUpdate = true
}

/**
 * One-frame update — morph step + per-state behavior + mouse parallax + scale
 * + offset lerp. Caller drives the time `t` (seconds, from a shared clock).
 */
export function updateSlot(slot: SlotInternal, t: number): void {
  const col = slot.geo.getAttribute('color').array as Float32Array
  const target = slot.targetPos
  const count = slot.count

  // Morph toward pending (8% per frame for positions, 4% for colors).
  if (slot.isMorphing && slot.pendingTargets) {
    let still = false
    const pending = slot.pendingTargets
    for (let i = 0; i < count * 3; i++) {
      const d = pending[i] - target[i]
      target[i] += d * 0.08
      if (Math.abs(d) > 0.001) still = true
    }
    if (slot.pendingColors) {
      const pc = slot.pendingColors
      for (let i = 0; i < count * 3; i++) {
        col[i] += (pc[i] - col[i]) * 0.04
      }
      slot.geo.getAttribute('color').needsUpdate = true
    }
    if (!still) {
      for (let i = 0; i < count * 3; i++) target[i] = pending[i]
      slot.pendingTargets = null
      slot.isMorphing = false
    }
  }

  // Per-state position drift around target.
  applyStateBehavior(slot, t)
  slot.geo.getAttribute('position').needsUpdate = true

  // Logo state has wireframe trail particles riding along the mesh edges in
  // addition to the surface drift — the last `LOGO_TRAIL_COUNT` indices get
  // their position + color + alpha overwritten each frame by the trail
  // sequencer. Skipped during the morph in/out of logo (would clash with the
  // position/color lerp).
  if (slot.state === 'logo' && !slot.isMorphing) {
    const updated = tickLogoTrails(slot.geo, slot.count, t)
    if (updated) {
      slot.geo.getAttribute('color').needsUpdate = true
      slot.geo.getAttribute('aAlpha').needsUpdate = true
    }
  }

  // Blending-mode crossfade: ramp uBlendFade 1→0, swap material.blending at
  // the midpoint, ramp 0→1. Position+color morph proceeds in parallel under
  // the cover of the brief invisible window.
  if (slot.blendingTransition) {
    const tr = slot.blendingTransition
    const elapsed = performance.now() - tr.startedAt
    const k = Math.min(1, elapsed / BLEND_FADE_MS)
    if (tr.phase === 'fading-out') {
      slot.uniforms.uBlendFade.value = tr.fromFade * (1 - k)
      if (k >= 1) {
        slot.material.blending = tr.targetBlending
        slot.material.needsUpdate = true
        slot.uniforms.uBlendFade.value = 0
        tr.phase = 'fading-in'
        tr.startedAt = performance.now()
        tr.fromFade = 0
      }
    } else {
      slot.uniforms.uBlendFade.value = k  // 0 → 1
      if (k >= 1) {
        slot.uniforms.uBlendFade.value = 1
        slot.blendingTransition = null
      }
    }
  }

  // Logo state gets a slow ambient yaw (±2.5° over a ~35-second cycle) to
  // give the brand mark some dimension without spinning it. Other states
  // stay flat — mouse parallax (below) still applies pitch in all states.
  slot.points.rotation.y =
    slot.state === 'logo' ? Math.sin(t * 0.18) * 0.045 : 0
  if (slot.opts.interactive) {
    slot.mouseX += (slot.mouseTx - slot.mouseX) * 0.05
    slot.mouseY += (slot.mouseTy - slot.mouseY) * 0.05
    slot.points.rotation.x = slot.mouseY * 0.18
  }

  // Scale lerp.
  slot.scale += (slot.scaleTarget - slot.scale) * 0.05
  slot.points.scale.setScalar(slot.scale)

  // Subject offset (lets chapters bias the subject left/right of center).
  slot.offsetX += (slot.offsetXTarget - slot.offsetX) * 0.06
  slot.offsetY += (slot.offsetYTarget - slot.offsetY) * 0.06
  slot.points.position.x = slot.offsetX
  slot.points.position.y = slot.offsetY

  if (slot.lineSegs) {
    slot.lineSegs.rotation.copy(slot.points.rotation)
    slot.lineSegs.scale.setScalar(slot.scale)
    slot.lineSegs.position.copy(slot.points.position)
    if (slot.lineSegs.visible && Math.floor(t * 6) % 2 === 0) {
      buildLines(slot)
    }
  }
}
