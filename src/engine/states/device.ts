import type { StateGenerator } from '../types'

/** Dome-camera body + collar + lens + mount + signal halo. */
export const genDevice: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = Math.random()
    let x: number, y: number, z: number
    if (r < 0.50) {
      // Dome body — hemisphere facing +Z.
      const u = Math.random(), v = Math.random()
      const theta = 2 * Math.PI * u
      const phi = Math.acos(v) // 0..pi/2 → hemisphere
      const radius = 0.45
      x = radius * Math.sin(phi) * Math.cos(theta)
      y = radius * Math.sin(phi) * Math.sin(theta)
      z = radius * Math.cos(phi) * 0.85
    } else if (r < 0.74) {
      // Collar ring at base of dome.
      const a = Math.random() * Math.PI * 2
      const rr = 0.46 + (Math.random() - 0.5) * 0.02
      x = Math.cos(a) * rr
      y = Math.sin(a) * rr
      z = -0.05 + (Math.random() - 0.5) * 0.04
    } else if (r < 0.86) {
      // Lens — concentric disks at front.
      const a = Math.random() * Math.PI * 2
      const ring = Math.random()
      let rr: number
      if (ring < 0.4)      rr = Math.random() * 0.08         // inner
      else if (ring < 0.8) rr = 0.14 + Math.random() * 0.03  // mid ring
      else                 rr = 0.22 + Math.random() * 0.03  // outer
      x = Math.cos(a) * rr
      y = Math.sin(a) * rr
      z = 0.38 + (Math.random() - 0.5) * 0.02
    } else if (r < 0.94) {
      // Mount arm going up.
      const len = Math.random() * 0.55
      x = (Math.random() - 0.5) * 0.06
      y = 0.45 + len
      z = (Math.random() - 0.5) * 0.06
    } else {
      // Signal halo emitted from lens.
      const a = Math.random() * Math.PI * 2
      const rr = 0.6 + Math.random() * 0.45
      x = Math.cos(a) * rr
      y = Math.sin(a) * rr * 0.75
      z = 0.38 + (Math.random() - 0.5) * 0.3
    }
    arr[i * 3]     = x
    arr[i * 3 + 1] = y
    arr[i * 3 + 2] = z
  }
  return arr
}
