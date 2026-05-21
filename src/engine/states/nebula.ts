import type { StateGenerator } from '../types'

/** Multi-cluster gaussian nebula — 4 clusters with box-muller falloff. */
export const genNebula: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const cluster = Math.random()
    let cx = 0, cy = 0, cz = 0, r = 1
    if (cluster < 0.55)      { cx = 0;    cy = 0;     cz = 0;    r = 1.05 }
    else if (cluster < 0.78) { cx = 0.5;  cy = 0.25;  cz = -0.2; r = 0.45 }
    else if (cluster < 0.92) { cx = -0.5; cy = -0.25; cz = 0.2;  r = 0.4  }
    else {
      cx = (Math.random() - 0.5) * 1.4
      cy = (Math.random() - 0.5) * 1.4
      cz = (Math.random() - 0.5) * 0.4
      r = 0.2
    }
    // Box-Muller gaussian × 3
    const u1 = Math.random(), u2 = Math.random()
    const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    const u3 = Math.random(), u4 = Math.random()
    const g2 = Math.sqrt(-2 * Math.log(u3)) * Math.cos(2 * Math.PI * u4)
    const u5 = Math.random(), u6 = Math.random()
    const g3 = Math.sqrt(-2 * Math.log(u5)) * Math.cos(2 * Math.PI * u6)
    arr[i * 3]     = cx + g  * r * 0.55
    arr[i * 3 + 1] = cy + g2 * r * 0.55
    arr[i * 3 + 2] = cz + g3 * r * 0.35
  }
  return arr
}
