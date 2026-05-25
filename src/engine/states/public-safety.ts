import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import type { StateGenerator } from '../types'

// ============================================================================
// Public Safety GLB — exploded city grid with central monitoring console.
// ============================================================================
// Geometry inventory (built in Blender, exported to public/assets/Public_Safety.glb):
//   - Plate_1..8 + Plate_5.2 + Plate_Core         → 10 district tiles (surface)
//   - Plate_Building{,2..8,7.2,7.3}               → 10 module towers   (surface)
//   - Metacube                                    →  1 central console (WIREFRAME — edges only)
//   - ConnectionFlow1..6                          →  6 data channels   (trail particles)
//
// Particle index layout in the slot buffer:
//   [0, surfaceBudget)                                → surface + metacube-wireframe
//   [surfaceBudget, surfaceBudget + PS_RIDER_COUNT)   → small "rider" particles that bob back-and-forth along the arc lines
//   [count - PS_TRAIL_COUNT, count)                   → ConnectionFlow trail particles
//
// Plus a separate THREE.LineSegments object attached to slot.points (so it
// inherits transforms) — these are the actual GLOWING ARC LINES from
// Plate_Core to a random building. They appear/hold/disappear sporadically
// and bloom (high orange luminance) for the "light trail" effect.
//
// Routing is by object-NAME prefix, NOT by material — materials were assigned
// for Blender viewport clarity but aren't authoritative.

/** Longest-axis target extent in world units after normalization. */
const PS_TARGET_EXTENT = 3.0

/** Edges shorter than this (in normalized space) are dropped from the trail
 *  routing. ConnectionFlow quads have only 4 long edges each (1+ units), so
 *  any reasonable filter keeps all the meaningful routes. */
const PS_MIN_EDGE_LENGTH = 0.05

/** Number of geometry indices reserved at the tail of the buffer for the
 *  ConnectionFlow trail particles. */
export const PS_TRAIL_COUNT = 180

/** Number of rider particles riding the arc lines (back-and-forth). Indices
 *  sit between the surface budget and the trails. */
export const PS_RIDER_COUNT = 16

/** Concurrent arc-line slots. Each slot has its own idle/fadeIn/hold/
 *  fadeOut lifecycle, so only a subset is visible at any time. */
const PS_ARC_SLOT_COUNT = 8

/** Riders per arc slot (PS_ARC_SLOT_COUNT * 2 should equal PS_RIDER_COUNT). */
const RIDERS_PER_SLOT = 2

/** Number of straight-line segments used to draw each bezier arc. Higher =
 *  smoother curve. 28 segments at the arc lengths we use look continuous. */
const ARC_SEGMENTS = 28

/** Of the surface budget, how many particles to dedicate to the Metacube's
 *  wireframe outline (12 cube edges). Treated as a hard cap rather than an
 *  area-weighted share so the cube's silhouette stays crisp. */
const METACUBE_WIREFRAME_BUDGET = 240

// ---- Trail tuning ----------------------------------------------------------
const FADE_IN_SEC = 0.45
const FADE_OUT_SEC = 0.7
/** Connection-flow trail base velocity (world-units / sec). Tuned UP from 0.06
 *  so the data packets read as actively zipping through the network rather
 *  than ambient drift. */
const WORLD_VELOCITY_BASE = 0.14
const WORLD_VELOCITY_VARIANCE = 0.35
const MIN_EDGES_PER_TRAIL = 2
const MAX_EDGES_PER_TRAIL = 4
const SPAWN_T_MAX = 0.5

/** Color override for connection-flow trail particles. The FlowMat baked into
 *  the GLB is bright orange (luminance ~0.53) which crosses the bloom
 *  threshold and produces visible halos as the trails move. This muted amber
 *  (luminance ~0.27) reads as warm/active but stays below the bloom curve. */
const FLOW_TRAIL_COLOR = new THREE.Color(0.55, 0.25, 0.08)

/** Color for arc light lines (Plate_Core → buildings) at full alpha. Bright
 *  orange — these are the "light" element + intended to bloom. */
const ARC_LINE_COLOR = new THREE.Color(1.0, 0.55, 0.15)

/** Color for the small particle riders that travel back-and-forth along the
 *  arc lines. Slightly brighter / whiter than the line so they read as
 *  "embers" moving inside the glow. */
const ARC_RIDER_COLOR = new THREE.Color(1.0, 0.78, 0.42)

/** Per-particle aSize for the trail particles + the arc riders while in
 *  public-safety state. aSize multiplies uSize in the shader; default random
 *  aSize is 0.6–2.2, so these bumps make trails/riders read distinctly
 *  against the small surface dots. */
const FLOW_TRAIL_SIZE_MULTIPLIER = 3.4
const ARC_RIDER_SIZE_MULTIPLIER = 3.0

// ---- Arc tuning ------------------------------------------------------------
const ARC_HOLD_MIN_SEC = 0.9
const ARC_HOLD_MAX_SEC = 1.7
const ARC_FADE_IN_SEC = 0.4
const ARC_FADE_OUT_SEC = 0.6
const ARC_IDLE_MIN_SEC = 0.6
const ARC_IDLE_MAX_SEC = 3.4
/** How high above the source-destination midpoint the bezier control point
 *  sits (in normalized scene units). Higher = more dramatic arc. */
