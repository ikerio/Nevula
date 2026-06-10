/* =============================================================================
 * NEVULA — Intro cinematic (production port of proto/intro.ts)
 * -----------------------------------------------------------------------------
 *   1. START   — a compact nebula: warm orange core + blue halo, soft fbm gas.
 *   2. COMPRESS— first input compresses the cloud into the "nevula" wordmark.
 *   3. HOLD     — the wordmark holds + brightens (anticipation).
 *   4. IMPLODE — particles crunch inward (the coil before the spring).
 *   5. EXPLODE — detonation: outward burst + bloom flash + shockwave + recoil.
 *   6. REFORM  — the V (NevulaLogo3D.glb) coalesces out of the burst.
 *   7. HANDOFF — once the V is formed, the engine's own particle field (already
 *                at logo state, opacity 0) crossfades in over the identical V
 *                and chapter 0 surfaces. The cinematic canvas fades out + the
 *                overlay disposes. No mock reveal UI — chapter 0 IS the reveal.
 *
 * Render settings match the production opening (bloom 0.40/0.10/0.40, fog 0.05,
 * V extent 2.5×, size 0.030, baked GLB colors) so the cinematic's final V and
 * the engine's chapter-0 V line up for a seamless crossfade.
 * ========================================================================== */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect,
  ToneMappingEffect, ToneMappingMode, KernelSize,
} from 'postprocessing'
import gsap from 'gsap'
import { htmlEl } from '../lib/dom'
import { isMobile } from '../lib/responsive'
import { introCamZ } from '../lib/cinematic-fit'
import '../styles/intro-cinematic.css'

export interface IntroCinematic {
  /** Tear down the overlay (stop the loop, drop listeners/timers, dispose GL). */
  dispose(): void
}

export interface IntroCinematicOptions {
  /** Fires when the V has formed — caller should ramp the engine particle
   *  field's opacity 0→1 (it's already at logo state) and reveal chapter 0. */
  onExitBegin: () => void
  /** Fires once the cinematic canvas has crossfaded out — caller disposes. */
  onExitComplete: () => void
}

const COBALT      = new THREE.Color('#1a5fb4')
const COBALT_DEEP = new THREE.Color('#00529c')
const ORANGE      = new THREE.Color('#ff6600')
const ORANGE_SOFT = new THREE.Color('#ffa566')
const FOG_COLOR   = new THREE.Color('#e6e8ef')
const CLOUD_LIGHT = new THREE.Color('#5b9be0')
const CLOUD_WARM  = new THREE.Color('#ff8a3d')

const BLOOM_BASE = 0.40   // matches src/engine/post-fx.ts
const V_EXTENT = 2.875    // 2.5 × the opening's 1.15 chapter scale → matches on-screen size
const WORDMARK_EXTENT = 3.0
// Skip the near-black outer-V outline material (matches states/logo.ts) so the
// V reads like the real opening instead of a dark-ringed version.
const GLB_SKIP = new Set<string>(['SVGMat.003'])

// =============================================================================
// Shaders (identical to the live engine's point look — flat glowing motes)
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
    float warm = smoothstep(0.62, 0.0, length(vUv));
    vec3 col = mix(uColDeep, uColLight, dens);
    col = mix(col, uColWarm, warm * 0.55 * dens);
    gl_FragColor = vec4(col, a);
  }
