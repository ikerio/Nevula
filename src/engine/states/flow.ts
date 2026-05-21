import type { StateGenerator } from '../types'

/** 5 horizontal streams with sine displacement (advected leftward in update). */
export const genFlow: StateGenerator = (count) => {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const stream = Math.floor(Math.random() * 5)
    const y = -0.7 + stream * 0.35 + (Math.random() - 0.5) * 0.15
    const x = (Math.random() - 0.5) * 2.4
    arr[i * 3]     = x
    arr[i * 3 + 1] = y + Math.sin(x * 2 + stream) * 0.12
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4
  }
  return arr
}