const ARC_HEIGHT_MIN = 0.5
const ARC_HEIGHT_MAX = 1.0

/** Rider velocity along the arc in t-units per second. Slow + back-and-forth:
 *  full traversal takes ~5 seconds, so it reads as embers drifting through
 *  the line, not racing. */
const RIDER_BASE_SPEED = 0.18
const RIDER_SPEED_VARIANCE = 0.5

// ----------------------------------------------------------------------------
// Mesh classification by name prefix.
// ----------------------------------------------------------------------------
function isSurfaceMeshName(name: string): boolean {
  if (name === 'Metacube') return true
  if (name.startsWith('Plate_Building')) return true
  if (name.startsWith('Plate_')) return true
  return false
}

function isTrailMeshName(name: string): boolean {
  return name.startsWith('ConnectionFlow')
}

function isMetacube(name: string): boolean {
  return name === 'Metacube'
}

function isPlateCore(name: string): boolean {
  return name === 'Plate_Core'
}

function isBuilding(name: string): boolean {
  return name.startsWith('Plate_Building')
}

// ----------------------------------------------------------------------------
// Internal records.
// ----------------------------------------------------------------------------
interface SurfaceMeshRecord {
  mesh: THREE.Mesh
  /** Null when the mesh is wireframe-only (Metacube). */
  sampler: MeshSurfaceSampler | null
  color: THREE.Color
  area: number
  mode: 'surface' | 'wireframe'
}

interface TrailEdge {
  start: THREE.Vector3
  end: THREE.Vector3
  color: THREE.Color
  length: number
  startKey: string
  endKey: string
}

interface PublicSafetyGlb {
  scene: THREE.Object3D
  mixer: THREE.AnimationMixer | null
  surfaceMeshes: SurfaceMeshRecord[]
  totalSurfaceArea: number
  center: THREE.Vector3
  scale: number
  edges: TrailEdge[]
  vertexEdges: Map<string, number[]>
  plateCoreIdx: number
  buildingIndices: number[]
}

interface ParticleSample {
  meshIdx: number
  localPos: THREE.Vector3
}

let _glb: PublicSafetyGlb | null = null
let _samples: ParticleSample[] | null = null
let _cachedColors: Float32Array | null = null

export function getPublicSafetyCachedColors(): Float32Array | null {
  return _cachedColors
}

// ============================================================================
// Preload — fetch GLB, classify meshes, build samplers + edge graph, wire
// up the AnimationMixer.
// ============================================================================
export async function preloadPublicSafetyGlb(url: string): Promise<void> {
  if (_glb) return
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(url)
  const scene = gltf.scene
  scene.updateMatrixWorld(true)

  const surfaceMeshes: SurfaceMeshRecord[] = []
  const trailMeshRefs: { mesh: THREE.Mesh, color: THREE.Color }[] = []

  scene.traverse(obj => {
    const m = obj as THREE.Mesh
    if (!(m as unknown as { isMesh?: boolean }).isMesh) return
    const mat = Array.isArray(m.material) ? m.material[0] : m.material
    const color = (mat as THREE.MeshStandardMaterial)?.color?.clone()
      ?? new THREE.Color('#5a7a9a')
    if (isSurfaceMeshName(m.name)) {
      const wireframe = isMetacube(m.name)
      surfaceMeshes.push({
        mesh: m,
        sampler: wireframe ? null : new MeshSurfaceSampler(m).build(),
        color,
        area: computeMeshArea(m),
        mode: wireframe ? 'wireframe' : 'surface',
      })
    } else if (isTrailMeshName(m.name)) {
      trailMeshRefs.push({ mesh: m, color })
    }
  })

  const bbox = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3()
  bbox.getCenter(center)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = PS_TARGET_EXTENT / maxDim

  const edges = extractEdges(trailMeshRefs, center, scale)
  edges.sort((a, b) => b.length - a.length)

  const vertexEdges = new Map<string, number[]>()
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]
    if (!vertexEdges.has(e.startKey)) vertexEdges.set(e.startKey, [])
    if (!vertexEdges.has(e.endKey))   vertexEdges.set(e.endKey, [])
    vertexEdges.get(e.startKey)!.push(i)
    vertexEdges.get(e.endKey)!.push(i)
  }

  let plateCoreIdx = -1
  const buildingIndices: number[] = []
  for (let i = 0; i < surfaceMeshes.length; i++) {
    const name = surfaceMeshes[i].mesh.name
    if (isPlateCore(name)) plateCoreIdx = i
    if (isBuilding(name)) buildingIndices.push(i)
  }

  let mixer: THREE.AnimationMixer | null = null
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(scene)
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip)
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.play()
    }
  }

  const totalSurfaceArea = surfaceMeshes.reduce(
    (s, m) => (m.mode === 'surface' ? s + m.area : s), 0,
  ) || 1

  _glb = {
    scene, mixer, surfaceMeshes, totalSurfaceArea,
    center, scale, edges, vertexEdges,
    plateCoreIdx, buildingIndices,
  }
}

function posKey(v: THREE.Vector3): string {
  const q = (n: number) => Math.round(n * 1000) / 1000
  return q(v.x) + ',' + q(v.y) + ',' + q(v.z)
}

