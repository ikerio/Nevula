/* =============================================================================
 * NEVULA — Particle Field Prototype
 * -----------------------------------------------------------------------------
 * Self-contained sandbox for evaluating particle-system upgrades WITHOUT
 * touching the production engine (src/engine/*). It faithfully reuses the live
 * visual language — same brand palette, same silver page bg, same point-size
 * attenuation, same FogExp2 mix, same ACES + bloom post-FX params — and layers
 * the proposed "wow" features on top:
 *
 *   1. Shader glow      — two-zone dot (crisp core + exponential halo) with
 *                         fwidth anti-aliasing and per-particle twinkle.
 *   2. Curl-noise drift — divergence-free flow field warps each particle around
 *                         its home position (organic, "alive"), vs. the classic
 *                         per-axis sine drift the production engine ships today.
 *   3. Cursor parting   — the field eases away from the pointer with inertia.
 *   4. Orchestration    — live azul links weave between nodes near the cursor;
 *      links              faint orange "hub" lines reach from the cursor to the
 *                         closest nodes (the brand's orchestration metaphor).
 *
 * Run:  npm run dev   →   open  /proto/particles.html
 * Once a look is locked here, the winning params/shaders get promoted into
 * src/engine (materials.ts, shaders/, behaviors/per-state-update.ts).
 * ========================================================================== */

import * as THREE from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ToneMappingEffect,
  ToneMappingMode,
  KernelSize,
} from 'postprocessing'

// ── Brand palette (verbatim from src/engine/colors.ts) ──────────────────────
const COBALT      = new THREE.Color('#1a5fb4')  // mid brand-blue
const COBALT_DEEP = new THREE.Color('#00529c')  // official azul
const ORANGE      = new THREE.Color('#ff6600')  // official naranja
const ORANGE_SOFT = new THREE.Color('#ffa566')
const INK         = new THREE.Color('#1a2240')  // "white" tier → ink on silver
const FOG_COLOR   = new THREE.Color('#e6e8ef')  // --bg-base

// ── Tunable parameters (wired to the panel) ─────────────────────────────────
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const params = {
  count: 3500,
  state: 'nebula' as 'nebula' | 'constellation',
  drift: 'curl' as 'curl' | 'sine',

  curlFreq: 0.85,
  curlAmp: reduceMotion ? 0.02 : 0.075,
  curlSpeed: reduceMotion ? 0.02 : 0.06,

  cursorRadius: 0.25,
  cursorStrength: 0.12,

  linkRadius: 0.58,
  linkDist: 0.3,
  linkOpacity: 0.9,

  glow: 0.6,
  twinkle: reduceMotion ? 0 : 0.5,

  // Nebula gas cloud — procedural fbm plane behind the field (nebula only).
  cloud: true,
  cloudOpacity: 0.35,
  cloudScale: 1.1,        // noise frequency — bigger = finer wisps
  cloudContrast: 1.4,     // vein/gap contrast
  cloudThreshold: 0.42,   // density cutoff — higher = wispier, more clean gaps
  cloudTint: 0.7,         // how strongly the cloud adopts local particle color
  cloudSpeed: reduceMotion ? 0.01 : 0.03,

  bloom: 0.55,
  size: 0.03,
  paused: false,
}

// =============================================================================
// 3D simplex noise (Stefan Gustavson) — used to build the curl flow field.
// =============================================================================
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
  for (let i = 255; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const t = p[i]; p[i] = p[j]; p[j] = t
  }
  for (let i = 0; i < 512; i++) {
    _perm[i] = p[i & 255]
    _permMod12[i] = _perm[i] % 12
  }
})()

