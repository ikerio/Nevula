import type { StateGenerator } from '../types'

/** 3D lattice with jitter — sharp points. Spherical fill for remainder. */
export const genConstellation: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  const dim = Math.ceil(Math.cbrt(count))
  let i = 0
  for (let x = 0; x < dim && i < count; x++) {
    for (let y = 0; y < dim && i < count; y++) {
      for (let z = 0; z < dim && i < count; z++) {
        if (i >= count) break
        const nx = (x / (dim - 1) - 0.5) * 1.7
        const ny = (y / (dim - 1) - 0.5) * 1.7
        const nz = (z / (dim - 1) - 0.5) * 0.6
        const jitter = 0.04
        arr[i * 3]     = nx + (Math.random() - 0.5) * jitter
        arr[i * 3 + 1] = ny + (Math.random() - 0.5) * jitter
        arr[i * 3 + 2] = nz + (Math.random() - 0.5) * jitter
        i++
      }
    }
  }
  // Spherical fill for remainder.
  for (; i < count; i++) {
    const t = Math.random() * Math.PI * 2
    const p = Math.acos(2 * Math.random() - 1)
    const r = 0.9 + Math.random() * 0.2
    arr[i * 3]     = r * Math.sin(p) * Math.cos(t)
    arr[i * 3 + 1] = r * Math.sin(p) * Math.sin(t)
    arr[i * 3 + 2] = r * Math.cos(p) * 0.4
  }
  return arr
}