function extractEdges(
  meshRefs: { mesh: THREE.Mesh; color: THREE.Color }[],
  center: THREE.Vector3,
  scale: number,
): TrailEdge[] {
  const out: TrailEdge[] = []
  const tmp = new THREE.Vector3()
  for (const { mesh, color } of meshRefs) {
    const geom = mesh.geometry as THREE.BufferGeometry
    const pos = geom.getAttribute('position').array as Float32Array
    const index = geom.index?.array
    const matrix = mesh.matrixWorld
    const vCount = pos.length / 3
    const verts: THREE.Vector3[] = new Array(vCount)
    for (let v = 0; v < vCount; v++) {
      verts[v] = new THREE.Vector3().fromArray(pos, v * 3)
        .applyMatrix4(matrix).sub(center).multiplyScalar(scale)
    }
    const seen = new Set<string>()
    const addEdge = (a: number, b: number) => {
      const lo = Math.min(a, b), hi = Math.max(a, b)
      const k = lo + '-' + hi
      if (seen.has(k)) return
      seen.add(k)
      const s = verts[lo], e = verts[hi]
      tmp.subVectors(e, s)
      const length = tmp.length()
      if (length < PS_MIN_EDGE_LENGTH) return
      out.push({
        start: s.clone(), end: e.clone(), color, length,
        startKey: posKey(s), endKey: posKey(e),
      })
    }
    if (index) {
      for (let i = 0; i < index.length; i += 3) {
        addEdge(index[i], index[i + 1])
        addEdge(index[i + 1], index[i + 2])
        addEdge(index[i + 2], index[i])
      }
    } else {
      for (let i = 0; i < vCount; i += 3) {
        addEdge(i, i + 1); addEdge(i + 1, i + 2); addEdge(i + 2, i)
      }
    }
  }
  return out
}

function computeMeshArea(mesh: THREE.Mesh): number {
  const geom = mesh.geometry as THREE.BufferGeometry
  const pos = geom.getAttribute('position').array as Float32Array
  const idx = geom.index?.array
  const matrix = mesh.matrixWorld
  let area = 0
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3()
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), cross = new THREE.Vector3()
  if (idx) {
    for (let i = 0; i < idx.length; i += 3) {
      a.fromArray(pos, idx[i]     * 3).applyMatrix4(matrix)
      b.fromArray(pos, idx[i + 1] * 3).applyMatrix4(matrix)
      c.fromArray(pos, idx[i + 2] * 3).applyMatrix4(matrix)
      ab.subVectors(b, a); ac.subVectors(c, a); cross.crossVectors(ab, ac)
      area += cross.length() * 0.5
    }
  } else {
    for (let i = 0; i < pos.length; i += 9) {
      a.fromArray(pos, i).applyMatrix4(matrix)
      b.fromArray(pos, i + 3).applyMatrix4(matrix)
      c.fromArray(pos, i + 6).applyMatrix4(matrix)
      ab.subVectors(b, a); ac.subVectors(c, a); cross.crossVectors(ab, ac)
      area += cross.length() * 0.5
    }
  }
  return area
}

function sampleMeshEdgesLocal(mesh: THREE.Mesh, count: number): THREE.Vector3[] {
  const geom = mesh.geometry as THREE.BufferGeometry
  const pos = geom.getAttribute('position').array as Float32Array
  const index = geom.index?.array
  const vCount = pos.length / 3
  const verts: THREE.Vector3[] = new Array(vCount)
  for (let v = 0; v < vCount; v++) {
    verts[v] = new THREE.Vector3().fromArray(pos, v * 3)
  }
  const seen = new Set<string>()
  const edges: { a: THREE.Vector3; b: THREE.Vector3; length: number }[] = []
  const addEdge = (i: number, j: number) => {
    const lo = Math.min(i, j), hi = Math.max(i, j)
    const k = lo + '-' + hi
    if (seen.has(k)) return
    seen.add(k)
    const va = verts[lo], vb = verts[hi]
    edges.push({ a: va, b: vb, length: va.distanceTo(vb) })
  }
  if (index) {
    for (let i = 0; i < index.length; i += 3) {
      addEdge(index[i], index[i + 1])
      addEdge(index[i + 1], index[i + 2])
      addEdge(index[i + 2], index[i])
    }
  } else {
    for (let i = 0; i < vCount; i += 3) {
      addEdge(i, i + 1); addEdge(i + 1, i + 2); addEdge(i + 2, i)
    }
  }
  const totalLen = edges.reduce((s, e) => s + e.length, 0) || 1
  const out: THREE.Vector3[] = []
  for (const e of edges) {
    const n = Math.max(1, Math.round((e.length / totalLen) * count))
    for (let i = 0; i < n && out.length < count; i++) {
      const t = (i + 0.5) / n
      out.push(new THREE.Vector3().lerpVectors(e.a, e.b, t))
    }
  }
  while (out.length < count && out.length > 0) out.push(out[out.length - 1].clone())
  return out
}