const F3 = 1 / 3
const G3 = 1 / 6
function snoise(x: number, y: number, z: number): number {
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

// Curl of a 3-channel noise potential (Bridson). Divergence-free → particles
// swirl along streamlines instead of converging/exploding. Three decorrelated
// potential fields via large coordinate offsets; partials via central diff.
const E = 0.09
const _curl = new THREE.Vector3()
function curlNoise(x: number, y: number, z: number): THREE.Vector3 {
  const p1 = (a: number, b: number, c: number) => snoise(a, b, c)
  const p2 = (a: number, b: number, c: number) => snoise(a + 31.41, b + 17.0, c - 7.3)
  const p3 = (a: number, b: number, c: number) => snoise(a - 19.7, b - 4.2, c + 23.1)
  const dp3dy = (p3(x, y + E, z) - p3(x, y - E, z)) / (2 * E)
  const dp2dz = (p2(x, y, z + E) - p2(x, y, z - E)) / (2 * E)
  const dp1dz = (p1(x, y, z + E) - p1(x, y, z - E)) / (2 * E)
  const dp3dx = (p3(x + E, y, z) - p3(x - E, y, z)) / (2 * E)
  const dp2dx = (p2(x + E, y, z) - p2(x - E, y, z)) / (2 * E)
  const dp1dy = (p1(x, y + E, z) - p1(x, y - E, z)) / (2 * E)
  _curl.set(dp3dy - dp2dz, dp1dz - dp3dx, dp2dx - dp1dy)
  return _curl
}

// =============================================================================
// State generators (copied from src/engine/states/{nebula,constellation}.ts)
// =============================================================================
function genNebula(count: number): Float32Array {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const cluster = Math.random()
    let cx = 0, cy = 0, cz = 0, r = 1
    if (cluster < 0.55)      { cx = 0;    cy = 0;     cz = 0;    r = 1.05 }
    else if (cluster < 0.78) { cx = 0.5;  cy = 0.25;  cz = -0.2; r = 0.45 }
    else if (cluster < 0.92) { cx = -0.5; cy = -0.25; cz = 0.2;  r = 0.4  }
    else { cx = (Math.random() - 0.5) * 1.4; cy = (Math.random() - 0.5) * 1.4; cz = (Math.random() - 0.5) * 0.4; r = 0.2 }
    const g  = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
    const g2 = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
    const g3 = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
    arr[i * 3]     = cx + g  * r * 0.55
    arr[i * 3 + 1] = cy + g2 * r * 0.55
    arr[i * 3 + 2] = cz + g3 * r * 0.35
  }
  return arr
}

function genConstellation(count: number): Float32Array {
  const arr = new Float32Array(count * 3)
  const dim = Math.ceil(Math.cbrt(count))
  let i = 0
  for (let x = 0; x < dim && i < count; x++)
    for (let y = 0; y < dim && i < count; y++)
      for (let z = 0; z < dim && i < count; z++) {
        if (i >= count) break
        const nx = (x / (dim - 1) - 0.5) * 1.7
        const ny = (y / (dim - 1) - 0.5) * 1.7
        const nz = (z / (dim - 1) - 0.5) * 0.6
        const jit = 0.04
        arr[i * 3]     = nx + (Math.random() - 0.5) * jit
        arr[i * 3 + 1] = ny + (Math.random() - 0.5) * jit
        arr[i * 3 + 2] = nz + (Math.random() - 0.5) * jit
        i++
      }
  for (; i < count; i++) {
    const a = Math.random() * Math.PI * 2
    const ph = Math.acos(2 * Math.random() - 1)
    const r = 0.9 + Math.random() * 0.2
    arr[i * 3]     = r * Math.sin(ph) * Math.cos(a)
    arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(a)
    arr[i * 3 + 2] = r * Math.cos(ph) * 0.4
  }
  return arr
}

function genState(state: typeof params.state, count: number): Float32Array {
  return state === 'constellation' ? genConstellation(count) : genNebula(count)
}

function colorsFor(state: typeof params.state, count: number, pos: Float32Array): Float32Array {
  const c = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    let col: THREE.Color
    if (state === 'constellation') {
      const r = Math.random()
      col = r < 0.86 ? COBALT : (r < 0.98 ? INK : ORANGE)
    } else {
      // Nebula: bias orange into low-frequency "warm zones" (a noise field over
      // position) so there are real cool/warm regions — which the gas cloud
      // then samples and mirrors — instead of evenly-sprinkled orange.
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]
      const warm = snoise(x * 1.2 + 11.0, y * 1.2 - 4.0, z * 1.2)   // [-1, 1]
      const pOrange = 0.05 + Math.max(0, warm - 0.15) * 0.85
      if (Math.random() < pOrange) col = Math.random() < 0.65 ? ORANGE : ORANGE_SOFT
      else                          col = Math.random() < 0.78 ? COBALT_DEEP : COBALT
    }
    c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b
  }
  return c
}

const CLOUD_LIGHT = new THREE.Color('#5b9be0')   // lighter azul vein highlight

