/* =============================================================================
 * Background-field FX layer (cursor parting + orchestration edges + the
 * color-aware fbm nebula gas cloud). Promoted from proto/particles.ts.
 *
 * All sub-objects are parented to `slot.points` and work in its LOCAL space, so
 * they inherit the field's rotation (parallax), scale, and offset automatically
 * — keeping the cloud + edges aligned with the particles without re-deriving
 * the transform. Cursor parting + edges run for the ambient states only
 * (nebula/constellation); the gas cloud is nebula-only. On any other state the
 * whole layer eases out and stops rendering.
 * ========================================================================== */

import * as THREE from 'three'
import type { SlotInternal, FieldFx } from './types'
import { COBALT_DEEP } from './colors'

// — tuning (locked in the sandbox) —
const PART_RADIUS = 0.25
const PART_STRENGTH = 0.12
const LINK_OPACITY = 0.9
const CLOUD_OPACITY = 0.35
const CLOUD_SPEED = 0.03
const MAX_SEG = 900
const LINK_NODE_CAP = 90
const CF_G = 48
const CF_HW = 1.8   // half-extents of the cloud plane (must match PlaneGeometry)
const CF_HH = 1.5

const CLOUD_LIGHT = new THREE.Color('#5b9be0') // lighter azul vein highlight
const EDGE_BRIGHTEN = 1.3                       // lift particle color so edges read

// ── Shaders ─────────────────────────────────────────────────────────────────
const EDGE_VERT = /* glsl */ `
  attribute float aLineAlpha;
  varying vec3 vColor;
  varying float vA;
  void main() {
    vColor = color;
    vA = aLineAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// Per-vertex alpha lives in the shader, NOT premultiplied into vertex color —
// alpha-in-vertex-color on a LineBasicMaterial renders BLACK at alpha 0.
const EDGE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vA;
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(vColor, vA * uOpacity); }
`