// ============================================================================
// Initial particle generation.
// ============================================================================
function genFromGlb(count: number, glb: PublicSafetyGlb): Float32Array {
  const arr = new Float32Array(count * 3)
  const samples: ParticleSample[] = new Array(count)
  const tmp = new THREE.Vector3()

  const surfaceBudget = Math.max(0, count - PS_RIDER_COUNT - PS_TRAIL_COUNT)
  const riderStart = surfaceBudget
  const trailStart = count - PS_TRAIL_COUNT

  const metacubeIdx = glb.surfaceMeshes.findIndex(m => m.mode === 'wireframe')
  const wireframeBudget = metacubeIdx >= 0
    ? Math.min(METACUBE_WIREFRAME_BUDGET, Math.floor(surfaceBudget / 2))
    : 0
  const otherSurfaceBudget = surfaceBudget - wireframeBudget

  let cursor = 0

  const otherTotal = glb.surfaceMeshes.reduce(
    (s, m) => (m.mode === 'surface' ? s + m.area : s), 0,
  ) || 1
  const surfaceOrder: number[] = []
  for (let mi = 0; mi < glb.surfaceMeshes.length; mi++) {
    if (glb.surfaceMeshes[mi].mode === 'surface') surfaceOrder.push(mi)
  }

  for (let oi = 0; oi < surfaceOrder.length; oi++) {
    const mi = surfaceOrder[oi]
    const m = glb.surfaceMeshes[mi]
    const isLast = oi === surfaceOrder.length - 1
    const n = isLast
      ? otherSurfaceBudget - cursor
      : Math.round((m.area / otherTotal) * otherSurfaceBudget)
    for (let i = 0; i < n && cursor < otherSurfaceBudget; i++) {
      const localPos = new THREE.Vector3()
      m.sampler!.sample(localPos)
      tmp.copy(localPos).applyMatrix4(m.mesh.matrixWorld)
      tmp.sub(glb.center).multiplyScalar(glb.scale)
      arr[cursor * 3]     = tmp.x
      arr[cursor * 3 + 1] = tmp.y
      arr[cursor * 3 + 2] = tmp.z
      samples[cursor] = { meshIdx: mi, localPos }
      cursor++
    }
  }
  while (cursor < otherSurfaceBudget) {
    const j = cursor === 0 ? 0 : cursor - 1
    arr[cursor * 3]     = arr[j * 3]
    arr[cursor * 3 + 1] = arr[j * 3 + 1]
    arr[cursor * 3 + 2] = arr[j * 3 + 2]
    samples[cursor] = samples[j] ?? { meshIdx: -1, localPos: new THREE.Vector3() }
    cursor++
  }

  // Metacube wireframe samples.
  if (metacubeIdx >= 0 && wireframeBudget > 0) {
    const metacube = glb.surfaceMeshes[metacubeIdx]
    const edgePoints = sampleMeshEdgesLocal(metacube.mesh, wireframeBudget)
    for (let i = 0; i < edgePoints.length && cursor < surfaceBudget; i++) {
      const localPos = edgePoints[i]
      tmp.copy(localPos).applyMatrix4(metacube.mesh.matrixWorld)
      tmp.sub(glb.center).multiplyScalar(glb.scale)
      arr[cursor * 3]     = tmp.x
      arr[cursor * 3 + 1] = tmp.y
      arr[cursor * 3 + 2] = tmp.z
      samples[cursor] = { meshIdx: metacubeIdx, localPos }
      cursor++
    }
  }
  while (cursor < surfaceBudget) {
    const j = cursor === 0 ? 0 : cursor - 1
    arr[cursor * 3]     = arr[j * 3]
    arr[cursor * 3 + 1] = arr[j * 3 + 1]
    arr[cursor * 3 + 2] = arr[j * 3 + 2]
    samples[cursor] = samples[j] ?? { meshIdx: -1, localPos: new THREE.Vector3() }
    cursor++
  }

  // Rider particles — seed at Plate_Core (will be overwritten by tick).
  const plateCore = glb.plateCoreIdx >= 0 ? glb.surfaceMeshes[glb.plateCoreIdx] : null
  const seedPos = new THREE.Vector3()
  if (plateCore) {
    plateCore.mesh.getWorldPosition(seedPos)
    seedPos.sub(glb.center).multiplyScalar(glb.scale)
  }
  for (let i = riderStart; i < trailStart; i++) {
    arr[i * 3]     = seedPos.x
    arr[i * 3 + 1] = seedPos.y
    arr[i * 3 + 2] = seedPos.z
    samples[i] = { meshIdx: -1, localPos: new THREE.Vector3() }
  }

  // Flow-trail particles — seed along random edges.
  for (let i = trailStart; i < count; i++) {
    if (glb.edges.length > 0) {
      const edge = glb.edges[Math.floor(Math.random() * glb.edges.length)]
      const tt = Math.random()
      arr[i * 3]     = edge.start.x + (edge.end.x - edge.start.x) * tt
      arr[i * 3 + 1] = edge.start.y + (edge.end.y - edge.start.y) * tt
      arr[i * 3 + 2] = edge.start.z + (edge.end.z - edge.start.z) * tt
    } else {
      arr[i * 3] = 0; arr[i * 3 + 1] = 0; arr[i * 3 + 2] = 0
    }
    samples[i] = { meshIdx: -1, localPos: new THREE.Vector3() }
  }

  _samples = samples
  _cachedColors = null
  return arr
}

export const genPublicSafety: StateGenerator = (count) => {
  if (_glb) return genFromGlb(count, _glb)
  console.warn('[nevula] public-safety GLB not loaded; emitting fallback positions')
  _cachedColors = null
  _samples = null
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    arr[i * 3]     = (Math.random() - 0.5) * 1.6
    arr[i * 3 + 1] = (Math.random() - 0.5) * 1.6
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4
  }
  return arr
}