// =============================================================================
// Shaders
// =============================================================================
// three injects `attribute vec3 color;` + precision for ShaderMaterial when
// vertexColors is true — matches src/engine/materials.ts, so we don't redeclare.
const POINT_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  attribute float aAlpha;
  varying vec3 vColor;
  varying float vFogDepth;
  varying float vAlpha;
  varying float vTw;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uTime;
  uniform float uTwinkle;
  void main() {
    vColor = color;
    vAlpha = aAlpha;
    // Per-particle scintillation — individual phase + rate via the seed.
    float tw = 0.5 + 0.5 * sin(uTime * (0.7 + aSeed * 1.7) + aSeed * 6.2831);
    vTw = mix(1.0, tw, uTwinkle);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -mv.z;
    // Twinkle nudges size a touch too, so highlights "breathe".
    float sizeMul = mix(1.0, 0.78 + 0.44 * tw, uTwinkle);
    gl_PointSize = uSize * aSize * sizeMul * uPixelRatio * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`

const POINT_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vFogDepth;
  varying float vAlpha;
  varying float vTw;
  uniform float uOpacity;
  uniform vec3  uFogColor;
  uniform float uFogDensity;
  uniform float uGlow;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;
    // Crisp opaque body with screen-space-derivative AA on the rim — keeps
    // small dots sharp even with antialias:false on the renderer.
    float aa = fwidth(d) * 1.4;
    float body = 1.0 - smoothstep(0.30 - aa, 0.30 + aa, d);
    body = pow(body, 0.55);
    // Soft exponential halo gives each particle its own light, so we can lean
    // less on bloom (which otherwise clips bright clusters to peach/white).
    float halo = exp(-d * 6.5) * uGlow;
    float a = (body + halo) * uOpacity * vAlpha * vTw;
    a = clamp(a, 0.0, 1.0);
    // FogExp2 toward silver by depth (matches the live engine).
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
    vec3 col = mix(vColor, uFogColor, fog);
    gl_FragColor = vec4(col, a);
  }
`

const LINE_VERT = /* glsl */ `
  attribute float aLineAlpha;
  varying vec3 vColor;
  varying float vA;
  void main() {
    vColor = color;
    vA = aLineAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// Per-vertex alpha lives in the shader (NOT premultiplied into vertex color) —
// the live engine's note: alpha-in-vertex-color on a LineBasicMaterial renders
// BLACK at alpha 0. A custom shader sidesteps that entirely.
const LINE_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vA;
  uniform float uOpacity;
  void main() { gl_FragColor = vec4(vColor, vA * uOpacity); }
`

// Gas puff — a big, very soft sprite. The gaussian core × circular mask reads
// as billowing volume; many overlapping puffs sum into a continuous cloud.
// Nebula gas — a plane running domain-warped fbm simplex noise. The fractal
// structure (bright veins + clean gaps) is what reads as gas; the gaps keep
// the silver page visible so it never becomes a uniform smudge.
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
    // Domain warp → curdled, smoky filaments instead of smooth blobs.
    vec3 q = vec3(fbm(sp), fbm(sp + 3.1), fbm(sp + 7.4));
    float dens = fbm(sp + 1.8 * q) * 0.5 + 0.5;
    // Contrast: cut gaps to fully transparent so the silver shows through.
    dens = smoothstep(uThreshold, 1.0, dens);
    dens = pow(dens, uContrast);
    // Contain it as a soft blob (no hard plane edges).
    float mask = smoothstep(1.0, 0.25, length(vUv));
    float a = dens * mask * uOpacity;
    // Tint by the local particle color (orange zones → orange gas), falling
    // back to the azul gradient where there are no particles (coverage → 0).
    vec3 azul = mix(uColDeep, uColLight, dens);
    vec4 field = texture2D(uColorTex, vUv * 0.5 + 0.5);
    vec3 col = mix(azul, field.rgb, clamp(field.a * uColorAmount, 0.0, 1.0));
    gl_FragColor = vec4(col, a);
  }
