import * as THREE from 'three'
import type { EffectComposer } from 'postprocessing'
import type { SlotInternal } from './types'
import { updateSlot } from './slot'

interface SharedContext {
  canvas: HTMLCanvasElement
  renderer: THREE.WebGLRenderer
  clock: THREE.Clock
  raf: number
  backgroundSlot: SlotInternal | null
  /** Post-FX composer for the background slot. Null when no background slot exists. */
  composer: EffectComposer | null
  previewSlots: SlotInternal[]
  resizeListener: (() => void) | null
}

let SHARED: SharedContext | null = null

/**
 * Lazily creates the shared canvas + renderer. Subsequent calls are no-ops.
 * The canvas is inserted as the first child of <body> at z:0, fixed.
 */
export function ensureShared(): SharedContext {
  if (SHARED) return SHARED

  const canvas = document.createElement('canvas')
  canvas.id = '__nevula-field'
  canvas.style.cssText =
    'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:0;pointer-events:none;'
  document.body.insertBefore(canvas, document.body.firstChild)

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.autoClear = false

  const clock = new THREE.Clock()

  const ctx: SharedContext = {
    canvas,
    renderer,
    clock,
    raf: 0,
    backgroundSlot: null,
    composer: null,
    previewSlots: [],
    resizeListener: null,
  }

  const resize = () => {
    const W = window.innerWidth
    const H = window.innerHeight
    renderer.setSize(W, H, false)
    if (ctx.composer) ctx.composer.setSize(W, H)
  }
  resize()
  window.addEventListener('resize', resize)
  ctx.resizeListener = resize

  SHARED = ctx
  SHARED.raf = requestAnimationFrame(sharedTick)
  return SHARED
}

/** Returns the active shared context, or throws if `ensureShared` hasn't run. */
export function getShared(): SharedContext {
  if (!SHARED) throw new Error('engine: ensureShared() must be called first')
  return SHARED
}

/** Attach a post-FX composer to the shared context (used by the background slot). */
export function attachComposer(composer: EffectComposer): void {
  if (!SHARED) throw new Error('engine: ensureShared() must be called first')
  SHARED.composer = composer
  composer.setSize(window.innerWidth, window.innerHeight)
}

/**
 * One animation frame:
 *   1. clear canvas to transparent
 *   2. render the fullscreen background slot — through the composer if present,
 *      otherwise raw (used during construction before the composer attaches)
 *   3. for each preview slot, scissor-render at its DOM rect (always raw)
 */
function sharedTick(): void {
  const s = SHARED
  if (!s) return
  s.raf = requestAnimationFrame(sharedTick)
  const dt = s.clock.getDelta()
  const t = s.clock.elapsedTime
  const W = window.innerWidth
  const H = window.innerHeight
  const r = s.renderer

  r.setScissorTest(false)
  r.setViewport(0, 0, W, H)
  r.setClearColor(0x000000, 0)
  r.clear(true, true, false)

  if (s.backgroundSlot) {
    const slot = s.backgroundSlot
    updateSlot(slot, t, dt)
    slot.camera.aspect = W / H
    slot.camera.updateProjectionMatrix()
    if (s.composer) {
      // Composer manages its own framebuffer pipeline; final pass writes to
      // the canvas. autoClear stays false so subsequent preview-slot renders
      // can overpaint specific rects without wiping the bloomed result.
      s.composer.render(dt)
    } else {
      r.setViewport(0, 0, W, H)
      r.render(slot.scene, slot.camera)
    }
  }

  // Preview slots — scissor-render at their DOM rects (always raw).
  r.setScissorTest(true)
  for (const slot of s.previewSlots) {
    if (!slot.el || !slot.el.isConnected) continue
    const rect = slot.el.getBoundingClientRect()
    if (rect.bottom <= -100 || rect.top >= H + 100 || rect.right <= 0 || rect.left >= W) continue
    if (rect.width < 4 || rect.height < 4) continue

    updateSlot(slot, t, dt)

    const vx = rect.left
    const vy = H - rect.bottom
    const vw = rect.width
    const vh = rect.height
    r.setViewport(vx, vy, vw, vh)

    const sx = Math.max(0, vx)
    const sy = Math.max(0, vy)
    const sw = Math.min(W, vx + vw) - sx
    const sh = Math.min(H, vy + vh) - sy
    if (sw <= 0 || sh <= 0) continue
    r.setScissor(sx, sy, sw, sh)

    r.setClearColor(slot.opts.clearColor, slot.opts.clearAlpha)
    r.clear(true, true, false)

    slot.camera.aspect = vw / vh
    slot.camera.updateProjectionMatrix()
    r.render(slot.scene, slot.camera)
  }
  r.setScissorTest(false)
}

/** Tears down the shared canvas + renderer + composer (for HMR + tests). */
export function disposeShared(): void {
  if (!SHARED) return
  cancelAnimationFrame(SHARED.raf)
  if (SHARED.resizeListener) window.removeEventListener('resize', SHARED.resizeListener)
  SHARED.composer?.dispose()
  SHARED.renderer.dispose()
  SHARED.canvas.remove()
  SHARED = null
}