// ============================================================================
// Per-frame animation tick — advances the AnimationMixer + re-transforms
// each surface/wireframe particle by its mesh's animated worldMatrix.
// ============================================================================
const _tmpV = new THREE.Vector3()

export function tickPublicSafetyAnimation(
  targetPos: Float32Array,
  particleCount: number,
  dt: number,
): boolean {
  if (!_glb || !_samples) return false
  if (_glb.mixer) {
    _glb.mixer.update(dt)
    _glb.scene.updateMatrixWorld(true)
  }
  const surfaceBudget = Math.max(0, particleCount - PS_RIDER_COUNT - PS_TRAIL_COUNT)
  for (let i = 0; i < surfaceBudget; i++) {
    const sp = _samples[i]
    if (!sp || sp.meshIdx < 0) continue
    const m = _glb.surfaceMeshes[sp.meshIdx]
    if (!m) continue
    _tmpV.copy(sp.localPos)
      .applyMatrix4(m.mesh.matrixWorld)
      .sub(_glb.center)
      .multiplyScalar(_glb.scale)
    targetPos[i * 3]     = _tmpV.x
    targetPos[i * 3 + 1] = _tmpV.y
    targetPos[i * 3 + 2] = _tmpV.z
  }
  return true
}

// ============================================================================
// ConnectionFlow trail particles.
// ============================================================================
interface TrailParticle {
  edgeIx: number
  reverse: boolean
  t: number
  velocity: number
  phase: 'fadeIn' | 'travel' | 'fadeOut'
  phaseStart: number
  edgesTraversed: number
  maxEdges: number
  prevEdgeIx: number
}

let _trails: TrailParticle[] = []
let _lastTrailT = 0

function pickEdgeIndex(edgeCount: number): number {
  const r = Math.pow(Math.random(), 1.4)
  return Math.floor(r * edgeCount) % edgeCount
}

function spawnTrail(now: number, edgeCount: number): TrailParticle {
  const velocity =
    WORLD_VELOCITY_BASE * (1 - WORLD_VELOCITY_VARIANCE / 2 + Math.random() * WORLD_VELOCITY_VARIANCE)
  return {
    edgeIx: pickEdgeIndex(edgeCount),
    reverse: Math.random() < 0.5,
    t: Math.random() * SPAWN_T_MAX,
    velocity,
    phase: 'fadeIn',
    phaseStart: now,
    edgesTraversed: 0,
    maxEdges: MIN_EDGES_PER_TRAIL + Math.floor(Math.random() * (MAX_EDGES_PER_TRAIL - MIN_EDGES_PER_TRAIL + 1)),
    prevEdgeIx: -1,
  }
}

