/* =============================================================================
 * NEVULA — Intro Cinematic Prototype (v2)
 * -----------------------------------------------------------------------------
 *   1. START   — a compact nebula: warm orange core + blue halo, soft fbm gas
 *                cloud behind, gently drifting. Reads as a real nebula.
 *   2. SCRUB   — scroll (smoothed) compresses the cloud aggressively into the
 *                full "nevula" wordmark (NevulaLogo3DText.glb).
 *   3. HOLD    — the formed wordmark holds + brightens (anticipation).
 *   4. IMPLODE — particles crunch inward a touch (the coil before the spring).
 *   5. EXPLODE — detonation: outward burst + a bloom flash.
 *   6. REFORM  — the V (NevulaLogo3D.glb) coalesces OUT of the scattered burst.
 *   7. REVEAL  — UI fades in (00 — orchestration platform…).
 *
 * Render settings match the production opening (bloom 0.40/0.10/0.40, fog 0.05,
 * V extent 2.5, size 0.030, baked GLB colors) so the landing matches chapter 0.
 *
 * Run:  npm run dev  →  /proto/intro.html
 * ========================================================================== */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect,
  ToneMappingEffect, ToneMappingMode, KernelSize,
} from 'postprocessing'

const COBALT      = new THREE.Color('#1a5fb4')
const COBALT_DEEP = new THREE.Color('#00529c')
const ORANGE      = new THREE.Color('#ff6600')
const ORANGE_SOFT = new THREE.Color('#ffa566')
const FOG_COLOR   = new THREE.Color('#e6e8ef')
const CLOUD_LIGHT = new THREE.Color('#5b9be0')
const CLOUD_WARM  = new THREE.Color('#ff8a3d')

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const BLOOM_BASE = 0.40   // matches src/engine/post-fx.ts
const V_EXTENT = 2.875    // 2.5 × the opening's 1.15 chapter scale → matches on-screen size
const WORDMARK_EXTENT = 3.0
// Materials the production logo skips (states/logo.ts): the near-black outer-V
// outline reads as a dark smudge / cage around the orange V. Skip it here too
// so the V matches the real Opening instead of a dark-ringed version.
const GLB_SKIP = new Set<string>(['SVGMat.003'])

const params = {
  count: 4500,
  nebulaSpread: 0.85,      // compact cloud
  compressDuration: 1.6,   // seconds for the auto-played nebula→wordmark compression
  compressGamma: 2.6,      // >1 = slow then snap (aggressive compression)
  holdDuration: 0.6,       // wordmark holds + brightens (so "nevula" reads clearly)
  implodeAmount: 0.26,     // fraction pulled toward center (anticipation)
  implodeDuration: 0.18,
  burstScale: 2.1,         // explode INTO the V's parts flung to ~2× scale…
  burstJitter: 0.4,        // …plus random scatter, so it's an exploded V, not a circle
  burstDuration: 0.42,     // fast outward detonation
  reformDuration: 1.25,    // …then collapse + assemble into the final V
  revealDelay: 0.45,
  cloudOpacity: 0.42,
  glow: 0.6,
  twinkle: reduceMotion ? 0 : 0.45,
  size: 0.03,
  // — FX —
  streakScale: 3.5,        // comet-streak length ∝ per-frame speed
  streakAlpha: 9,          // streak visibility per unit speed
  ringMaxR: 1.25,          // shockwave ring max radius (uv units)
  ringDuration: 0.5,
  flashStrength: 0.5,      // exposure-flash peak (white overlay opacity)
  igniteDist: 0.2,         // neighbor distance for the formation connections
  igniteDuration: 0.85,    // how long the connection web lingers
  camPushIn: 0.5,          // camera dolly-in at full compression
  shakeStrength: 0.09,     // explosion camera recoil shake
}

// =============================================================================
// Shaders
// =============================================================================
const POINT_VERT = /* glsl */ `
  attribute float aSize; attribute float aSeed; attribute float aAlpha;
  varying vec3 vColor; varying float vFogDepth; varying float vAlpha; varying float vTw;
  uniform float uSize; uniform float uPixelRatio; uniform float uTime; uniform float uTwinkle;
  void main() {
    vColor = color; vAlpha = aAlpha;
    float tw = 0.5 + 0.5 * sin(uTime * (0.7 + aSeed * 1.7) + aSeed * 6.2831);
    vTw = mix(1.0, tw, uTwinkle);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFogDepth = -mv.z;
    float sizeMul = mix(1.0, 0.78 + 0.44 * tw, uTwinkle);
    gl_PointSize = uSize * aSize * sizeMul * uPixelRatio * (1.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`