const CLOUD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv * 2.0 - 1.0;   // center to [-1, 1]
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const CLOUD_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScale;
  uniform float uContrast;
  uniform float uThreshold;
  uniform vec3  uColDeep;
  uniform vec3  uColLight;
  uniform sampler2D uColorTex;   // avg particle color (rgb) + coverage (a)
  uniform float uColorAmount;

  // — Ashima 3D simplex noise (snoise) —
  vec4 permute(vec4 x){ return mod(((x * 34.0) + 1.0) * x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  float fbm(vec3 p){
    float sum = 0.0, amp = 0.5, freq = 1.0;
    for (int i = 0; i < 4; i++){ sum += amp * snoise(p * freq); freq *= 2.0; amp *= 0.5; }
    return sum;
  }
  void main(){
    vec3 sp = vec3(vUv * uScale, uTime);
    vec3 q = vec3(fbm(sp), fbm(sp + 3.1), fbm(sp + 7.4));   // domain warp → smoky filaments
    float dens = fbm(sp + 1.8 * q) * 0.5 + 0.5;
    dens = smoothstep(uThreshold, 1.0, dens);              // cut gaps → silver shows through
    dens = pow(dens, uContrast);
    float mask = smoothstep(1.0, 0.25, length(vUv));       // contain as a blob (no plane edges)
    float a = dens * mask * uOpacity;
    // Tint by the local particle color (orange zones → orange gas), falling back
    // to the azul gradient where there are no particles (coverage → 0).
    vec3 azul = mix(uColDeep, uColLight, dens);
    vec4 field = texture2D(uColorTex, vUv * 0.5 + 0.5);
    vec3 col = mix(azul, field.rgb, clamp(field.a * uColorAmount, 0.0, 1.0));
    gl_FragColor = vec4(col, a);
  }
`

// scratch (module-level, reused across frames + slots — only one bg slot exists)
const _ndc = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _world = new THREE.Vector3()
const _mvp = new THREE.Matrix4()
const _p = new THREE.Vector3()
const nearIdx: number[] = []
const nearDist: number[] = []   // screen-space distance to cursor
const nearNX: number[] = []     // particle NDC x
const nearNY: number[] = []     // particle NDC y

/** Build the cursor-edge LineSegments + cloud plane, parent both to slot.points. */
export function createFieldFx(slot: SlotInternal): FieldFx {
  const count = slot.count

  // — cursor edges —
  const edgeGeo = new THREE.BufferGeometry()
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2 * 3), 3))
  edgeGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2 * 3), 3))
  edgeGeo.setAttribute('aLineAlpha', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2), 1))
  edgeGeo.setDrawRange(0, 0)
  const edgeMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 } },
    vertexShader: EDGE_VERT, fragmentShader: EDGE_FRAG,
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.NormalBlending,
  })
  const edgeSeg = new THREE.LineSegments(edgeGeo, edgeMat)
  edgeSeg.frustumCulled = false
  edgeSeg.renderOrder = 1
  edgeSeg.visible = false
  slot.points.add(edgeSeg)

  // — color field —
  const colorFieldData = new Uint8Array(CF_G * CF_G * 4)
  const colorTex = new THREE.DataTexture(colorFieldData, CF_G, CF_G)
  colorTex.minFilter = THREE.LinearFilter
  colorTex.magFilter = THREE.LinearFilter
  colorTex.colorSpace = THREE.NoColorSpace
  colorTex.needsUpdate = true

  // — gas cloud —
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:        { value: 0 },
      uOpacity:     { value: 0 },
      uScale:       { value: 1.1 },
      uContrast:    { value: 1.4 },
      uThreshold:   { value: 0.42 },
      uColDeep:     { value: COBALT_DEEP.clone() },
      uColLight:    { value: CLOUD_LIGHT.clone() },
      uColorTex:    { value: colorTex },
      uColorAmount: { value: 0.7 },
    },
    vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG,
    transparent: true, depthWrite: false, depthTest: false,
    side: THREE.DoubleSide, blending: THREE.NormalBlending,
  })
  const cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(CF_HW * 2, CF_HH * 2), cloudMat)
  cloudMesh.position.z = -0.2
  cloudMesh.renderOrder = -1
  cloudMesh.frustumCulled = false
  cloudMesh.visible = false
  slot.points.add(cloudMesh)

  return {
    dispX: new Float32Array(count),
    dispY: new Float32Array(count),
    edgeSeg,
    linkEase: 0,
    cfTemp: new Float32Array(CF_G * CF_G * 4),
    colorFieldData,
    colorTex,
    cloudMesh,
    gasFade: 0,
    cursorLocal: new THREE.Vector3(),
  }
}

/** Per-frame: project cursor → local, part the field, weave edges, drive cloud. */
export function updateFieldFx(slot: SlotInternal, t: number): void {
  const fx = slot.fx
  if (!fx) return
  const state = slot.state
  const interactive = slot.opts.interactive
  // Edges (the cursor-local link web) run on EVERY state — they're an overlay
  // that never moves particles, so they don't distort the recognizable shapes.
  // Parting + the gas cloud stay on the abstract FIELD states (constellation /
  // nebula) so the logo V, city, microprocessor, etc. aren't shoved around or
  // hidden behind gas.
  const fieldState = state === 'nebula' || state === 'constellation'
  // Master field opacity (0 during the intro + hidden chapters) gates the whole
  // FX layer, so no stray edges/cloud appear while the particles are hidden.
  const fieldOpacity = slot.uniforms.uOpacity.value

  // Project the pointer onto the field's z=0 plane, then into points-local space
  // (so parting/edges align with the visible, possibly rotated/scaled, field).
  if (interactive) {
    slot.camera.updateMatrixWorld()
    _ndc.set(slot.mouseTx, -slot.mouseTy, 0.5).unproject(slot.camera)
    _dir.copy(_ndc).sub(slot.camera.position).normalize()
    const tHit = (0 - slot.camera.position.z) / _dir.z
    _world.copy(slot.camera.position).addScaledVector(_dir, tHit)
    slot.points.updateWorldMatrix(true, false)
    fx.cursorLocal.copy(_world)
    slot.points.worldToLocal(fx.cursorLocal)
  }

  // — Cursor parting (ambient only). pos already holds the drifted home from
  //   applyStateBehavior; add the eased displacement on top. —
  const pos = slot.geo.getAttribute('position').array as Float32Array
  if (interactive && fieldState && fieldOpacity > 0.01) {
    const cx = fx.cursorLocal.x, cy = fx.cursorLocal.y
    const count = slot.count
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const ddx = pos[ix] - cx, ddy = pos[ix + 1] - cy
      const dd = Math.sqrt(ddx * ddx + ddy * ddy)
      let tdx = 0, tdy = 0
      if (dd < PART_RADIUS && dd > 1e-4) {
        const f = 1 - dd / PART_RADIUS
        const push = f * f * PART_STRENGTH
        tdx = (ddx / dd) * push; tdy = (ddy / dd) * push
      }
      fx.dispX[i] += (tdx - fx.dispX[i]) * 0.14
      fx.dispY[i] += (tdy - fx.dispY[i]) * 0.14
      pos[ix] += fx.dispX[i]; pos[ix + 1] += fx.dispY[i]
    }
    slot.geo.getAttribute('position').needsUpdate = true
  } else if (fx.dispX[0] !== 0 || fx.dispY[0] !== 0) {
    fx.dispX.fill(0); fx.dispY.fill(0)
  }

  // — Orchestration edges (every chapter) —
  const edgeTarget = interactive ? 1 : 0
  fx.linkEase += (edgeTarget - fx.linkEase) * 0.08
  const edgeMat = fx.edgeSeg.material as THREE.ShaderMaterial
  edgeMat.uniforms.uOpacity.value = LINK_OPACITY * fx.linkEase * fieldOpacity
  fx.edgeSeg.visible = fx.linkEase > 0.01 && fieldOpacity > 0.01
  if (fx.edgeSeg.visible) buildEdges(slot, fx, pos)

  // — Gas cloud (abstract field chapters: constellation + nebula) —
  const gasTarget = fieldState ? 1 : 0
  fx.gasFade += (gasTarget - fx.gasFade) * 0.04
  const cloudMat = fx.cloudMesh.material as THREE.ShaderMaterial
  cloudMat.uniforms.uOpacity.value = CLOUD_OPACITY * fx.gasFade * fieldOpacity
  cloudMat.uniforms.uTime.value = t * CLOUD_SPEED
  fx.cloudMesh.visible = fx.gasFade > 0.005 && fieldOpacity > 0.01
  if (fx.cloudMesh.visible) updateColorField(slot, fx, pos)
}

// Write a brightened copy of the particle color at `src` into the line-color
// buffer at `o`, so each edge endpoint takes its connected particle's hue.
function setEdgeColor(lc: Float32Array, o: number, col: Float32Array, src: number): void {
  lc[o]     = Math.min(1, col[src]     * EDGE_BRIGHTEN)
  lc[o + 1] = Math.min(1, col[src + 1] * EDGE_BRIGHTEN)
  lc[o + 2] = Math.min(1, col[src + 2] * EDGE_BRIGHTEN)
}

function buildEdges(slot: SlotInternal, fx: FieldFx, pos: Float32Array): void {
  const eg = fx.edgeSeg.geometry
  const lp = eg.getAttribute('position').array as Float32Array
  const lc = eg.getAttribute('color').array as Float32Array
  const la = eg.getAttribute('aLineAlpha').array as Float32Array
  const col = slot.geo.getAttribute('color').array as Float32Array
  const count = slot.count

  // SCREEN-SPACE proximity: project each particle through points→clip to NDC so
  // depth/offset/rotation/scale are all handled — the cursor lights up the
  // particles that are actually under it, not a flat-plane approximation.
  slot.camera.updateMatrixWorld()
  slot.points.updateWorldMatrix(true, false)
  _mvp.multiplyMatrices(slot.camera.projectionMatrix, slot.camera.matrixWorldInverse)
  _mvp.multiply(slot.points.matrixWorld)
  const aspect = slot.camera.aspect || 1
  const cnx = slot.mouseTx, cny = -slot.mouseTy
  const SR = 0.22, SR2 = SR * SR        // hover radius (NDC, aspect-corrected)
  const LD = 0.13, LD2 = LD * LD        // link distance (NDC)

  nearIdx.length = 0; nearDist.length = 0; nearNX.length = 0; nearNY.length = 0
  for (let i = 0; i < count && nearIdx.length < LINK_NODE_CAP; i++) {
    const ix = i * 3
    _p.set(pos[ix], pos[ix + 1], pos[ix + 2]).applyMatrix4(_mvp)
    if (_p.z < -1 || _p.z > 1) continue   // outside the frustum depth range
    const sx = (_p.x - cnx) * aspect, sy = _p.y - cny
    const d2 = sx * sx + sy * sy
    if (d2 < SR2) { nearIdx.push(i); nearDist.push(Math.sqrt(d2)); nearNX.push(_p.x); nearNY.push(_p.y) }
  }

  let seg = 0
  const m = nearIdx.length
  let ccx = 0, ccy = 0, ccz = 0   // local centroid of the hovered cluster (hub anchor)
  for (let a = 0; a < m && seg < MAX_SEG; a++) {
    const pa = nearIdx[a] * 3
    const ax = pos[pa], ay = pos[pa + 1], az = pos[pa + 2]
    ccx += ax; ccy += ay; ccz += az
    const aFade = 1 - nearDist[a] / SR
    for (let b = a + 1; b < m && seg < MAX_SEG; b++) {
      const sx = (nearNX[a] - nearNX[b]) * aspect, sy = nearNY[a] - nearNY[b]
      const d2 = sx * sx + sy * sy
      if (d2 > LD2) continue
      const pb = nearIdx[b] * 3
      const dFade = 1 - Math.sqrt(d2) / LD
      const bFade = 1 - nearDist[b] / SR
      const o = seg * 6, va = seg * 2
      lp[o] = ax; lp[o + 1] = ay; lp[o + 2] = az
      lp[o + 3] = pos[pb]; lp[o + 4] = pos[pb + 1]; lp[o + 5] = pos[pb + 2]
      // Each end takes its particle's color → blue↔orange links blend midway.
      setEdgeColor(lc, o, col, pa)
      setEdgeColor(lc, o + 3, col, pb)
      la[va] = aFade * dFade; la[va + 1] = bFade * dFade
      seg++
    }
  }

  // Hub "reach" lines from the hovered cluster's local centroid to its nearest
  // nodes (anchoring at the centroid, not a flat-projected cursor, keeps them
  // aligned on depth structures). Each line takes its node's color.
  if (m > 0) {
    ccx /= m; ccy /= m; ccz /= m
    const order = nearIdx.map((_, k) => k).sort((p, q) => nearDist[p] - nearDist[q])
    const hubCount = Math.min(6, order.length)
    for (let h = 0; h < hubCount && seg < MAX_SEG; h++) {
      const ni = order[h], pn = nearIdx[ni] * 3
      const fade = (1 - nearDist[ni] / SR) * 0.7
      const o = seg * 6, va = seg * 2
      lp[o] = ccx; lp[o + 1] = ccy; lp[o + 2] = ccz
      lp[o + 3] = pos[pn]; lp[o + 4] = pos[pn + 1]; lp[o + 5] = pos[pn + 2]
      setEdgeColor(lc, o, col, pn)
      setEdgeColor(lc, o + 3, col, pn)
      la[va] = fade * 0.5; la[va + 1] = fade * 0.9
      seg++
    }
  }

  eg.setDrawRange(0, seg * 2)
  eg.getAttribute('position').needsUpdate = true
  eg.getAttribute('color').needsUpdate = true
  eg.getAttribute('aLineAlpha').needsUpdate = true
}

/** Splat particle colors into the 48×48 field (avg + coverage, weighted blur). */
function updateColorField(slot: SlotInternal, fx: FieldFx, pos: Float32Array): void {
  const col = slot.geo.getAttribute('color').array as Float32Array
  const tmp = fx.cfTemp
  const out = fx.colorFieldData
  tmp.fill(0)
  const count = slot.count
  for (let i = 0; i < count; i++) {
    const ix = i * 3
    const u = (pos[ix] / CF_HW) * 0.5 + 0.5
    const v = (pos[ix + 1] / CF_HH) * 0.5 + 0.5
    if (u < 0 || u > 1 || v < 0 || v > 1) continue
    const cx = Math.min(CF_G - 1, (u * CF_G) | 0)
    const cy = Math.min(CF_G - 1, (v * CF_G) | 0)
    const ci = (cy * CF_G + cx) * 4
    tmp[ci] += col[ix]; tmp[ci + 1] += col[ix + 1]; tmp[ci + 2] += col[ix + 2]; tmp[ci + 3] += 1
  }
  for (let cy = 0; cy < CF_G; cy++) {
    for (let cx = 0; cx < CF_G; cx++) {
      let sr = 0, sg = 0, sb = 0, sw = 0
      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy; if (ny < 0 || ny >= CF_G) continue
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx; if (nx < 0 || nx >= CF_G) continue
          const ni = (ny * CF_G + nx) * 4
          const w = tmp[ni + 3]
          if (w > 0) { sr += tmp[ni]; sg += tmp[ni + 1]; sb += tmp[ni + 2]; sw += w }
        }
      }
      const oi = (cy * CF_G + cx) * 4
      if (sw > 0) {
        out[oi]     = Math.min(255, Math.round((sr / sw) * 255))
        out[oi + 1] = Math.min(255, Math.round((sg / sw) * 255))
        out[oi + 2] = Math.min(255, Math.round((sb / sw) * 255))
        out[oi + 3] = Math.min(255, Math.round((1 - Math.exp(-sw * 0.5)) * 255))
      } else {
        out[oi] = out[oi + 1] = out[oi + 2] = out[oi + 3] = 0
      }
    }
  }
  fx.colorTex.needsUpdate = true
}
