import { ensureShared } from './shared-context'
import { makeSlot, setSlotState } from './slot'
import type { SlotHandle, SlotOptions } from './types'

/**
 * Create a preview-slot tied to a DOM element. The shared renderer scissor-
 * renders this slot at the element's bounding rect each frame.
 *
 * Not used by the cinematic landing itself — kept as part of the public API
 * for the design-system documentation pages.
 */
export function NevulaSlot(el: HTMLElement, opts: SlotOptions = {}): SlotHandle {
  const shared = ensureShared()
  const slot = makeSlot(shared.renderer.getPixelRatio(), opts)
  slot.el = el
  shared.previewSlots.push(slot)
  return {
    setState: s => setSlotState(slot, s),
    setScale: s => { slot.scaleTarget = s },
    setScaleImmediate: s => { slot.scale = s; slot.scaleTarget = s },
    setOpacity: o => { slot.uniforms.uOpacity.value = o },
    setOffset: (x, y) => { slot.offsetXTarget = x ?? 0; slot.offsetYTarget = y ?? 0 },
    setSize: s => { slot.uniforms.uSize.value = s * 520 },
    get state() { return slot.state },
  }
}