const POINT_FRAG = /* glsl */ `
  varying vec3 vColor; varying float vFogDepth; varying float vAlpha; varying float vTw;
  uniform float uOpacity; uniform vec3 uFogColor; uniform float uFogDensity; uniform float uGlow;
  void main() {
    vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
    if (d > 0.5) discard;
    float aa = fwidth(d) * 1.4;
    float body = pow(1.0 - smoothstep(0.30 - aa, 0.30 + aa, d), 0.55);
    float halo = exp(-d * 6.5) * uGlow;
    float a = clamp((body + halo) * uOpacity * vAlpha * vTw, 0.0, 1.0);
    float fog = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
    gl_FragColor = vec4(mix(vColor, uFogColor, fog), a);
  }
`
const CLOUD_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const CLOUD_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime; uniform float uOpacity; uniform float uScale; uniform float uContrast; uniform float uThreshold;
  uniform vec3 uColDeep; uniform vec3 uColLight; uniform vec3 uColWarm;
  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
    i=mod(i,289.0);
    vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
    float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
  float fbm(vec3 p){ float s=0.0,a=0.5,f=1.0; for(int i=0;i<4;i++){ s+=a*snoise(p*f); f*=2.0; a*=0.5; } return s; }
  void main(){
    vec3 sp = vec3(vUv * uScale, uTime);
    vec3 q = vec3(fbm(sp), fbm(sp + 3.1), fbm(sp + 7.4));
    float dens = fbm(sp + 1.8 * q) * 0.5 + 0.5;
    dens = pow(smoothstep(uThreshold, 1.0, dens), uContrast);
    float mask = smoothstep(1.0, 0.2, length(vUv));
    float a = dens * mask * uOpacity;
    // Warm orange core, cool blue halo (matches the reference nebula).
    float warm = smoothstep(0.62, 0.0, length(vUv));
    vec3 col = mix(uColDeep, uColLight, dens);
    col = mix(col, uColWarm, warm * 0.55 * dens);
    gl_FragColor = vec4(col, a);
  }