`
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

// =============================================================================
// Geometry helpers (mirror states/logo.ts + proto/intro.ts)
// =============================================================================
interface Sampled { pos: Float32Array; col: Float32Array }

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
    const dist = Math.hypot(px, py) / (spread || 1)
    const warmP = Math.max(0, 0.7 - dist * 0.9)
    const rr = Math.random()
    const c = rr < warmP ? (Math.random() < 0.6 ? ORANGE : ORANGE_SOFT)
      : (rr < 0.7 ? COBALT_DEEP : COBALT)
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
  }
  return { pos, col }
}

type Phase = 'loading' | 'idle' | 'compress' | 'hold' | 'implode' | 'explode' | 'reform' | 'done'

export function mountIntroCinematic(opts: IntroCinematicOptions): IntroCinematic {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Mobile lightens the intro: ~1/3 the particles, DPR 1, and no bloom (below).
  const mobile = isMobile()

  const params = {
    count: mobile ? 1500 : 4500,
    nebulaSpread: 0.85,
    compressDuration: 1.6,
    compressGamma: 2.6,
    holdDuration: 0.6,
    implodeAmount: 0.26,
    implodeDuration: 0.18,
    burstScale: 2.1,
    burstJitter: 0.4,
    burstDuration: 0.42,
    reformDuration: 1.25,
    revealDelay: 0.45,
    cloudOpacity: 0.42,
    glow: 0.6,
    twinkle: reduceMotion ? 0 : 0.45,
    size: 0.03,
    streakScale: 3.5,
    streakAlpha: 9,
    ringMaxR: 1.25,
    ringDuration: 0.5,
    flashStrength: 0.5,
    igniteDist: 0.2,
    igniteDuration: 0.85,
    camPushIn: 1,            // camera dolly-in at full compression
    shakeStrength: 0.21,     // explosion camera recoil shake
  }

  // ----- DOM -----
  const overlay = htmlEl(`
    <div class="intro-cinematic" aria-hidden="true">
      <canvas class="intro-cine-canvas"></canvas>
      <div class="intro-cine-flash"></div>
      <div class="intro-cine-hint"><span>Scroll to begin</span><span class="line"></span></div>
    </div>
  `)
  const canvas = overlay.querySelector('.intro-cine-canvas') as HTMLCanvasElement
  const flashEl = overlay.querySelector('.intro-cine-flash') as HTMLElement
  document.body.appendChild(overlay)

  const prevOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'

  // ----- Renderer / scene / camera / post-FX (matches production opening) -----
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
  renderer.setClearColor(0x000000, 0)
  const DPR = Math.min(window.devicePixelRatio, mobile ? 1 : 2)
  renderer.setPixelRatio(DPR)
  renderer.setSize(window.innerWidth, window.innerHeight, false)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 50)
  // Resting/framed camera distance for the current aspect — pulled back on
  // narrow/portrait viewports so the wide wordmark, V, and burst stay in frame
  // (the camera's FOV is vertical, so portrait crops horizontally). The dolly +
  // shake in updateCamera() are expressed RELATIVE to this base. Recomputed on
  // resize. `≥ 3.4` so landscape keeps the original framing.
  let camZBase = introCamZ()
  camera.position.z = camZBase

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  // `bloom` is always constructed so the explosion-flash frame logic can poke
  // its intensity, but on mobile we don't add the bloom + tonemap EffectPass —
  // it's the priciest part of the intro render. The RenderPass alone still
  // writes the scene to the canvas; the intensity writes become harmless no-ops.
  const bloom = new BloomEffect({ intensity: BLOOM_BASE, luminanceThreshold: 0.10, luminanceSmoothing: 0.40, kernelSize: KernelSize.MEDIUM, mipmapBlur: true })
  if (!mobile) {
    composer.addPass(new EffectPass(camera, bloom, new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC })))
  }
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

  // ----- Cinematic FX: streaks · formation web · shockwave ring · cam shake · flash -----
  const CNT = params.count
  const makeLineMat = () => new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 1 } }, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG,
    transparent: true, depthWrite: false, vertexColors: true, blending: THREE.NormalBlending,
  })

  const streakGeo = new THREE.BufferGeometry()
  streakGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(CNT * 2 * 3), 3))
  streakGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(CNT * 2 * 3), 3))
  streakGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(CNT * 2), 1))
  const streakSeg = new THREE.LineSegments(streakGeo, makeLineMat()); streakSeg.frustumCulled = false; streakSeg.renderOrder = 0; scene.add(streakSeg)

  const MAX_PAIRS = 900
  const igniteGeo = new THREE.BufferGeometry()
  igniteGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_PAIRS * 2 * 3), 3))
  igniteGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_PAIRS * 2 * 3), 3))
  igniteGeo.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(MAX_PAIRS * 2), 1))
  igniteGeo.setDrawRange(0, 0)
  const igniteSeg = new THREE.LineSegments(igniteGeo, makeLineMat()); igniteSeg.frustumCulled = false; igniteSeg.renderOrder = 2; scene.add(igniteSeg)
  let pairList: number[] = []; let igniteT = 0

  const ringMat = new THREE.ShaderMaterial({
    uniforms: { uRadius: { value: 0 }, uWidth: { value: 0.06 }, uAlpha: { value: 0 }, uColor: { value: new THREE.Color('#6aa6e6') } },
    vertexShader: RING_VERT, fragmentShader: RING_FRAG, transparent: true, depthWrite: false, depthTest: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
  })
  const ringMesh = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), ringMat)
  ringMesh.position.z = 0; ringMesh.renderOrder = 5; ringMesh.frustumCulled = false; ringMesh.visible = false; scene.add(ringMesh)
  let ringT = 0

  let camZ = camZBase + 0.15, shakeAmt = 0, flashV = 0

  // ----- State buffers + phase machine -----
  let phase: Phase = 'loading'
  let progress = 0, phaseTime = 0
  let exiting = false

  let geo!: THREE.BufferGeometry
  let posAttr!: Float32Array, colAttr!: Float32Array
  let neb!: Sampled, word!: Sampled, vMark!: Sampled
  let vel!: Float32Array, scratch!: Float32Array, prevPos!: Float32Array
  let points: THREE.Points | null = null

  function buildField(count: number) {
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
    points = new THREE.Points(geo, material); points.frustumCulled = false; points.renderOrder = 1; scene.add(points)
  }

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
    // Dolly is expressed relative to camZBase and scaled by it, so the idle pull
    // and the compression push-in feel the same at any viewport aspect (a fixed
    // world-unit push would barely register at the larger portrait distance).
    const k = camZBase / 3.4
    const idle = 0.15 * k
    const push = params.camPushIn * k
    let zT = camZBase
    if (phase === 'idle') zT = camZBase + idle
    else if (phase === 'compress') zT = camZBase + idle - Math.pow(progress, params.compressGamma) * push
    else if (phase === 'hold' || phase === 'implode') zT = camZBase + idle - push
    camZ += (zT - camZ) * 0.06
    shakeAmt *= Math.max(0, 1 - dt * 7)
    camera.position.set((Math.random() - 0.5) * shakeAmt, (Math.random() - 0.5) * shakeAmt, camZ)
  }

  function updateFlash(dt: number) {
    if (flashV > 0.002) { flashV *= Math.max(0, 1 - dt * 6); flashEl.style.opacity = String(flashV) }
    else if (flashEl.style.opacity !== '0') flashEl.style.opacity = '0'
  }

  // ----- Interaction → run the cinematic (once) -----
  function startCinematic() {
    if (phase !== 'idle') return
    phase = 'compress'; phaseTime = 0; progress = 0
    overlay.classList.add('is-starting')
  }
  const onInteract = (e: Event) => {
    if (e.type === 'wheel' || e.type === 'touchstart') e.preventDefault()
    startCinematic()
  }
  const onKey = (e: KeyboardEvent) => {
    if (
      e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight' ||
      e.key === ' ' || e.key === 'Enter' || e.key === 'End'
    ) startCinematic()
  }
  window.addEventListener('wheel', onInteract, { passive: false })
  window.addEventListener('touchstart', onInteract, { passive: false })
  window.addEventListener('click', onInteract)
  window.addEventListener('keydown', onKey)

  // ----- Exit: hand the V to the engine WITHOUT a mid-transition dip.
  // A simultaneous opacity crossfade of two stacked layers showing the same V
  // composites to (1 - x + x²) — a ~25% density dip at the midpoint, which reads
  // as the choppy "snap". So we sequence it instead: onExitBegin ramps the engine
  // V up to FULL underneath the still-full cinematic (~0.5s, largely masked by
  // it), THEN the cinematic canvas dissolves over the now-complete, aligned
  // engine V — net V strength stays ≈constant, so the mark never thins out. -----
  let exitTween: gsap.core.Tween | null = null
  function beginExit() {
    if (exiting) return
    exiting = true
    opts.onExitBegin()   // engine V ramps to full FAST (0.2s) + chapter 0 + chrome surface
    // Start dropping the cinematic the INSTANT the V is reassembled — no hold.
    // The engine V's quick 0.2s ramp reaches full before this near-linear fade
    // has dropped much, so the mark still never dips even though the fade begins
    // immediately.
    exitTween = gsap.to(overlay, {
      opacity: 0,
      duration: 0.7,
      ease: 'none',
      onComplete: () => opts.onExitComplete(),
    })
  }

  const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

  // ----- Frame loop -----
  const clock = new THREE.Clock()
  let disposed = false
  let rafId = 0

  function frame() {
    if (disposed) return
    rafId = requestAnimationFrame(frame)
    const dt = Math.min(clock.getDelta(), 0.05)
    const t = clock.elapsedTime
    uniforms.uTime.value = t; cloudUniforms.uTime.value = t * 0.03
    if (phase === 'loading') { composer.render(dt); return }

    const count = params.count
    phaseTime += dt

    if (phase === 'idle' || phase === 'compress') {
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
      uniforms.uGlow.value = params.glow + Math.min(1, phaseTime / params.holdDuration) * 0.5
      if (phaseTime >= params.holdDuration) { phase = 'implode'; phaseTime = 0; scratch.set(word.pos) }
    } else if (phase === 'implode') {
      const k = Math.min(1, phaseTime / params.implodeDuration)
      const s = 1 - params.implodeAmount * k
      for (let i = 0; i < count * 3; i++) posAttr[i] = scratch[i] * s
      if (phaseTime >= params.implodeDuration) {
        phase = 'explode'; phaseTime = 0; bloom.intensity = 1.4
        ringT = params.ringDuration; flashV = params.flashStrength; shakeAmt = params.shakeStrength
        scratch.set(posAttr)
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
      bloom.intensity += (BLOOM_BASE - bloom.intensity) * Math.min(1, dt * 3.5)
      uniforms.uGlow.value += (params.glow - uniforms.uGlow.value) * Math.min(1, dt * 3)
      const k = easeOut(Math.min(1, phaseTime / params.burstDuration))
      for (let i = 0; i < count; i++) {
        const ix = i * 3
        posAttr[ix]     = scratch[ix]     + (vel[ix]     - scratch[ix])     * k
        posAttr[ix + 1] = scratch[ix + 1] + (vel[ix + 1] - scratch[ix + 1]) * k
        posAttr[ix + 2] = scratch[ix + 2] + (vel[ix + 2] - scratch[ix + 2]) * k
        colAttr[ix]     = word.col[ix]     + (vMark.col[ix]     - word.col[ix])     * k
        colAttr[ix + 1] = word.col[ix + 1] + (vMark.col[ix + 1] - word.col[ix + 1]) * k
        colAttr[ix + 2] = word.col[ix + 2] + (vMark.col[ix + 2] - word.col[ix + 2]) * k
      }
      geo.getAttribute('color').needsUpdate = true
      if (phaseTime >= params.burstDuration) { phase = 'reform'; phaseTime = 0; scratch.set(posAttr) }
    } else if (phase === 'reform') {
      bloom.intensity += (BLOOM_BASE - bloom.intensity) * Math.min(1, dt * 3.5)
      const k = easeOut(Math.min(1, phaseTime / params.reformDuration))
      for (let i = 0; i < count; i++) {
        const ix = i * 3
        posAttr[ix]     = scratch[ix]     + (vMark.pos[ix]     - scratch[ix])     * k
        posAttr[ix + 1] = scratch[ix + 1] + (vMark.pos[ix + 1] - scratch[ix + 1]) * k
        posAttr[ix + 2] = scratch[ix + 2] + (vMark.pos[ix + 2] - scratch[ix + 2]) * k
      }
      if (phaseTime >= params.reformDuration) { phase = 'done'; phaseTime = 0; posAttr.set(vMark.pos); colAttr.set(vMark.col); geo.getAttribute('color').needsUpdate = true; triggerIgnite(vMark.pos); beginExit() }
    } else {
      // done — the formed V holds + drifts while the handoff (kicked off the
      // instant we entered this phase) crossfades it into the engine's V.
      const amp = reduceMotion ? 0.002 : 0.005
      for (let i = 0; i < count; i++) {
        const ix = i * 3, dp = i * 0.05
        posAttr[ix]     = vMark.pos[ix]     + Math.sin(t * 0.28 + dp) * amp
        posAttr[ix + 1] = vMark.pos[ix + 1] + Math.cos(t * 0.36 + dp) * amp
        posAttr[ix + 2] = vMark.pos[ix + 2] + Math.sin(t * 0.22 + i * 0.03) * (amp * 0.6)
      }
    }

    geo.getAttribute('position').needsUpdate = true

    buildStreaks(); prevPos.set(posAttr)
    updateIgnite(dt); updateRing(dt); updateCamera(dt); updateFlash(dt)

    composer.render(dt)
  }

  // ----- Boot: build the nebula, load both GLBs, then go idle -----
  const BASE = import.meta.env.BASE_URL
  buildField(params.count)
  let hintTimer = window.setTimeout(() => overlay.classList.add('show-hint'), 1200)
  Promise.all([
    sampleGlb(`${BASE}assets/NevulaLogo3DText.glb`, params.count, WORDMARK_EXTENT),
    sampleGlb(`${BASE}assets/NevulaLogo3D.glb`, params.count, V_EXTENT, GLB_SKIP),
  ]).then(([w, v]) => { word = w; vMark = v; if (!disposed && phase === 'loading') phase = 'idle' })
    .catch(err => {
      // Never strand the user on the intro — fall straight through to chapter 0.
      console.error('[nevula] intro cinematic GLB load failed; skipping intro', err)
      if (!disposed) beginExit()
    })

  frame()

  const onResize = () => {
    const W = window.innerWidth, H = window.innerHeight
    renderer.setSize(W, H, false); composer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); camZBase = introCamZ()
  }
  window.addEventListener('resize', onResize)

  return {
    dispose(): void {
      if (disposed) return
      disposed = true
      cancelAnimationFrame(rafId)
      window.clearTimeout(hintTimer)
      exitTween?.kill()
      window.removeEventListener('wheel', onInteract)
      window.removeEventListener('touchstart', onInteract)
      window.removeEventListener('click', onInteract)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = prevOverflow
      // GL teardown
      if (points) { scene.remove(points); points.geometry.dispose() }
      material.dispose(); cloudMat.dispose(); cloudMesh.geometry.dispose()
      streakGeo.dispose(); (streakSeg.material as THREE.Material).dispose()
      igniteGeo.dispose(); (igniteSeg.material as THREE.Material).dispose()
      ringMesh.geometry.dispose(); ringMat.dispose()
      composer.dispose(); renderer.dispose()
      overlay.remove()
    },
  }
}