function pickNextEdge(
  currentIx: number,
  prevIx: number,
  destKey: string,
): { ix: number; reverse: boolean } | null {
  if (!_glb) return null
  const connected = _glb.vertexEdges.get(destKey)
  if (!connected || connected.length === 0) return null
  type Cand = { ix: number; reverse: boolean }
  const main: Cand[] = []
  const fallback: Cand[] = []
  for (const ix of connected) {
    if (ix === currentIx) continue
    const e = _glb.edges[ix]
    const cand: Cand | null =
      e.startKey === destKey ? { ix, reverse: false } :
      e.endKey   === destKey ? { ix, reverse: true  } : null
    if (!cand) continue
    if (ix === prevIx) fallback.push(cand)
    else main.push(cand)
  }
  const pool = main.length > 0 ? main : fallback
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

export function tickPublicSafetyTrails(
  geo: THREE.BufferGeometry,
  particleCount: number,
  t: number,
): boolean {
  if (!_glb || _glb.edges.length === 0) return false
  if (_trails.length === 0) {
    for (let i = 0; i < PS_TRAIL_COUNT; i++) {
      _trails.push(spawnTrail(t, _glb.edges.length))
    }
    _lastTrailT = t
  }
  const dt = Math.min(0.1, Math.max(0, t - _lastTrailT))
  _lastTrailT = t

  const positions = geo.getAttribute('position').array as Float32Array
  const colors = geo.getAttribute('color').array as Float32Array
  const alphas = geo.getAttribute('aAlpha').array as Float32Array
  const sizeAttr = geo.getAttribute('aSize')
  const sizes = sizeAttr.array as Float32Array

  const startIx = particleCount - _trails.length
  if (startIx < 0) return false

  for (let i = 0; i < _trails.length; i++) {
    const trail = _trails[i]
    let edge = _glb.edges[trail.edgeIx]
    if (!edge) {
      _trails[i] = spawnTrail(t, _glb.edges.length)
      continue
    }
    const tSpeed = edge.length > 1e-6 ? trail.velocity / edge.length : 1
    trail.t += tSpeed * dt
    if (trail.phase !== 'fadeOut' && trail.t >= 1) {
      trail.edgesTraversed++
      if (trail.edgesTraversed >= trail.maxEdges) {
        trail.phase = 'fadeOut'; trail.phaseStart = t; trail.t = 1
      } else {
        const destKey = trail.reverse ? edge.startKey : edge.endKey
        const next = pickNextEdge(trail.edgeIx, trail.prevEdgeIx, destKey)
        if (next) {
          trail.prevEdgeIx = trail.edgeIx
          trail.edgeIx = next.ix
          trail.reverse = next.reverse
          trail.t -= 1
          if (trail.t < 0) trail.t = 0
          edge = _glb.edges[trail.edgeIx]
        } else {
          trail.phase = 'fadeOut'; trail.phaseStart = t; trail.t = 1
        }
      }
    }
    const phaseAge = t - trail.phaseStart
    let fade = 1
    if (trail.phase === 'fadeIn') {
      fade = Math.min(1, phaseAge / FADE_IN_SEC)
      if (phaseAge >= FADE_IN_SEC) {
        trail.phase = 'travel'; trail.phaseStart = t
      }
    } else if (trail.phase === 'fadeOut') {
      fade = Math.max(0, 1 - phaseAge / FADE_OUT_SEC)
      if (phaseAge >= FADE_OUT_SEC) {
        _trails[i] = spawnTrail(t, _glb.edges.length)
        continue
      }
    }
    const tt = trail.t < 0 ? 0 : trail.t > 1 ? 1 : trail.t
    const sX = trail.reverse ? edge.end.x   : edge.start.x
    const sY = trail.reverse ? edge.end.y   : edge.start.y
    const sZ = trail.reverse ? edge.end.z   : edge.start.z
    const eX = trail.reverse ? edge.start.x : edge.end.x
    const eY = trail.reverse ? edge.start.y : edge.end.y
    const eZ = trail.reverse ? edge.start.z : edge.end.z
    const pIx = startIx + i
    positions[pIx * 3]     = sX + (eX - sX) * tt
    positions[pIx * 3 + 1] = sY + (eY - sY) * tt
    positions[pIx * 3 + 2] = sZ + (eZ - sZ) * tt
    colors[pIx * 3]     = FLOW_TRAIL_COLOR.r
    colors[pIx * 3 + 1] = FLOW_TRAIL_COLOR.g
    colors[pIx * 3 + 2] = FLOW_TRAIL_COLOR.b
    alphas[pIx] = fade
    sizes[pIx] = FLOW_TRAIL_SIZE_MULTIPLIER
  }
  sizeAttr.needsUpdate = true
  return true
}

// ============================================================================
// Arc light-lines — real THREE.LineSegments with additive blending so they
// glow + bloom. Plate_Core → random building, bezier curve, sporadic.
//
// Plus a small particle riding each line, bobbing back-and-forth slowly.
// ============================================================================
interface ArcSlot {
  buildingIdx: number
  phase: 'idle' | 'fadeIn' | 'hold' | 'fadeOut'
  phaseStart: number
  phaseDuration: number
  arcHeight: number
  /** Pre-computed bezier vertices in normalized scene-space, refreshed at the
   *  start of each new fadeIn (and during hold so the source/dest follow the
   *  animated mesh positions). Length = ARC_SEGMENTS + 1. */
  pts: THREE.Vector3[]
}

interface ArcRider {
  slotIx: number
  t: number          // 0..1 position along the bezier
  velocity: number   // signed; reverses at the endpoints
}

/** Per-slot Line object + its dedicated material. Each slot gets its own
 *  THREE.Line (a connected polyline, not LineSegments) so we can drive its
 *  alpha via material.opacity — that's the correct way to fade a line on
 *  top of additive blending. Encoding alpha into per-vertex colors instead
 *  produces visible BLACK lines when alpha=0 because LineBasicMaterial
 *  doesn't multiply rgb by alpha automatically. */
interface ArcLineRecord {
  line: THREE.Line
  material: THREE.LineBasicMaterial
  positionAttr: THREE.BufferAttribute
}

let _arcSlots: ArcSlot[] = []
let _arcRiders: ArcRider[] = []
let _arcLineRecords: ArcLineRecord[] = []
let _arcParent: THREE.Object3D | null = null
const _arcSource = new THREE.Vector3()
const _arcDest = new THREE.Vector3()

function newArcConfig(): { buildingIdx: number; arcHeight: number; holdSec: number } {
  if (!_glb || _glb.buildingIndices.length === 0) {
    return { buildingIdx: -1, arcHeight: ARC_HEIGHT_MIN, holdSec: ARC_HOLD_MIN_SEC }
  }
  const buildingIdx = _glb.buildingIndices[Math.floor(Math.random() * _glb.buildingIndices.length)]
  const arcHeight = ARC_HEIGHT_MIN + Math.random() * (ARC_HEIGHT_MAX - ARC_HEIGHT_MIN)
  const holdSec = ARC_HOLD_MIN_SEC + Math.random() * (ARC_HOLD_MAX_SEC - ARC_HOLD_MIN_SEC)
  return { buildingIdx, arcHeight, holdSec }
}

function newRider(slotIx: number): ArcRider {
  const speed = RIDER_BASE_SPEED * (1 + (Math.random() - 0.5) * RIDER_SPEED_VARIANCE)
  return {
    slotIx,
    t: Math.random(),
    velocity: Math.random() < 0.5 ? speed : -speed,
  }
}

function makeEmptySlot(now: number): ArcSlot {
  return {
    buildingIdx: -1,
    phase: 'idle',
    phaseStart: now,
    phaseDuration: ARC_IDLE_MIN_SEC + Math.random() * (ARC_IDLE_MAX_SEC - ARC_IDLE_MIN_SEC),
    arcHeight: ARC_HEIGHT_MIN,
    pts: new Array(ARC_SEGMENTS + 1).fill(null).map(() => new THREE.Vector3()),
  }
}

/** Recompute the arc's pts[] from current source/dest mesh positions. Called
 *  at the start of fadeIn and every frame during hold/fadeOut so the line
 *  follows the animated meshes. */
function refreshArcPoints(slot: ArcSlot): void {
  if (!_glb || _glb.plateCoreIdx < 0) return
  const src = _glb.surfaceMeshes[_glb.plateCoreIdx]
  src.mesh.getWorldPosition(_arcSource)
  _arcSource.sub(_glb.center).multiplyScalar(_glb.scale)

  if (slot.buildingIdx < 0 || slot.buildingIdx >= _glb.surfaceMeshes.length) return
  const dst = _glb.surfaceMeshes[slot.buildingIdx]
  dst.mesh.getWorldPosition(_arcDest)
  _arcDest.sub(_glb.center).multiplyScalar(_glb.scale)

  const midX = (_arcSource.x + _arcDest.x) * 0.5
  const midY = (_arcSource.y + _arcDest.y) * 0.5 + slot.arcHeight
  const midZ = (_arcSource.z + _arcDest.z) * 0.5

  for (let i = 0; i <= ARC_SEGMENTS; i++) {
    const tt = i / ARC_SEGMENTS
    const u = 1 - tt, u2 = u * u, tt2 = tt * tt, _2ut = 2 * u * tt
    slot.pts[i].set(
      u2 * _arcSource.x + _2ut * midX + tt2 * _arcDest.x,
      u2 * _arcSource.y + _2ut * midY + tt2 * _arcDest.y,
      u2 * _arcSource.z + _2ut * midZ + tt2 * _arcDest.z,
    )
  }
}

function evaluateBezier(slot: ArcSlot, t: number, out: THREE.Vector3): void {
  // Interpolate within the pre-computed pts (faster than full bezier eval).
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t
  const f = clamped * ARC_SEGMENTS
  const i = Math.min(ARC_SEGMENTS - 1, Math.floor(f))
  const frac = f - i
  const a = slot.pts[i]
  const b = slot.pts[i + 1]
  out.set(
    a.x + (b.x - a.x) * frac,
    a.y + (b.y - a.y) * frac,
    a.z + (b.z - a.z) * frac,
  )
}

function ensureArcLines(parent: THREE.Object3D): void {
  if (_arcLineRecords.length > 0 && _arcParent === parent) return
  if (_arcLineRecords.length > 0 && _arcParent !== parent) {
    for (const rec of _arcLineRecords) _arcParent?.remove(rec.line)
    _arcLineRecords = []
  }
  for (let i = 0; i < PS_ARC_SLOT_COUNT; i++) {
    const vCount = ARC_SEGMENTS + 1
    const positions = new Float32Array(vCount * 3)
    const geo = new THREE.BufferGeometry()
    const posAttr = new THREE.BufferAttribute(positions, 3)
    geo.setAttribute('position', posAttr)
    const mat = new THREE.LineBasicMaterial({
      color: ARC_LINE_COLOR.getHex(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0,  // start hidden; tick will set each frame based on phase
    })
    const line = new THREE.Line(geo, mat)
    line.frustumCulled = false
    line.renderOrder = 1  // draw lines after the points so they sit on top
    parent.add(line)
    _arcLineRecords.push({ line, material: mat, positionAttr: posAttr })
  }
  _arcParent = parent
}

export function tickPublicSafetyArcs(
  geo: THREE.BufferGeometry,
  particleCount: number,
  parent: THREE.Object3D,
  t: number,
): boolean {
  if (!_glb || _glb.plateCoreIdx < 0 || _glb.buildingIndices.length === 0) return false

  ensureArcLines(parent)
  if (_arcLineRecords.length === 0) return false

  // Initialize slots + riders on first call.
  if (_arcSlots.length === 0) {
    for (let i = 0; i < PS_ARC_SLOT_COUNT; i++) _arcSlots.push(makeEmptySlot(t))
    for (let i = 0; i < PS_ARC_SLOT_COUNT; i++) {
      for (let r = 0; r < RIDERS_PER_SLOT; r++) _arcRiders.push(newRider(i))
    }
  }

  for (let si = 0; si < _arcSlots.length; si++) {
    const slot = _arcSlots[si]
    const rec = _arcLineRecords[si]
    const phaseAge = t - slot.phaseStart
    let alpha = 0

    if (slot.phase === 'idle') {
      alpha = 0
      if (phaseAge >= slot.phaseDuration) {
        const cfg = newArcConfig()
        slot.buildingIdx = cfg.buildingIdx
        slot.arcHeight = cfg.arcHeight
        slot.phase = 'fadeIn'
        slot.phaseStart = t
        slot.phaseDuration = ARC_FADE_IN_SEC
        ;(slot as ArcSlot & { __holdSec?: number }).__holdSec = cfg.holdSec
        refreshArcPoints(slot)
      }
    } else if (slot.phase === 'fadeIn') {
      alpha = Math.min(1, phaseAge / slot.phaseDuration)
      refreshArcPoints(slot)
      if (phaseAge >= slot.phaseDuration) {
        slot.phase = 'hold'
        slot.phaseStart = t
        slot.phaseDuration = (slot as ArcSlot & { __holdSec?: number }).__holdSec ?? ARC_HOLD_MIN_SEC
      }
    } else if (slot.phase === 'hold') {
      alpha = 1
      refreshArcPoints(slot)
      if (phaseAge >= slot.phaseDuration) {
        slot.phase = 'fadeOut'
        slot.phaseStart = t
        slot.phaseDuration = ARC_FADE_OUT_SEC
      }
    } else {
      // fadeOut
      alpha = Math.max(0, 1 - phaseAge / slot.phaseDuration)
      refreshArcPoints(slot)
      if (phaseAge >= slot.phaseDuration) {
        slot.phase = 'idle'
        slot.phaseStart = t
        slot.phaseDuration = ARC_IDLE_MIN_SEC + Math.random() * (ARC_IDLE_MAX_SEC - ARC_IDLE_MIN_SEC)
      }
    }

    // Drive opacity via material — no premultiply-into-color hack, no black
    // lines when alpha=0. Setting visible=false at zero opacity avoids the
    // line being submitted to the GPU at all.
    rec.material.opacity = alpha
    rec.line.visible = alpha > 0.001

    // Write the polyline vertices (one per bezier sample point).
    if (rec.line.visible) {
      const linePos = rec.positionAttr.array as Float32Array
      for (let i = 0; i <= ARC_SEGMENTS; i++) {
        const p = slot.pts[i]
        linePos[i * 3]     = p.x
        linePos[i * 3 + 1] = p.y
        linePos[i * 3 + 2] = p.z
      }
      rec.positionAttr.needsUpdate = true
    }
  }

  // ---- Update rider particles.
  const positions = geo.getAttribute('position').array as Float32Array
  const colors = geo.getAttribute('color').array as Float32Array
  const alphas = geo.getAttribute('aAlpha').array as Float32Array
  const sizeAttr = geo.getAttribute('aSize')
  const sizes = sizeAttr.array as Float32Array

  const dt = 0.016  // approximate frame dt; riders only move slowly so jitter doesn't matter
  const riderStart = particleCount - PS_TRAIL_COUNT - PS_RIDER_COUNT
  if (riderStart < 0) return true

  const tmpRider = new THREE.Vector3()
  for (let i = 0; i < _arcRiders.length && i < PS_RIDER_COUNT; i++) {
    const rider = _arcRiders[i]
    const slot = _arcSlots[rider.slotIx]
    const pIx = riderStart + i
    if (!slot || slot.phase === 'idle') {
      alphas[pIx] = 0
      sizes[pIx] = ARC_RIDER_SIZE_MULTIPLIER
      continue
    }
    // Step + bounce.
    rider.t += rider.velocity * dt
    if (rider.t < 0)       { rider.t = 0; rider.velocity = -rider.velocity }
    else if (rider.t > 1)  { rider.t = 1; rider.velocity = -rider.velocity }
    evaluateBezier(slot, rider.t, tmpRider)
    positions[pIx * 3]     = tmpRider.x
    positions[pIx * 3 + 1] = tmpRider.y
    positions[pIx * 3 + 2] = tmpRider.z
    colors[pIx * 3]     = ARC_RIDER_COLOR.r
    colors[pIx * 3 + 1] = ARC_RIDER_COLOR.g
    colors[pIx * 3 + 2] = ARC_RIDER_COLOR.b
    // Fade rider alpha with the arc's alpha so they don't pop on idle→fadeIn.
    let arcAlpha = 0
    if (slot.phase === 'fadeIn')  arcAlpha = Math.min(1, (t - slot.phaseStart) / slot.phaseDuration)
    else if (slot.phase === 'hold') arcAlpha = 1
    else if (slot.phase === 'fadeOut') arcAlpha = Math.max(0, 1 - (t - slot.phaseStart) / slot.phaseDuration)
    alphas[pIx] = arcAlpha
    sizes[pIx] = ARC_RIDER_SIZE_MULTIPLIER
  }
  sizeAttr.needsUpdate = true
  return true
}

/**
 * Reset internal trail/arc state. Also restores aSize for the rider + trail
 * indices back to the default 0.6–2.2 random range so they don't render as
 * "fat dots" in the next state. Removes the arc-lines mesh from its parent
 * to keep the scene clean.
 */
export function resetPublicSafetyTrails(geo?: THREE.BufferGeometry, count?: number): void {
  _trails = []
  _lastTrailT = 0
  _arcSlots = []
  _arcRiders = []
  if (_arcLineRecords.length > 0 && _arcParent) {
    for (const rec of _arcLineRecords) {
      _arcParent.remove(rec.line)
      rec.line.geometry.dispose()
      rec.material.dispose()
    }
    _arcLineRecords = []
    _arcParent = null
  }
  if (geo && count != null) {
    const sizeAttr = geo.getAttribute('aSize')
    if (sizeAttr) {
      const sizes = sizeAttr.array as Float32Array
      const start = Math.max(0, count - PS_TRAIL_COUNT - PS_RIDER_COUNT)
      for (let i = start; i < count; i++) sizes[i] = 0.6 + Math.random() * 1.6
      sizeAttr.needsUpdate = true
    }
  }
}