`

// =============================================================================
// GLB surface sampler (mirrors states/logo.ts)
// =============================================================================
function computeMeshArea(mesh: THREE.Mesh): number {
  const geom = mesh.geometry as THREE.BufferGeometry
  const pos = geom.getAttribute('position').array as Float32Array
  const idx = geom.index?.array
  const m = mesh.matrixWorld
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), cr = new THREE.Vector3()
  let area = 0
  const tri = (i0: number, i1: number, i2: number) => {
    a.fromArray(pos, i0).applyMatrix4(m); b.fromArray(pos, i1).applyMatrix4(m); c.fromArray(pos, i2).applyMatrix4(m)
    ab.subVectors(b, a); ac.subVectors(c, a); cr.crossVectors(ab, ac); area += cr.length() * 0.5
  }
  if (idx) for (let i = 0; i < idx.length; i += 3) tri(idx[i] * 3, idx[i + 1] * 3, idx[i + 2] * 3)
  else for (let i = 0; i < pos.length; i += 9) tri(i, i + 3, i + 6)
  return area
}

interface Sampled { pos: Float32Array; col: Float32Array }

async function sampleGlb(url: string, count: number, targetExtent: number, skip?: Set<string>): Promise<Sampled> {
  const gltf = await new GLTFLoader().loadAsync(url)
  const scene = gltf.scene
  scene.updateMatrixWorld(true)
  const meshes: { worldMatrix: THREE.Matrix4; sampler: MeshSurfaceSampler; color: THREE.Color; area: number }[] = []
  scene.traverse(obj => {
    const m = obj as THREE.Mesh
    if (!(m as unknown as { isMesh?: boolean }).isMesh) return
    const mat = (Array.isArray(m.material) ? m.material[0] : m.material) as THREE.MeshStandardMaterial
    if (skip && skip.has(mat.name ?? '')) return
    const color = mat.color?.clone() ?? new THREE.Color('#1a5fb4')
    meshes.push({ worldMatrix: m.matrixWorld.clone(), sampler: new MeshSurfaceSampler(m).build(), color, area: computeMeshArea(m) })
  })
  const bbox = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3(); bbox.getCenter(center)
  const size = new THREE.Vector3(); bbox.getSize(size)
  const scale = targetExtent / (Math.max(size.x, size.y, size.z) || 1)
  const totalArea = meshes.reduce((s, m) => s + m.area, 0) || 1
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3)
  const tmp = new THREE.Vector3()
  let cur = 0
  for (let mi = 0; mi < meshes.length; mi++) {
    const m = meshes[mi]
    const n = mi === meshes.length - 1 ? count - cur : Math.round((m.area / totalArea) * count)
    for (let i = 0; i < n && cur < count; i++) {
      m.sampler.sample(tmp)
      tmp.applyMatrix4(m.worldMatrix).sub(center).multiplyScalar(scale)
      pos[cur * 3] = tmp.x; pos[cur * 3 + 1] = tmp.y; pos[cur * 3 + 2] = tmp.z
      col[cur * 3] = m.color.r; col[cur * 3 + 1] = m.color.g; col[cur * 3 + 2] = m.color.b
      cur++
    }
  }
  while (cur < count) { pos[cur * 3] = pos[0]; pos[cur * 3 + 1] = pos[1]; pos[cur * 3 + 2] = pos[2]; col[cur * 3] = col[0]; col[cur * 3 + 1] = col[1]; col[cur * 3 + 2] = col[2]; cur++ }
  return { pos, col }
}

// Compact nebula: dense gaussian core, warm-orange center → cool-blue periphery.
function genNebula(count: number, spread: number): Sampled {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const cluster = Math.random()
    let cx = 0, cy = 0, cz = 0, r = 1
    if (cluster < 0.62)      { r = 0.85 }
    else if (cluster < 0.85) { cx = 0.4; cy = 0.18; cz = -0.15; r = 0.4 }
    else { cx = (Math.random() - 0.5) * 1.2; cy = (Math.random() - 0.5) * 1.0; cz = (Math.random() - 0.5) * 0.35; r = 0.3 }
    const g  = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
    const g2 = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
    const g3 = Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random())
    const px = (cx + g * r * 0.55) * spread, py = (cy + g2 * r * 0.55) * spread, pz = (cz + g3 * r * 0.35) * spread
    pos[i * 3] = px; pos[i * 3 + 1] = py; pos[i * 3 + 2] = pz
    // warm core: orange likelihood high near center, blue at the edges
    const dist = Math.hypot(px, py) / (spread || 1)
    const warmP = Math.max(0, 0.7 - dist * 0.9)
    const rr = Math.random()
    const c = rr < warmP ? (Math.random() < 0.6 ? ORANGE : ORANGE_SOFT)
      : (rr < 0.7 ? COBALT_DEEP : COBALT)
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
  }
  return { pos, col }
}

// =============================================================================
// Scene / renderer / post-FX  (matches production opening)
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

const composer = new EffectComposer(renderer)
composer.addPass(new RenderPass(scene, camera))
const bloom = new BloomEffect({ intensity: BLOOM_BASE, luminanceThreshold: 0.10, luminanceSmoothing: 0.40, kernelSize: KernelSize.MEDIUM, mipmapBlur: true })
composer.addPass(new EffectPass(camera, bloom, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })))
composer.setSize(window.innerWidth, window.innerHeight)

const uniforms = {
  uSize: { value: params.size * 520 }, uPixelRatio: { value: DPR }, uOpacity: { value: 1 },
  uTime: { value: 0 }, uTwinkle: { value: params.twinkle }, uGlow: { value: params.glow },
  uFogColor: { value: FOG_COLOR.clone() }, uFogDensity: { value: 0.05 },
}
const material = new THREE.ShaderMaterial({
  uniforms: uniforms as any, vertexShader: POINT_VERT, fragmentShader: POINT_FRAG,
  transparent: true, depthWrite: false, vertexColors: true, blending: THREE.NormalBlending,
})

const cloudUniforms = {
  uTime: { value: 0 }, uOpacity: { value: 0 }, uScale: { value: 1.2 }, uContrast: { value: 1.3 }, uThreshold: { value: 0.4 },
  uColDeep: { value: COBALT_DEEP.clone() }, uColLight: { value: CLOUD_LIGHT.clone() }, uColWarm: { value: CLOUD_WARM.clone() },
}
const cloudMat = new THREE.ShaderMaterial({
  uniforms: cloudUniforms as any, vertexShader: CLOUD_VERT, fragmentShader: CLOUD_FRAG,
  transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
})
const cloudMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), cloudMat)
cloudMesh.position.z = -0.25; cloudMesh.renderOrder = -1; cloudMesh.frustumCulled = false
scene.add(cloudMesh)

// =============================================================================
// Cinematic FX: velocity streaks · formation connections · shockwave ring ·
// camera dolly + recoil shake · exposure flash.
// =============================================================================
const LINE_VERT = /* glsl */ `
  attribute float aA; varying vec3 vColor; varying float vA;
  void main(){ vColor = color; vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const LINE_FRAG = /* glsl */ `
  varying vec3 vColor; varying float vA; uniform float uOpacity;
  void main(){ gl_FragColor = vec4(vColor, vA * uOpacity); }
`
const RING_VERT = /* glsl */ `
  varying vec2 vUv; void main(){ vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`
const RING_FRAG = /* glsl */ `
  varying vec2 vUv; uniform float uRadius; uniform float uWidth; uniform float uAlpha; uniform vec3 uColor;
  void main(){ float d = length(vUv); float ring = smoothstep(uWidth, 0.0, abs(d - uRadius)); gl_FragColor = vec4(uColor, ring * uAlpha); }
`
const CNT = params.count
const makeLineMat = () => new THREE.ShaderMaterial({
  uniforms: { uOpacity: { value: 1 } }, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
  transparent: true, depthWrite: false, vertexColors: true, blending: THREE.NormalBlending,
})

// (1) velocity streaks — one trailing segment per particle, alpha ∝ speed.
const streakGeo = new THREE.BufferGeometry()
streakGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CNT * 2 * 3), 3))
streakGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(CNT * 2 * 3), 3))
streakGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(CNT * 2), 1))
const streakSeg = new THREE.LineSegments(streakGeo, makeLineMat()); streakSeg.frustumCulled = false; streakSeg.renderOrder = 0; scene.add(streakSeg)

