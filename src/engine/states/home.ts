import type { StateGenerator } from '../types'

/** Square base + triangular pitched roof. */
export const genHome: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  const w = 1.35, baseH = 0.85, d = 0.85, roofH = 0.55
  const baseY = -0.55
  for (let i = 0; i < count; i++) {
    const r = Math.random()
    let x: number, y: number, z: number
    if (r < 0.55) {
      // 4 walls
      const which = Math.floor(Math.random() * 4)
      if (which === 0)      { x = -w / 2; y = baseY + Math.random() * baseH; z = (Math.random() - 0.5) * d }
      else if (which === 1) { x =  w / 2; y = baseY + Math.random() * baseH; z = (Math.random() - 0.5) * d }
      else if (which === 2) { x = (Math.random() - 0.5) * w; y = baseY + Math.random() * baseH; z = -d / 2 }
      else                  { x = (Math.random() - 0.5) * w; y = baseY + Math.random() * baseH; z =  d / 2 }
    } else if (r < 0.92) {
      // Pitched roof: two slanted faces.
      const along = (Math.random() - 0.5) * w
      const heightAtX = roofH * (1 - Math.abs(along) / (w / 2))
      const zSide = Math.random() < 0.5 ? -d / 2 : d / 2
      if (Math.random() < 0.55) {
        // Triangular gable face.
        x = along
        y = baseY + baseH + Math.random() * Math.max(0, heightAtX)
        z = zSide
      } else {
        // Sloping roof plane.
        const t = Math.random()
        const zAlong = (Math.random() - 0.5) * d
        x = along
        y = baseY + baseH + Math.max(0, heightAtX) * t
        z = zAlong
      }
    } else {
      // Ground footprint.
      x = (Math.random() - 0.5) * w * 1.15
      y = baseY - 0.01
      z = (Math.random() - 0.5) * d * 1.15
    }
    arr[i * 3]     = x
    arr[i * 3 + 1] = y
    arr[i * 3 + 2] = z
  }
  return arr
}
