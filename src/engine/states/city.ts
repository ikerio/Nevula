import type { StateGenerator } from '../types'

/** Row of 7 buildings (rectangular prisms) on a ground plane. */
export const genCity: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  const buildings = [
    { x: -1.05, w: 0.16, h: 0.55, d: 0.22 },
    { x: -0.75, w: 0.22, h: 0.95, d: 0.26 },
    { x: -0.42, w: 0.18, h: 0.7,  d: 0.20 },
    { x: -0.12, w: 0.26, h: 1.25, d: 0.28 },
    { x:  0.22, w: 0.18, h: 0.85, d: 0.22 },
    { x:  0.55, w: 0.24, h: 1.05, d: 0.26 },
    { x:  0.92, w: 0.18, h: 0.68, d: 0.22 },
  ]
  const weights = buildings.map(b => b.w * b.h)
  const total = weights.reduce((a, b) => a + b, 0)
  let i = 0
  for (let b = 0; b < buildings.length; b++) {
    const portion = Math.round(count * 0.86 * weights[b] / total)
    const bb = buildings[b]
    for (let k = 0; k < portion && i < count; k++) {
      // Bias toward facade (74%), then roof slab.
      const face = Math.random()
      let x: number, y: number, z: number
      if (face < 0.74) {
        const which = Math.floor(Math.random() * 4)
        if (which === 0)      { x = bb.x - bb.w / 2; y = -0.7 + Math.random() * bb.h; z = (Math.random() - 0.5) * bb.d }
        else if (which === 1) { x = bb.x + bb.w / 2; y = -0.7 + Math.random() * bb.h; z = (Math.random() - 0.5) * bb.d }
        else if (which === 2) { x = bb.x + (Math.random() - 0.5) * bb.w; y = -0.7 + Math.random() * bb.h; z = -bb.d / 2 }
        else                  { x = bb.x + (Math.random() - 0.5) * bb.w; y = -0.7 + Math.random() * bb.h; z =  bb.d / 2 }
      } else {
        // roof slab
        x = bb.x + (Math.random() - 0.5) * bb.w
        y = -0.7 + bb.h + (Math.random() - 0.5) * 0.02
        z = (Math.random() - 0.5) * bb.d
      }
      arr[i * 3]     = x
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = z
      i++
    }
  }
  // Ground plane fill.
  for (; i < count; i++) {
    arr[i * 3]     = (Math.random() - 0.5) * 2.4
    arr[i * 3 + 1] = -0.72 + (Math.random() - 0.5) * 0.03
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5
  }
  return arr
}