// (2) formation connections — a web that flashes when the wordmark + V form.
const MAX_PAIRS = 900
const igniteGeo = new THREE.BufferGeometry()
igniteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_PAIRS * 2 * 3), 3))
igniteGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_PAIRS * 2 * 3), 3))
igniteGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(MAX_PAIRS * 2), 1))
igniteGeo.setDrawRange(0, 0)
const igniteSeg = new THREE.LineSegments(igniteGeo, makeLineMat()); igniteSeg.frustumCulled = false; igniteSeg.renderOrder = 2; scene.add(igniteSeg)
let pairList: number[] = []; let igniteT = 0

// (3) shockwave ring — one expanding pulse on the detonation.
const ringMat = new THREE.ShaderMaterial({
  uniforms: { uRadius: { value: 0 }, uWidth: { value: 0.06 }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color('#6aa6e6') } },
  vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
})
const ringMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), ringMat)
ringMesh.position.z = 0; ringMesh.renderOrder = 5; ringMesh.frustumCulled = false; ringMesh.visible = false; scene.add(ringMesh)
let ringT = 0

// (4) camera dolly + recoil shake + exposure-flash overlay.
let camZ = 3.55, shakeAmt = 0, flashV = 0
const flashEl = document.getElementById('flash')!

function buildStreaks() {
  const lp = streakGeo.getAttribute('position').array as Float32Array
  const lc = streakGeo.getAttribute('color').array as Float32Array
  const la = streakGeo.getAttribute('aA').array as Float32Array
  const sc = params.streakScale, sa = params.streakAlpha
  for (let i = 0; i < CNT; i++) {
    const ix = i * 3, o = i * 6, va = i * 2
    const vx = posAttr[ix] - prevPos[ix], vy = posAttr[ix + 1] - prevPos[ix + 1], vz = posAttr[ix + 2] - prevPos[ix + 2]
    lp[o] = posAttr[ix]; lp[o + 1] = posAttr[ix + 1]; lp[o + 2] = posAttr[ix + 2]
    lp[o + 3] = posAttr[ix] - vx * sc; lp[o + 4] = posAttr[ix + 1] - vy * sc; lp[o + 5] = posAttr[ix + 2] - vz * sc
    lc[o] = colAttr[ix]; lc[o + 1] = colAttr[ix + 1]; lc[o + 2] = colAttr[ix + 2]
    lc[o + 3] = colAttr[ix]; lc[o + 4] = colAttr[ix + 1]; lc[o + 5] = colAttr[ix + 2]
    la[va] = Math.min(0.85, Math.hypot(vx, vy, vz) * sa); la[va + 1] = 0
  }
  streakGeo.getAttribute('position').needsUpdate = true
  streakGeo.getAttribute('color').needsUpdate = true
  streakGeo.getAttribute('aA').needsUpdate = true
}

// Spatial-hash neighbor pairing (stride-sampled so connections span the whole shape).
function findPairs(src: Float32Array, count: number, D: number, maxPairs: number): number[] {
  const inv = 1 / D, grid = new Map<string, number[]>()
  for (let i = 0; i < count; i++) {
    const k = `${Math.floor(src[i * 3] * inv)},${Math.floor(src[i * 3 + 1] * inv)},${Math.floor(src[i * 3 + 2] * inv)}`
    let a = grid.get(k); if (!a) { a = []; grid.set(k, a) } a.push(i)
  }
  const pairs: number[] = [], D2 = D * D, stride = Math.max(1, Math.floor(count / 1600))
  for (let i = 0; i < count && pairs.length < maxPairs * 2; i += stride) {
    const x = src[i * 3], y = src[i * 3 + 1], z = src[i * 3 + 2]
    const cx = Math.floor(x * inv), cy = Math.floor(y * inv), cz = Math.floor(z * inv)
    let made = 0
    for (let dx = -1; dx <= 1 && made < 2; dx++) for (let dy = -1; dy <= 1 && made < 2; dy++) for (let dz = -1; dz <= 1 && made < 2; dz++) {
      const arr = grid.get(`${cx + dx},${cy + dy},${cz + dz}`); if (!arr) continue
      for (const j of arr) { if (j <= i) continue; const ax = x - src[j * 3], ay = y - src[j * 3 + 1], az = z - src[j * 3 + 2]; if (ax * ax + ay * ay + az * az < D2) { pairs.push(i, j); made++; if (made >= 2) break } }
    }
  }
  return pairs
}
function triggerIgnite(ref: Float32Array) { pairList = findPairs(ref, CNT, params.igniteDist, MAX_PAIRS); igniteT = params.igniteDuration }