`

// =============================================================================
// Scene / renderer / post-FX
// =============================================================================
const canvas = document.getElementById('field') as HTMLCanvasElement
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
renderer.setClearColor(0x000000, 0)
const DPR = Math.min(window.devicePixelRatio, 2)
renderer.setPixelRatio(DPR)
renderer.setSize(window.innerWidth, window.innerHeight, false)

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50)
camera.position.z = 3.4

// Post-FX: RenderPass → Bloom → ACES filmic (same chain & params as post-fx.ts).
const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new BloomEffect({
  intensity: params.bloom,
  luminanceThreshold: 0.10,
  luminanceSmoothing: 0.40,
  kernelSize: KernelSize.MEDIUM,
  mipmapBlur: true,
})
composer.addPass(new EffectPass(camera, bloom, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })))
composer.setSize(window.innerWidth, window.innerHeight)

const pointUniforms = {
  uSize:       { value: params.size * 520 },
  uPixelRatio: { value: DPR },
  uOpacity:    { value: 1.0 },
  uTime:       { value: 0 },
  uTwinkle:    { value: params.twinkle },
  uGlow:       { value: params.glow },
  uFogColor:   { value: FOG_COLOR.clone() },
  uFogDensity: { value: 0.05 },
}
const lineUniforms = { uOpacity: { value: 1.0 } }

const pointMat = new THREE.ShaderMaterial({
  uniforms: pointUniforms as any,
  vertexShader: POINT_VERT,
  fragmentShader: POINT_FRAG,
  transparent: true,
  depthWrite: false,
  vertexColors: true,
  blending: THREE.NormalBlending,
})
const lineMat = new THREE.ShaderMaterial({
  uniforms: lineUniforms as any,
  vertexShader: LINE_VERT,
  fragmentShader: LINE_FRAG,
  transparent: true,
  depthWrite: false,
  vertexColors: true,
  blending: THREE.NormalBlending,
})

// ── Particle color field ───────────────────────────────────────────────────
// Coarse texture recording the average particle color across the field, so the
// gas cloud can tint itself by where the blue vs. orange particles actually are.
const CF_G = 48
const cfTemp = new Float32Array(CF_G * CF_G * 4)        // per-cell sum(rgb) + count
const colorFieldData = new Uint8Array(CF_G * CF_G * 4)  // smoothed rgb + coverage(a)
const colorTex = new THREE.DataTexture(colorFieldData, CF_G, CF_G)
colorTex.minFilter = THREE.LinearFilter
colorTex.magFilter = THREE.LinearFilter
colorTex.colorSpace = THREE.NoColorSpace
colorTex.needsUpdate = true
const CF_HW = 2.3, CF_HH = 1.7   // must match the cloud PlaneGeometry half-extents

const cloudUniforms = {
  uTime:        { value: 0 },
  uOpacity:     { value: 0 },             // driven by gasFade each frame
  uScale:       { value: params.cloudScale },
  uContrast:    { value: params.cloudContrast },
  uThreshold:   { value: params.cloudThreshold },
  uColDeep:     { value: COBALT_DEEP.clone() },
  uColLight:    { value: CLOUD_LIGHT.clone() },
  uColorTex:    { value: colorTex },
  uColorAmount: { value: params.cloudTint },
}
const cloudMat = new THREE.ShaderMaterial({
  uniforms: cloudUniforms as any,
  vertexShader: CLOUD_VERT,
  fragmentShader: CLOUD_FRAG,
  transparent: true,
  depthWrite: false,
  depthTest: false,                       // pure background — never z-fights
  side: THREE.DoubleSide,
  // NormalBlending: on a near-white page additive blows continuous coverage to
  // white, so the cloud reads by gentle darkening in the filaments (blue smoke).
  blending: THREE.NormalBlending,
})

// =============================================================================
// Field state (rebuilt when the particle count changes)
// =============================================================================
const MAX_SEG = 900            // link-segment capacity
const LINK_NODE_CAP = 90       // max particles considered "near cursor" per frame

let geo!: THREE.BufferGeometry
let points!: THREE.Points
let lineGeo!: THREE.BufferGeometry
let lineSeg!: THREE.LineSegments

let base!: Float32Array        // current home (lerped during morph)
let baseTarget!: Float32Array  // home target for the active state
let colArr!: Float32Array      // current color (lerped)
let colTarget!: Float32Array   // color target
let dispX!: Float32Array       // eased cursor displacement, X
let dispY!: Float32Array       // eased cursor displacement, Y
let posArr!: Float32Array      // geometry position attribute (final, written each frame)
let morphing = false

// Gas-cloud layer (procedural fbm plane, independent of the particle field).
let cloudMesh!: THREE.Mesh
let gasFade = 0                // eased nebula-state visibility (0 in constellation)

function buildField(count: number) {
  if (points) { scene.remove(points); geo.dispose() }
  if (lineSeg) { scene.remove(lineSeg); lineGeo.dispose() }

  base = genState(params.state, count)
  baseTarget = base.slice()
  colArr = colorsFor(params.state, count, base)
  colTarget = colArr.slice()
  dispX = new Float32Array(count)
  dispY = new Float32Array(count)
  posArr = base.slice()

  const sizes = new Float32Array(count)
  const seeds = new Float32Array(count)
  const alphas = new Float32Array(count)
  for (let i = 0; i < count; i++) {
    sizes[i] = 0.6 + Math.random() * 1.6
    seeds[i] = Math.random()
    alphas[i] = 1
  }

  geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
  points = new THREE.Points(geo, pointMat)
  points.frustumCulled = false
  scene.add(points)

  // Link layer — preallocated to MAX_SEG segments (2 verts each).
  lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2 * 3), 3))
  lineGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2 * 3), 3))
  lineGeo.setAttribute('aLineAlpha', new THREE.BufferAttribute(new Float32Array(MAX_SEG * 2), 1))
  lineGeo.setDrawRange(0, 0)
  lineSeg = new THREE.LineSegments(lineGeo, lineMat)
  lineSeg.frustumCulled = false
  scene.add(lineSeg)
}

function buildCloud() {
  if (cloudMesh) return
  // Plane sized to cover the central nebula region; the radial mask in the
  // shader fades the cloud out before the plane edges so there's no hard border.
  cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.4), cloudMat)
  cloudMesh.position.z = -0.2  // just behind the particle clusters
  cloudMesh.renderOrder = -2   // behind the particles + links
  cloudMesh.frustumCulled = false
  scene.add(cloudMesh)
}

// Splat current particle colors into the coarse color field (avg per cell +
// coverage), with a weighted 3×3 blur so the cloud tint is smooth. Cheap: one
// O(n) pass over particles + an O(G²·9) blur, uploaded as a 48×48 texture.
function updateColorField() {
  cfTemp.fill(0)
  const count = base.length / 3
  for (let i = 0; i < count; i++) {
    const ix = i * 3
    const u = (posArr[ix] / CF_HW) * 0.5 + 0.5
    const v = (posArr[ix + 1] / CF_HH) * 0.5 + 0.5
    if (u < 0 || u > 1 || v < 0 || v > 1) continue
    const cx = Math.min(CF_G - 1, (u * CF_G) | 0)
    const cy = Math.min(CF_G - 1, (v * CF_G) | 0)
    const ci = (cy * CF_G + cx) * 4
    cfTemp[ci]     += colArr[ix]
    cfTemp[ci + 1] += colArr[ix + 1]
    cfTemp[ci + 2] += colArr[ix + 2]
    cfTemp[ci + 3] += 1
  }
  for (let cy = 0; cy < CF_G; cy++) {
    for (let cx = 0; cx < CF_G; cx++) {
      let sr = 0, sg = 0, sb = 0, sw = 0
      for (let dy = -1; dy <= 1; dy++) {
        const ny = cy + dy; if (ny < 0 || ny >= CF_G) continue
        for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx; if (nx < 0 || nx >= CF_G) continue
          const ni = (ny * CF_G + nx) * 4
          const w = cfTemp[ni + 3]
          if (w > 0) { sr += cfTemp[ni]; sg += cfTemp[ni + 1]; sb += cfTemp[ni + 2]; sw += w }
        }
      }
      const oi = (cy * CF_G + cx) * 4
      if (sw > 0) {
        colorFieldData[oi]     = Math.min(255, Math.round((sr / sw) * 255))
        colorFieldData[oi + 1] = Math.min(255, Math.round((sg / sw) * 255))
        colorFieldData[oi + 2] = Math.min(255, Math.round((sb / sw) * 255))
        colorFieldData[oi + 3] = Math.min(255, Math.round((1 - Math.exp(-sw * 0.5)) * 255))
      } else {
        colorFieldData[oi] = colorFieldData[oi + 1] = colorFieldData[oi + 2] = colorFieldData[oi + 3] = 0
      }
    }
  }
  colorTex.needsUpdate = true
}

function morphTo(state: typeof params.state) {
  params.state = state
  baseTarget = genState(state, base.length / 3)
  colTarget = colorsFor(state, base.length / 3, baseTarget)
  morphing = true
}

// =============================================================================
// Cursor → world position (projected onto the z = 0 plane)
// =============================================================================
const cursorWorld = new THREE.Vector3()
let hasCursor = false
let linkEase = 0  // global fade-in for the link layer when the cursor is present

const _ray = new THREE.Vector3()
function updateCursorWorld(clientX: number, clientY: number) {
  const ndcX = (clientX / window.innerWidth) * 2 - 1
  const ndcY = -(clientY / window.innerHeight) * 2 + 1
  _ray.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize()
  const tHit = (0 - camera.position.z) / _ray.z
  cursorWorld.copy(camera.position).add(_ray.multiplyScalar(tHit))
}
window.addEventListener('pointermove', e => { hasCursor = true; updateCursorWorld(e.clientX, e.clientY) }, { passive: true })
document.addEventListener('pointerleave', () => { hasCursor = false })
window.addEventListener('blur', () => { hasCursor = false })

// =============================================================================
// Animation loop
// =============================================================================
const clock = new THREE.Clock()
let fpsAccum = 0, fpsFrames = 0, fpsEl: HTMLElement | null = null

// Edges stay strictly in the azul family — bright enough to read clearly and
// bloom on the silver bg, no warm accent (the orange clashed with the palette).
const AZUL_LINK = new THREE.Color('#3f86d8')   // node↔node web — bright cobalt
const HUB_LINK  = new THREE.Color('#6aa6e6')   // cursor "reach" lines — lighter azul
const nearIdx: number[] = []
const nearDist: number[] = []

function frame() {
  requestAnimationFrame(frame)
  const dt = Math.min(clock.getDelta(), 0.05)
  const t = clock.elapsedTime
  if (params.paused) { composer.render(dt); return }

  pointUniforms.uTime.value = t
  const count = base.length / 3
  const freq = params.curlFreq
  const amp = params.curlAmp
  const flow = t * params.curlSpeed
  const useCurl = params.drift === 'curl'

  // Morph easing (positions 8%/frame, colors 5%/frame) — mirrors slot.ts.
  let stillMorphing = false
  if (morphing) {
    for (let k = 0; k < count * 3; k++) {
      base[k] += (baseTarget[k] - base[k]) * 0.08
      if (Math.abs(baseTarget[k] - base[k]) > 0.001) stillMorphing = true
      colArr[k] += (colTarget[k] - colArr[k]) * 0.05
    }
    geo.getAttribute('color').needsUpdate = true
    if (!stillMorphing) { base.set(baseTarget); colArr.set(colTarget); morphing = false }
  }

  // Cursor force field (eased) + drift → final positions.
  const R = params.cursorRadius, STR = params.cursorStrength
  const active = hasCursor ? 1 : 0
  const cx = cursorWorld.x, cy = cursorWorld.y
  for (let i = 0; i < count; i++) {
    const ix = i * 3
    const hx = base[ix], hy = base[ix + 1], hz = base[ix + 2]

    // Drift around home.
    let wx = hx, wy = hy, wz = hz
    if (useCurl) {
      const v = curlNoise(hx * freq + flow, hy * freq, hz * freq + flow * 0.6)
      wx += v.x * amp; wy += v.y * amp; wz += v.z * amp * 0.5
    } else {
      // Classic per-axis sine (what the production engine ships today).
      wx += Math.sin(t * 0.18 + i * 0.04) * (amp * 0.9)
      wy += Math.cos(t * 0.22 + i * 0.05) * (amp * 0.8)
      wz += Math.sin(t * 0.16 + i * 0.03) * (amp * 0.6)
    }

    // Cursor parting — tight radius, gentle radial push w/ quadratic falloff,
    // eased for inertia.
    let tdx = 0, tdy = 0
    if (active) {
      const ddx = wx - cx, ddy = wy - cy
      const dd = Math.sqrt(ddx * ddx + ddy * ddy)
      if (dd < R && dd > 1e-4) {
        const f = 1 - dd / R
        const push = f * f * STR
        tdx = (ddx / dd) * push
        tdy = (ddy / dd) * push
      }
    }
    dispX[i] += (tdx - dispX[i]) * 0.14
    dispY[i] += (tdy - dispY[i]) * 0.14

    posArr[ix] = wx + dispX[i]
    posArr[ix + 1] = wy + dispY[i]
    posArr[ix + 2] = wz
  }
  geo.getAttribute('position').needsUpdate = true

  // ── Nebula gas cloud — fbm plane, faded in only for the nebula state. The
  //    noise field evolves over time (uTime) so it billows. ──────────────────
  const gasTarget = params.cloud && params.state === 'nebula' ? 1 : 0
  gasFade += (gasTarget - gasFade) * 0.04
  cloudUniforms.uOpacity.value = params.cloudOpacity * gasFade
  cloudUniforms.uTime.value = t * params.cloudSpeed
  if (gasFade > 0.005) updateColorField()

  // ── Orchestration links — only around the cursor neighborhood ─────────────
  linkEase += ((hasCursor ? 1 : 0) - linkEase) * 0.08
  buildLinks(count)

  composer.render(dt)

  // FPS readout.
  fpsAccum += dt; fpsFrames++
  if (fpsAccum >= 0.5 && fpsEl) {
    fpsEl.textContent = `${Math.round(fpsFrames / fpsAccum)} fps · ${count.toLocaleString()} pts`
    fpsAccum = 0; fpsFrames = 0
  }
}

function buildLinks(count: number) {
  const lp = lineGeo.getAttribute('position').array as Float32Array
  const lc = lineGeo.getAttribute('color').array as Float32Array
  const la = lineGeo.getAttribute('aLineAlpha').array as Float32Array
  lineUniforms.uOpacity.value = params.linkOpacity * linkEase

  if (linkEase < 0.01 || !hasCursor) { lineGeo.setDrawRange(0, 0); return }

  const cx = cursorWorld.x, cy = cursorWorld.y
  const LR = params.linkRadius, LR2 = LR * LR
  const LD = params.linkDist, LD2 = LD * LD

  // O(n) scan: collect particles whose final position is near the cursor (XY).
  nearIdx.length = 0; nearDist.length = 0
  for (let i = 0; i < count && nearIdx.length < LINK_NODE_CAP; i++) {
    const ix = i * 3
    const dx = posArr[ix] - cx, dy = posArr[ix + 1] - cy
    const d2 = dx * dx + dy * dy
    if (d2 < LR2) { nearIdx.push(i); nearDist.push(Math.sqrt(d2)) }
  }

  let seg = 0
  const m = nearIdx.length
  // Node↔node links (azul). Alpha at each end fades with cursor distance, so
  // the web is densest at the pointer and dissolves at the radius edge.
  for (let a = 0; a < m && seg < MAX_SEG; a++) {
    const ia = nearIdx[a], pa = ia * 3
    const ax = posArr[pa], ay = posArr[pa + 1], az = posArr[pa + 2]
    const aFade = 1 - nearDist[a] / LR
    for (let b = a + 1; b < m && seg < MAX_SEG; b++) {
      const ib = nearIdx[b], pb = ib * 3
      const bx = posArr[pb], by = posArr[pb + 1], bz = posArr[pb + 2]
      const dx = ax - bx, dy = ay - by, dz = az - bz
      const d2 = dx * dx + dy * dy + dz * dz
      if (d2 > LD2) continue
      const dFade = 1 - Math.sqrt(d2) / LD
      const bFade = 1 - nearDist[b] / LR
      const o = seg * 6, va = seg * 2
      lp[o] = ax; lp[o + 1] = ay; lp[o + 2] = az
      lp[o + 3] = bx; lp[o + 4] = by; lp[o + 5] = bz
      lc[o] = AZUL_LINK.r; lc[o + 1] = AZUL_LINK.g; lc[o + 2] = AZUL_LINK.b
      lc[o + 3] = AZUL_LINK.r; lc[o + 4] = AZUL_LINK.g; lc[o + 5] = AZUL_LINK.b
      la[va] = aFade * dFade
      la[va + 1] = bFade * dFade
      seg++
    }
  }

  // Hub lines (soft orange) — cursor reaches to its nearest few nodes. This is
  // the literal "orchestration" read: a controller wiring up what's around it.
  const order = nearIdx.map((_, k) => k).sort((p, q) => nearDist[p] - nearDist[q])
  const hubCount = Math.min(6, order.length)
  for (let h = 0; h < hubCount && seg < MAX_SEG; h++) {
    const ni = order[h], pn = nearIdx[ni] * 3
    const fade = (1 - nearDist[ni] / LR) * 0.7
    const o = seg * 6, va = seg * 2
    lp[o] = cx; lp[o + 1] = cy; lp[o + 2] = 0
    lp[o + 3] = posArr[pn]; lp[o + 4] = posArr[pn + 1]; lp[o + 5] = posArr[pn + 2]
    lc[o] = HUB_LINK.r; lc[o + 1] = HUB_LINK.g; lc[o + 2] = HUB_LINK.b
    lc[o + 3] = HUB_LINK.r; lc[o + 4] = HUB_LINK.g; lc[o + 5] = HUB_LINK.b
    la[va] = fade * 0.9
    la[va + 1] = fade * 0.25
    seg++
  }

  lineGeo.setDrawRange(0, seg * 2)
  lineGeo.getAttribute('position').needsUpdate = true
  lineGeo.getAttribute('color').needsUpdate = true
  lineGeo.getAttribute('aLineAlpha').needsUpdate = true
}

// =============================================================================
// Resize
// =============================================================================
window.addEventListener('resize', () => {
  const W = window.innerWidth, H = window.innerHeight
  renderer.setSize(W, H, false)
  composer.setSize(W, H)
  camera.aspect = W / H
  camera.updateProjectionMatrix()
})

// =============================================================================
// Control panel
// =============================================================================
function buildPanel() {
  const panel = document.getElementById('panel')!
  const slider = (
    label: string, key: keyof typeof params, min: number, max: number, step: number,
    fmt: (v: number) => string = v => v.toFixed(2), onInput?: (v: number) => void,
  ) => {
    const row = document.createElement('div'); row.className = 'row'
    const lab = document.createElement('label')
    const val = document.createElement('span'); val.className = 'v'; val.textContent = fmt(params[key] as number)
    lab.append(document.createTextNode(label), val)
    const inp = document.createElement('input')
    inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step)
    inp.value = String(params[key])
    inp.addEventListener('input', () => {
      const v = parseFloat(inp.value);(params[key] as number) = v; val.textContent = fmt(v); onInput?.(v)
    })
    row.append(lab, inp); panel.append(row)
  }
  const groupLabel = (txt: string) => { const d = document.createElement('div'); d.className = 'group-label'; d.textContent = txt; panel.append(d) }
  const segmented = (label: string, options: string[], current: string, onPick: (o: string) => void) => {
    groupLabel(label)
    const seg = document.createElement('div'); seg.className = 'seg'
    options.forEach(o => {
      const b = document.createElement('button'); b.textContent = o
      if (o.toLowerCase() === current) b.classList.add('on')
      b.addEventListener('click', () => { seg.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); onPick(o.toLowerCase()) })
      seg.append(b)
    })
    panel.append(seg)
  }

  const h = document.createElement('h3'); h.textContent = 'Field controls'; panel.append(h)

  segmented('Shape', ['Nebula', 'Constellation'], params.state, o => morphTo(o as typeof params.state))
  segmented('Drift', ['Curl', 'Sine'], params.drift, o => { params.drift = o as typeof params.drift })

  groupLabel('Drift')
  slider('Flow scale', 'curlFreq', 0.2, 2.5, 0.01)
  slider('Drift amount', 'curlAmp', 0, 0.2, 0.001, v => v.toFixed(3))
  slider('Flow speed', 'curlSpeed', 0, 0.25, 0.005, v => v.toFixed(3))

  groupLabel('Cursor')
  slider('Part radius', 'cursorRadius', 0.1, 1.4, 0.01)
  slider('Part strength', 'cursorStrength', 0, 0.6, 0.01)

  groupLabel('Links')
  slider('Link radius', 'linkRadius', 0.1, 1.2, 0.01)
  slider('Link distance', 'linkDist', 0.05, 0.6, 0.01)
  slider('Link opacity', 'linkOpacity', 0, 1, 0.01)

  groupLabel('Look')
  slider('Glow', 'glow', 0, 1.5, 0.01, v => v.toFixed(2), v => pointUniforms.uGlow.value = v)
  slider('Twinkle', 'twinkle', 0, 1, 0.01, v => v.toFixed(2), v => pointUniforms.uTwinkle.value = v)
  slider('Dot size', 'size', 0.01, 0.06, 0.001, v => v.toFixed(3), v => pointUniforms.uSize.value = v * 520)
  slider('Bloom', 'bloom', 0, 1.5, 0.01, v => v.toFixed(2), v => (bloom.intensity = v))

  segmented('Nebula cloud', ['On', 'Off'], params.cloud ? 'on' : 'off', o => { params.cloud = o === 'on' })
  slider('Cloud opacity', 'cloudOpacity', 0, 0.7, 0.01, v => v.toFixed(2))
  slider('Wisp scale', 'cloudScale', 0.4, 2.5, 0.05, v => v.toFixed(2), v => (cloudUniforms.uScale.value = v))
  slider('Wispiness', 'cloudThreshold', 0.1, 0.7, 0.01, v => v.toFixed(2), v => (cloudUniforms.uThreshold.value = v))
  slider('Contrast', 'cloudContrast', 0.5, 3, 0.05, v => v.toFixed(2), v => (cloudUniforms.uContrast.value = v))
  slider('Cloud tint', 'cloudTint', 0, 1, 0.01, v => v.toFixed(2), v => (cloudUniforms.uColorAmount.value = v))
  slider('Cloud drift', 'cloudSpeed', 0, 0.1, 0.002, v => v.toFixed(3))

  groupLabel('Density')
  slider('Particle count', 'count', 800, 9000, 100, v => String(v | 0), v => buildField(v | 0))

  const hr = document.createElement('div'); hr.className = 'hr'; panel.append(hr)
  const foot = document.createElement('div'); foot.className = 'foot'
  fpsEl = document.createElement('span'); fpsEl.className = 'fps'; fpsEl.textContent = '— fps'
  const pause = document.createElement('button'); pause.textContent = 'Pause'
  pause.addEventListener('click', () => { params.paused = !params.paused; pause.textContent = params.paused ? 'Play' : 'Pause' })
  foot.append(fpsEl, pause); panel.append(foot)
}

// =============================================================================
// Boot
// =============================================================================
buildField(params.count)
buildCloud()
buildPanel()
// Seed the cursor at screen center so links are alive even before first move.
updateCursorWorld(window.innerWidth / 2, window.innerHeight / 2)
frame()
