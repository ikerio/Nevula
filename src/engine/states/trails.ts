import type { StateGenerator } from '../types'

/**
 * Particles arrayed along 24 radial spokes (device → hub), animated to flow
 * inward via the per-state update loop.
 */
export const genTrails: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  const spokes = 24
  for (let i = 0; i < count; i++) {
    const spoke = i % spokes
    const angle = (spoke / spokes) * Math.PI * 2
    const r = Math.random() * 1.3
    arr[i * 3]     = Math.cos(angle) * r
    arr[i * 3 + 1] = Math.sin(angle) * r
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.2
  }
  return arr
}