function updateIgnite(dt: number) {
  if (igniteT <= 0) { igniteSeg.visible = false; return }
  igniteT -= dt
  const ease = Math.max(0, igniteT / params.igniteDuration), a = ease * ease * 0.9
  igniteSeg.visible = true
  const lp = igniteGeo.getAttribute('position').array as Float32Array
  const lc = igniteGeo.getAttribute('color').array as Float32Array
  const la = igniteGeo.getAttribute('aA').array as Float32Array
  const n = Math.min(MAX_PAIRS, pairList.length / 2)
  for (let p = 0; p < n; p++) {
    const pi = pairList[p * 2] * 3, pj = pairList[p * 2 + 1] * 3, o = p * 6, va = p * 2
    lp[o] = posAttr[pi]; lp[o + 1] = posAttr[pi + 1]; lp[o + 2] = posAttr[pi + 2]
    lp[o + 3] = posAttr[pj]; lp[o + 4] = posAttr[pj + 1]; lp[o + 5] = posAttr[pj + 2]
    lc[o] = colAttr[pi]; lc[o + 1] = colAttr[pi + 1]; lc[o + 2] = colAttr[pi + 2]
    lc[o + 3] = colAttr[pj]; lc[o + 4] = colAttr[pj + 1]; lc[o + 5] = colAttr[pj + 2]
    la[va] = a; la[va + 1] = a
  }
  igniteGeo.setDrawRange(0, n * 2)
  igniteGeo.getAttribute('position').needsUpdate = true
  igniteGeo.getAttribute('color').needsUpdate = true
  igniteGeo.getAttribute('aA').needsUpdate = true
}

function updateRing(dt: number) {
  if (ringT <= 0) { ringMesh.visible = false; return }
  ringT -= dt
  const p = 1 - Math.max(0, ringT / params.ringDuration)
  ringMesh.visible = true
  ringMat.uniforms.uRadius.value = p * params.ringMaxR
  ringMat.uniforms.uAlpha.value = (1 - p) * 0.8
}

function updateCamera(dt: number) {
  let zT = 3.4
  if (phase === 'idle') zT = 3.55
  else if (phase === 'compress') zT = 3.55 - Math.pow(progress, params.compressGamma) * params.camPushIn
  else if (phase === 'hold' || phase === 'implode') zT = 3.55 - params.camPushIn
  camZ += (zT - camZ) * 0.06
  shakeAmt *= Math.max(0, 1 - dt * 7)
  camera.position.set((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt, camZ)
}

function updateFlash(dt: number) {
  if (flashV > 0.002) { flashV *= Math.max(0, 1 - dt * 6); flashEl.style.opacity = String(flashV) }
  else if (flashEl.style.opacity !== '0') flashEl.style.opacity = '0'
}

// =============================================================================
// State buffers + phase machine
// =============================================================================
type Phase = 'loading' | 'idle' | 'compress' | 'hold' | 'implode' | 'explode' | 'reform' | 'done'
let phase: Phase = 'loading'
let progress = 0, phaseTime = 0, revealTimer = -1

let geo!: THREE.BufferGeometry
let posAttr!: Float32Array, colAttr!: Float32Array
let neb!: Sampled, word!: Sampled, vMark!: Sampled
let vel!: Float32Array, scratch!: Float32Array, prevPos!: Float32Array   // burst targets, captures, last-frame positions
const revealEl = document.getElementById('reveal')!
const hintEl = document.getElementById('hint')!

function buildField(count: number) {
  if (geo) { scene.children.filter(o => (o as THREE.Points).isPoints).forEach(o => scene.remove(o)); geo.dispose() }
  neb = genNebula(count, params.nebulaSpread)
  posAttr = neb.pos.slice(); colAttr = neb.col.slice()
  vel = new Float32Array(count * 3); scratch = new Float32Array(count * 3); prevPos = posAttr.slice()
  const sizes = new Float32Array(count), seeds = new Float32Array(count), alphas = new Float32Array(count)
  for (let i = 0; i < count; i++) { sizes[i] = 0.6 + Math.random() * 1.6; seeds[i] = Math.random(); alphas[i] = 1 }
  geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(posAttr, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colAttr, 3))
  geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
  const points = new THREE.Points(geo, material); points.frustumCulled = false; points.renderOrder = 1; scene.add(points)
}

function resetSequence() {
  phase = 'idle'; progress = 0; phaseTime = 0; revealTimer = -1
  revealEl.classList.remove('on'); hintEl.style.opacity = '1'; bloom.intensity = BLOOM_BASE
  ringT = 0; igniteT = 0; flashV = 0; shakeAmt = 0; camZ = 3.55
  ringMesh.visible = false; igniteSeg.visible = false; flashEl.style.opacity = '0'
  uniforms.uGlow.value = params.glow; camera.position.set(0, 0, camZ)
  const fresh = genNebula(params.count, params.nebulaSpread)
  neb.pos.set(fresh.pos); neb.col.set(fresh.col)
  posAttr.set(neb.pos); colAttr.set(neb.col); prevPos.set(neb.pos)
  geo.getAttribute('position').needsUpdate = true; geo.getAttribute('color').needsUpdate = true
}

