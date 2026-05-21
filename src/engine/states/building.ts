import type { StateGenerator } from '../types'

/** Single tall building — hollow facade + window grid + roof slab + antenna. */
export const genBuilding: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  const w = 0.46, h = 1.6, d = 0.46
  for (let i = 0; i < count; i++) {
    const r = Math.random()
    let x: number, y: number, z: number
    if (r < 0.66) {
      const which = Math.floor(Math.random() * 4)
      if (which === 0)      { x = -w / 2; y = -h / 2 + Math.random() * h; z = (Math.random() - 0.5) * d }
      else if (which === 1) { x =  w / 2; y = -h / 2 + Math.random() * h; z = (Math.random() - 0.5) * d }
      else if (which === 2) { x = (Math.random() - 0.5) * w; y = -h / 2 + Math.random() * h; z = -d / 2 }
      else                  { x = (Math.random() - 0.5) * w; y = -h / 2 + Math.random() * h; z =  d / 2 }
    } else if (r < 0.92) {
      // Window grid on front + back faces.
      const col = Math.floor(Math.random() * 4) - 1.5  // -1.5..1.5
      const row = Math.floor(Math.random() * 11) - 5   // -5..5
      x = col * 0.10 + (Math.random() - 0.5) * 0.025
      y = row * 0.13 + (Math.random() - 0.5) * 0.02
      z = (Math.random() < 0.5 ? -d / 2 : d / 2) + (Math.random() - 0.5) * 0.008
    } else if (r < 0.98) {
      // Roof slab.
      x = (Math.random() - 0.5) * w
      y =  h / 2 + (Math.random() - 0.5) * 0.02
      z = (Math.random() - 0.5) * d
    } else {
      // Antenna at top.
      x = (Math.random() - 0.5) * 0.02
      y = h / 2 + Math.random() * 0.25
      z = (Math.random() - 0.5) * 0.02
    }
    arr[i * 3]     = x
    arr[i * 3 + 1] = y
    arr[i * 3 + 2] = z
  }
  return arr
}
