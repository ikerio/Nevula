import { ensureShared, attachComposer } from './shared-context'
import { makeSlot, setSlotState } from './slot'
import { createComposer } from './post-fx'
import type { FieldHandle, SlotOptions } from './types'

/**
 * Create the fullscreen background particle field with the post-FX pipeline
 * (UnrealBloom + ACES filmic tonemap) and depth fog enabled by default.
 *
 * Only one background slot may exist per shared context; calling
 * `NevulaBackground` twice replaces the previous slot.
 */
export function NevulaBackground(opts: SlotOptions = {}): FieldHandle {
  const shared = ensureShared()

  // Fog defaults — silver to match --bg-base, subtle density (0.05 is enough
  // for the volumetric feel without desaturating logo/city geometry at depth).
  // Caller may override via opts.fogColor / opts.fogDensity (or pass 0 to disable).
  const slotOpts: SlotOptions = {
    interactive: true,
    fogColor:   0xe6e8ef,
    fogDensity: 0.05,
    ...opts,
  }

  const slot = makeSlot(shared.renderer.getPixelRatio(), slotOpts)
  shared.backgroundSlot = slot

  // Post-FX composer wraps this slot's scene + camera.
  const composer = createComposer(shared.renderer, slot.scene, slot.camera)
  attachComposer(composer)

  if (slot.opts.interactive) {
    window.addEventListener('pointermove', e => {
      slot.mouseTx = (e.clientX / window.innerWidth - 0.5) * 2
      slot.mouseTy = (e.clientY / window.innerHeight - 0.5) * 2
    }, { passive: true })
  }

  return {
    setState: s => setSlotState(slot, s),
    setScale: s => { slot.scaleTarget = s },
    setScaleImmediate: s => { slot.scale = s; slot.scaleTarget = s },
    setOpacity: o => { slot.uniforms.uOpacity.value = o },
    setOffset: (x, y) => { slot.offsetXTarget = x ?? 0; slot.offsetYTarget = y ?? 0 },
    // The shader multiplies uSize × aSize × pixelRatio. Match the constant
    // from materials.ts so external callers pass a "user-friendly" size.
    setSize: s => { slot.uniforms.uSize.value = s * 520 },
    get state() { return slot.state },
  }
}