// Any interaction (scroll / click / key / touch) auto-plays the whole cinematic.
function startCinematic() {
  if (phase !== 'idle') return
  phase = 'compress'; phaseTime = 0; progress = 0
  hintEl.style.opacity = '0'
}
const onInteract = (e: Event) => { if (e.type === 'wheel') e.preventDefault(); startCinematic() }
window.addEventListener('wheel', onInteract, { passive: false })
window.addEventListener('click', onInteract)
window.addEventListener('keydown', onInteract)
window.addEventListener('touchstart', onInteract, { passive: false })

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

// =============================================================================
// Frame loop
// =============================================================================
const clock = new THREE.Clock()
let fpsAccum = 0, fpsFrames = 0
let progEl: HTMLElement | null = null, phaseEl: HTMLElement | null = null, fpsEl: HTMLElement | null = null

function frame() {
  requestAnimationFrame(frame)
  const dt = Math.min(clock.getDelta(), 0.05)
  const t = clock.elapsedTime
  uniforms.uTime.value = t; cloudUniforms.uTime.value = t * 0.03
  if (phase === 'loading') { composer.render(dt); return }

  const count = params.count
  phaseTime += dt

  if (phase === 'idle' || phase === 'compress') {
    // idle: drift the nebula, wait for interaction. compress: auto-play the
    // nebula → wordmark convergence over compressDuration (no scrolling).
    let ease = 0
    if (phase === 'compress') { progress = Math.min(1, phaseTime / params.compressDuration); ease = Math.pow(progress, params.compressGamma) }
    cloudUniforms.uOpacity.value = params.cloudOpacity * (1 - ease)
    cloudMesh.visible = ease < 0.97
    const driftAmp = (1 - ease) * (reduceMotion ? 0.004 : 0.02)
    for (let i = 0; i < count; i++) {
      const ix = i * 3, dp = i * 0.05
      posAttr[ix]     = neb.pos[ix]     + (word.pos[ix]     - neb.pos[ix])     * ease + Math.sin(t * 0.18 + dp) * driftAmp
      posAttr[ix + 1] = neb.pos[ix + 1] + (word.pos[ix + 1] - neb.pos[ix + 1]) * ease + Math.cos(t * 0.22 + dp) * driftAmp
      posAttr[ix + 2] = neb.pos[ix + 2] + (word.pos[ix + 2] - neb.pos[ix + 2]) * ease
      colAttr[ix]     = neb.col[ix]     + (word.col[ix]     - neb.col[ix])     * ease
      colAttr[ix + 1] = neb.col[ix + 1] + (word.col[ix + 1] - neb.col[ix + 1]) * ease
      colAttr[ix + 2] = neb.col[ix + 2] + (word.col[ix + 2] - neb.col[ix + 2]) * ease
    }
    geo.getAttribute('color').needsUpdate = true
    if (phase === 'compress' && progress >= 1) { posAttr.set(word.pos); colAttr.set(word.col); phase = 'hold'; phaseTime = 0; cloudMesh.visible = false; triggerIgnite(word.pos) }
  } else if (phase === 'hold') {
    // Wordmark crisp; brighten slightly as the coil tightens.
    uniforms.uGlow.value = params.glow + Math.min(1, phaseTime / params.holdDuration) * 0.5
    if (phaseTime >= params.holdDuration) { phase = 'implode'; phaseTime = 0; scratch.set(word.pos) }
  } else if (phase === 'implode') {
    const k = Math.min(1, phaseTime / params.implodeDuration)
    const s = 1 - params.implodeAmount * k   // pull toward center (the coil)
    for (let i = 0; i < count * 3; i++) posAttr[i] = scratch[i] * s   // scratch = wordmark
    if (phaseTime >= params.implodeDuration) {
      // EXPLODE INTO THE V'S PARTS: each particle's burst target is its OWN final
      // V position flung out to ~burstScale + a little scatter — so the cloud is
      // an exploded V (not a uniform circle), which then collapses into the V.
      phase = 'explode'; phaseTime = 0; bloom.intensity = 1.4
      ringT = params.ringDuration; flashV = params.flashStrength; shakeAmt = params.shakeStrength   // shockwave + flash + recoil
      scratch.set(posAttr)   // imploded start
      for (let i = 0; i < count; i++) {
        const ix = i * 3
        const rx = Math.random() - 0.5, ry = Math.random() - 0.5, rz = Math.random() - 0.5
        const rl = Math.hypot(rx, ry, rz) || 1, j = params.burstJitter
        vel[ix]     = vMark.pos[ix]     * params.burstScale + (rx / rl) * j
        vel[ix + 1] = vMark.pos[ix + 1] * params.burstScale + (ry / rl) * j
        vel[ix + 2] = vMark.pos[ix + 2] * params.burstScale + (rz / rl) * j
      }
    }
  } else if (phase === 'explode') {
    bloom.intensity += (BLOOM_BASE - bloom.intensity) * Math.min(1, dt * 3.5)   // decay flash
    uniforms.uGlow.value += (params.glow - uniforms.uGlow.value) * Math.min(1, dt * 3)
    const k = easeOut(Math.min(1, phaseTime / params.burstDuration))   // fast shoot outward
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      posAttr[ix]     = scratch[ix]     + (vel[ix]     - scratch[ix])     * k
      posAttr[ix + 1] = scratch[ix + 1] + (vel[ix + 1] - scratch[ix + 1]) * k
      posAttr[ix + 2] = scratch[ix + 2] + (vel[ix + 2] - scratch[ix + 2]) * k
      // colors shift to the V's baked colors as the parts fling out
      colAttr[ix]     = word.col[ix]     + (vMark.col[ix]     - word.col[ix])     * k
      colAttr[ix + 1] = word.col[ix + 1] + (vMark.col[ix + 1] - word.col[ix + 1]) * k
      colAttr[ix + 2] = word.col[ix + 2] + (vMark.col[ix + 2] - word.col[ix + 2]) * k
    }
    geo.getAttribute('color').needsUpdate = true
    if (phaseTime >= params.burstDuration) { phase = 'reform'; phaseTime = 0; scratch.set(posAttr) }
  } else if (phase === 'reform') {
    bloom.intensity += (BLOOM_BASE - bloom.intensity) * Math.min(1, dt * 3.5)
    const k = easeOut(Math.min(1, phaseTime / params.reformDuration))   // collapse + assemble into V
    for (let i = 0; i < count; i++) {
      const ix = i * 3
      posAttr[ix]     = scratch[ix]     + (vMark.pos[ix]     - scratch[ix])     * k
      posAttr[ix + 1] = scratch[ix + 1] + (vMark.pos[ix + 1] - scratch[ix + 1]) * k
      posAttr[ix + 2] = scratch[ix + 2] + (vMark.pos[ix + 2] - scratch[ix + 2]) * k
    }
    if (phaseTime >= params.reformDuration) { phase = 'done'; phaseTime = 0; revealTimer = params.revealDelay; posAttr.set(vMark.pos); colAttr.set(vMark.col); geo.getAttribute('color').needsUpdate = true; triggerIgnite(vMark.pos) }
  } else {
    const amp = reduceMotion ? 0.002 : 0.005
    for (let i = 0; i < count; i++) {
      const ix = i * 3, dp = i * 0.05
      posAttr[ix]     = vMark.pos[ix]     + Math.sin(t * 0.28 + dp) * amp
      posAttr[ix + 1] = vMark.pos[ix + 1] + Math.cos(t * 0.36 + dp) * amp
      posAttr[ix + 2] = vMark.pos[ix + 2] + Math.sin(t * 0.22 + i * 0.03) * (amp * 0.6)
    }
    if (revealTimer >= 0) { revealTimer -= dt; if (revealTimer < 0) revealEl.classList.add('on') }
  }

  geo.getAttribute('position').needsUpdate = true

  // — cinematic FX —
  buildStreaks(); prevPos.set(posAttr)
  updateIgnite(dt); updateRing(dt); updateCamera(dt); updateFlash(dt)

  composer.render(dt)

  fpsAccum += dt; fpsFrames++
  if (fpsAccum >= 0.4) { if (fpsEl) fpsEl.textContent = `${Math.round(fpsFrames / fpsAccum)} fps · ${count.toLocaleString()} pts`; fpsAccum = 0; fpsFrames = 0 }
  if (progEl) progEl.style.width = `${(phase === 'idle' ? 0 : phase === 'compress' ? progress : 1) * 100}%`
  if (phaseEl) phaseEl.textContent = `phase: ${phase}${phase === 'compress' ? ` · ${(progress * 100) | 0}%` : ''}`
}

