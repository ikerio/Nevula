/* =============================================================================
 * 3D simplex noise (Stefan Gustavson) + divergence-free curl noise.
 * Used by the ambient-state curl drift (behaviors/per-state-update) and the
 * nebula warm-zone coloring (colors.ts). GLSL equivalents live inline in the
 * cloud shader (field-fx.ts) — this is the CPU side.
 * ========================================================================== */

const _grad3 = new Float32Array([
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
  1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
  0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
])
const _perm = new Uint8Array(512)
const _permMod12 = new Uint8Array(512)
;(function initNoise() {
  const p = new Uint8Array(256)
  for (let i = 0; i < 256; i++) p[i] = i
  // Deterministic LCG shuffle (no Math.random) so the noise field is stable
  // across reloads — the nebula warm-zones look identical every session.
  let seed = 1337
  for (let i = 255; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    const j = seed % (i + 1)
    const t = p[i]; p[i] = p[j]; p[j] = t
  }
  for (let i = 0; i < 512; i++) {
    _perm[i] = p[i & 255]
    _permMod12[i] = _perm[i] % 12
  }
})()

const F3 = 1 / 3
const G3 = 1 / 6

/** 3D simplex noise, output ~[-1, 1]. */
export function snoise(x: number, y: number, z: number): number {
  let n0 = 0, n1 = 0, n2 = 0, n3 = 0
  const s = (x + y + z) * F3
  const i = Math.floor(x + s), j = Math.floor(y + s), k = Math.floor(z + s)
  const t = (i + j + k) * G3
  const x0 = x - (i - t), y0 = y - (j - t), z0 = z - (k - t)
  let i1, j1, k1, i2, j2, k2
  if (x0 >= y0) {
    if (y0 >= z0)      { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1 }
    else               { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1 }
  } else {
    if (y0 < z0)       { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1 }
    else if (x0 < z0)  { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1 }
    else               { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0 }
  }
  const x1 = x0 - i1 + G3,     y1 = y0 - j1 + G3,     z1 = z0 - k1 + G3
  const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3
  const x3 = x0 - 1 + 3 * G3,  y3 = y0 - 1 + 3 * G3,  z3 = z0 - 1 + 3 * G3
  const ii = i & 255, jj = j & 255, kk = k & 255
  let tt = 0.6 - x0 * x0 - y0 * y0 - z0 * z0
  if (tt > 0) { const gi = _permMod12[ii + _perm[jj + _perm[kk]]] * 3; tt *= tt; n0 = tt * tt * (_grad3[gi] * x0 + _grad3[gi + 1] * y0 + _grad3[gi + 2] * z0) }
  tt = 0.6 - x1 * x1 - y1 * y1 - z1 * z1
  if (tt > 0) { const gi = _permMod12[ii + i1 + _perm[jj + j1 + _perm[kk + k1]]] * 3; tt *= tt; n1 = tt * tt * (_grad3[gi] * x1 + _grad3[gi + 1] * y1 + _grad3[gi + 2] * z1) }
  tt = 0.6 - x2 * x2 - y2 * y2 - z2 * z2
  if (tt > 0) { const gi = _permMod12[ii + i2 + _perm[jj + j2 + _perm[kk + k2]]] * 3; tt *= tt; n2 = tt * tt * (_grad3[gi] * x2 + _grad3[gi + 1] * y2 + _grad3[gi + 2] * z2) }
  tt = 0.6 - x3 * x3 - y3 * y3 - z3 * z3
  if (tt > 0) { const gi = _permMod12[ii + 1 + _perm[jj + 1 + _perm[kk + 1]]] * 3; tt *= tt; n3 = tt * tt * (_grad3[gi] * x3 + _grad3[gi + 1] * y3 + _grad3[gi + 2] * z3) }
  return 32 * (n0 + n1 + n2 + n3)
}

const E = 0.09

/**
 * Divergence-free curl of a 3-channel noise potential (Bridson). Particles
 * advected/warped by this swirl along streamlines instead of converging.
 * Writes into `out` (a 3-tuple) to avoid per-call allocation.
 */
export function curlNoise(x: number, y: number, z: number, out: [number, number, number]): void {
  const p1 = (a: number, b: number, c: number) => snoise(a, b, c)
  const p2 = (a: number, b: number, c: number) => snoise(a + 31.41, b + 17.0, c - 7.3)
  const p3 = (a: number, b: number, c: number) => snoise(a - 19.7, b - 4.2, c + 23.1)
  const dp3dy = (p3(x, y + E, z) - p3(x, y - E, z)) / (2 * E)
  const dp2dz = (p2(x, y, z + E) - p2(x, y, z - E)) / (2 * E)
  const dp1dz = (p1(x, y, z + E) - p1(x, y, z - E)) / (2 * E)
  const dp3dx = (p3(x + E, y, z) - p3(x - E, y, z)) / (2 * E)
  const dp2dx = (p2(x + E, y, z) - p2(x - E, y, z)) / (2 * E)
  const dp1dy = (p1(x, y + E, z) - p1(x, y - E, z)) / (2 * E)
  out[0] = dp3dy - dp2dz
  out[1] = dp1dz - dp3dx
  out[2] = dp2dx - dp1dy
}