// =============================================================================
// Panel
// =============================================================================
function buildPanel() {
  const panel = document.getElementById('panel')!
  const h = document.createElement('h3'); h.textContent = 'Intro cinematic v2'; panel.append(h)
  const prog = document.createElement('div'); prog.className = 'prog'; progEl = document.createElement('i'); prog.append(progEl); panel.append(prog)
  phaseEl = document.createElement('div'); phaseEl.className = 'phase'; phaseEl.textContent = 'phase: loading'; panel.append(phaseEl)
  const slider = (label: string, key: keyof typeof params, min: number, max: number, step: number, fmt = (v: number) => v.toFixed(2), onInput?: (v: number) => void) => {
    const row = document.createElement('div'); row.className = 'row'
    const lab = document.createElement('label'); const val = document.createElement('span'); val.className = 'v'; val.textContent = fmt(params[key] as number)
    lab.append(document.createTextNode(label), val)
    const inp = document.createElement('input'); inp.type = 'range'; inp.min = String(min); inp.max = String(max); inp.step = String(step); inp.value = String(params[key])
    inp.addEventListener('input', () => { const v = parseFloat(inp.value); (params[key] as number) = v; val.textContent = fmt(v); onInput?.(v) })
    row.append(lab, inp); panel.append(row)
  }
  const group = (txt: string) => { const d = document.createElement('div'); d.className = 'group-label'; d.textContent = txt; panel.append(d) }
  group('Nebula')
  slider('Cloud opacity', 'cloudOpacity', 0, 0.8, 0.01)
  slider('Nebula spread', 'nebulaSpread', 0.5, 1.6, 0.05, v => v.toFixed(2), () => resetSequence())
  group('Compression')
  slider('Compress duration', 'compressDuration', 0.6, 3.5, 0.1)
  slider('Compress curve', 'compressGamma', 1, 4, 0.1)
  group('Explosion')
  slider('Hold', 'holdDuration', 0, 1, 0.02)
  slider('Implode amount', 'implodeAmount', 0, 0.5, 0.02)
  slider('Implode time', 'implodeDuration', 0.05, 0.5, 0.02)
  slider('Burst scale', 'burstScale', 1.2, 3.5, 0.1)
  slider('Burst jitter', 'burstJitter', 0, 1, 0.05)
  slider('Burst duration', 'burstDuration', 0.15, 1, 0.05)
  slider('Reform duration', 'reformDuration', 0.4, 2.5, 0.05)
  slider('Reveal delay', 'revealDelay', 0, 1.5, 0.05)
  group('Look')
  slider('Glow', 'glow', 0, 1.5, 0.01, v => v.toFixed(2), v => uniforms.uGlow.value = v)
  slider('Dot size', 'size', 0.01, 0.06, 0.001, v => v.toFixed(3), v => uniforms.uSize.value = v * 520)
  group('FX — streaks · ring · connect · camera')
  slider('Streak length', 'streakScale', 0, 8, 0.1)
  slider('Streak alpha', 'streakAlpha', 0, 20, 0.5, v => v.toFixed(1))
  slider('Ring radius', 'ringMaxR', 0.4, 2, 0.05)
  slider('Ring time', 'ringDuration', 0.2, 1.2, 0.05)
  slider('Flash', 'flashStrength', 0, 1, 0.02)
  slider('Connect dist', 'igniteDist', 0.05, 0.5, 0.01)
  slider('Connect time', 'igniteDuration', 0, 2, 0.05)
  slider('Camera push-in', 'camPushIn', 0, 1.2, 0.05)
  slider('Camera shake', 'shakeStrength', 0, 0.25, 0.01)
  fpsEl = document.createElement('div'); fpsEl.className = 'fps'; fpsEl.textContent = '— fps'; panel.append(fpsEl)
  const foot = document.createElement('div'); foot.className = 'foot'
  const replay = document.createElement('button'); replay.textContent = 'Replay'; replay.addEventListener('click', resetSequence)
  const skip = document.createElement('button'); skip.textContent = 'Skip → V'
  skip.addEventListener('click', () => { if (!vMark) return; phase = 'done'; phaseTime = 0; bloom.intensity = BLOOM_BASE; uniforms.uGlow.value = params.glow; posAttr.set(vMark.pos); colAttr.set(vMark.col); prevPos.set(vMark.pos); geo.getAttribute('position').needsUpdate = true; geo.getAttribute('color').needsUpdate = true; revealEl.classList.add('on'); hintEl.style.opacity = '0'; cloudMesh.visible = false; ringT = 0; igniteT = 0; flashV = 0; shakeAmt = 0; camZ = 3.4; ringMesh.visible = false; igniteSeg.visible = false; flashEl.style.opacity = '0' })
  foot.append(replay, skip); panel.append(foot)
}

window.addEventListener('resize', () => {
  const W = window.innerWidth, H = window.innerHeight
  renderer.setSize(W, H, false); composer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix()
})

const BASE = import.meta.env.BASE_URL
buildPanel(); buildField(params.count)
Promise.all([
  sampleGlb(`${BASE}assets/NevulaLogo3DText.glb`, params.count, WORDMARK_EXTENT),  // keep ALL letters
  sampleGlb(`${BASE}assets/NevulaLogo3D.glb`, params.count, V_EXTENT, GLB_SKIP),    // skip the dark outline
]).then(([w, v]) => { word = w; vMark = v; phase = 'idle' })
  .catch(err => { console.error('[intro proto] GLB load failed', err); if (phaseEl) phaseEl.textContent = 'GLB load failed — see console' })

frame()
