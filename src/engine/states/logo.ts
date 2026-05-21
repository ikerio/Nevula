import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import type { StateGenerator } from '../types'

// ============================================================================
// SVG rejection sampler (fallback, original implementation)
// ============================================================================
// Canonical Nevula logo path data (viewBox 0..2160). 7 shapes. Most sit inside
// an outer group with translate(66.517, -4.97). BackArch and BackArch1 each
// have an inner counter-translate that cancels the parent, so their path data
// is in absolute viewBox coords. OuterV has an additional matrix transform.
const LOGO_PATHS_RAW = {
  rightTri:  'M1104.3,1920.57L1249.65,2034.02C1434.54,2155.25 1603.36,2088.94 1643.56,1837.98L1804.11,862.987C1694.55,1348.23 1394.09,1708.5 1104.3,1920.57Z',
  backArch:  'M1870.63,857.57C1932.97,984.876 2003.18,1204.43 1987.35,1421.97C1972.7,1623.29 1860.27,1768.42 1712.65,1813.08L1718.47,1783.78C1851.41,1735.51 1926.12,1608.73 1947.45,1420.93C1946.85,1260.09 1911.47,1114.16 1855.38,977.098C1852.12,969.174 1849.38,962.074 1846.02,954.217C1846.02,954.217 1870.31,860.93 1870.63,857.57Z',
  backArch1: 'M1870.63,858.017L1785.33,827.088C1689.99,646.709 1561.92,488.502 1386.25,362.547C1235.05,266.967 1097.82,195.172 934.498,201.818C698.472,211.422 604.446,359.684 593.843,615.818L459.11,673.048C446.738,456.353 478.363,299.303 584.314,195.938C681.658,100.969 776.49,72.226 926.28,72.076C1137.93,94.725 1297.89,180.815 1472.37,327.259C1628.6,448.031 1761.07,625.627 1870.63,858.017Z',
  leftTri:   'M392.593,717.611C392.593,717.611 243.295,777.836 217.122,797.001C14.118,945.65 119.979,1098.77 254.626,1216.36L899.541,1745.92C815.605,1645.32 776.993,1643.2 647.795,1432.84C513.152,1213.61 436.635,975.223 392.593,717.611Z',
  vOuter:    'M1080.05,1619.95C1294.53,1438.79 1457.69,1227.04 1549.54,876.431L1657.59,919.921C1549.09,1340.22 1319.65,1589.1 1093.55,1756.23C1024.21,1695.07 923.363,1602.32 857.594,1513.16C756.285,1375.84 729.754,1303.94 718.836,1281.59C643.359,1127.11 599.508,956.482 574.587,766.759C574.587,766.759 677.741,730.564 678.581,731.406C685.696,738.537 682.591,951.773 828.681,1255.63C903.739,1411.75 1082.41,1632.56 1080.05,1619.95Z',
  vInner:    'M1081.89,1576.02C1296.37,1394.86 1443.77,1121.02 1535.62,770.41L1662.8,813.477C1565.41,1236.49 1313.85,1586.98 1081.74,1752.76C1062.43,1736.59 1061.32,1734.86 1051.77,1724.94C914.353,1582.22 808.239,1440.2 717.107,1267.18C630.702,1093.91 580.698,951.53 545.795,785.258C545.795,785.258 674.082,750.567 674.754,751.547C680.038,759.251 707.448,995.696 812.682,1198.53C913.691,1393.21 1084.24,1588.63 1081.89,1576.02Z',
  upperTri:  'M527.326,669.231L1532.84,286.268C1641.89,262.783 1730.95,271.784 1789.27,330.746C1853.3,412.309 1864.79,505.55 1843.2,606.139L1804.11,862.987C1629.37,798.191 1469.85,745.46 1329.99,721.887C1144.36,696.606 761.99,717.936 545.795,785.258L527.326,669.231Z',
}

interface LogoSampler {
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  arch: Path2D
  wings: Path2D
  v: Path2D
}

let _logoSampler: LogoSampler | null = null

/** Per-particle SVG region tag (0=V, 1=arch, 2=wings). Used by colorize() in
 *  the SVG-fallback path. Null when GLB sampling is active. */
let _logoTags: Uint8Array | null = null

export function getLogoTags(): Uint8Array | null {
  return _logoTags
}

function buildLogoSampler(): LogoSampler {
  if (_logoSampler) return _logoSampler

  const canvas: HTMLCanvasElement | OffscreenCanvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(64, 64)
      : Object.assign(document.createElement('canvas'), { width: 64, height: 64 })
  const ctx = (canvas as HTMLCanvasElement | OffscreenCanvas).getContext('2d') as
    CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  const outerXform = new DOMMatrix([1, 0, 0, 1, 66.517, -4.97])
  const vOuterXform = outerXform.multiply(
    new DOMMatrix([1.29782, -0.0409172, 0.0390179, 1.23758, -383.035, -208.155]),
  )

  const arch = new Path2D()
  arch.addPath(new Path2D(LOGO_PATHS_RAW.backArch))
  arch.addPath(new Path2D(LOGO_PATHS_RAW.backArch1))
  arch.addPath(new Path2D(LOGO_PATHS_RAW.upperTri),  outerXform)

  const wings = new Path2D()
  wings.addPath(new Path2D(LOGO_PATHS_RAW.leftTri),  outerXform)
  wings.addPath(new Path2D(LOGO_PATHS_RAW.rightTri), outerXform)

  const v = new Path2D()
  v.addPath(new Path2D(LOGO_PATHS_RAW.vOuter), vOuterXform)
  v.addPath(new Path2D(LOGO_PATHS_RAW.vInner), outerXform)

  _logoSampler = { ctx, arch, wings, v }
  return _logoSampler
}

function genLogoSvg(count: number): Float32Array {
  const { ctx, arch, wings, v } = buildLogoSampler()
  const arr = new Float32Array(count * 3)
  const tags = new Uint8Array(count)
  const CX = 1080, CY = 1080, SCALE = 1080

  let i = 0
  let tries = 0
  const MAX_TRIES = count * 60

  while (i < count && tries < MAX_TRIES) {
    tries++
    const x = Math.random() * 2160
    const y = Math.random() * 2160
    let tag: number
    if (ctx.isPointInPath(v, x, y))          tag = 0
    else if (ctx.isPointInPath(arch, x, y))  tag = 1
    else if (ctx.isPointInPath(wings, x, y)) tag = 2
    else continue

    arr[i * 3]     = (x - CX) / SCALE
    arr[i * 3 + 1] = -(y - CY) / SCALE
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.05
    tags[i] = tag
    i++
  }
  while (i < count) {
    const a = Math.random() * Math.PI * 2
    const r = 1.1 + Math.random() * 0.4
    arr[i * 3]     = Math.cos(a) * r
    arr[i * 3 + 1] = Math.sin(a) * r
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.2
    tags[i] = 1
    i++
  }
  _logoTags = tags
  return arr
}

// ============================================================================
// GLB surface sampler (preferred when loaded)
// ============================================================================
// Loads the Nevula 3D logo mesh once at boot. genLogo() samples N points off
// the mesh surfaces (area-weighted) each time it's invoked, using each mesh's
// material color directly. This gives true 3D depth + the proper brand
// material colors baked into the model.

/**
 * NevulaLogo3D.glb carries proper `baseColorFactor` per material now (the
 * earlier export was missing them because the Blender source used Diffuse
 * BSDF nodes, which glTF doesn't translate; the .blend was patched to add
 * Principled BSDFs and re-exported).
 */

/** Materials to skip entirely during surface sampling. The outer-V outline
 *  (`SVGMat.003` → Curve.002) eats ~14% of the particle budget for a near-
 *  black ring that's barely visible against silver — and physically caging
 *  the InnerV mesh in 3D, the outline particles intermingle with the orange
 *  V interior and read as a smudge. Drop it; the V interior alone defines
 *  the mark clearly. */
const LOGO_MAT_SKIP = new Set<string>(['SVGMat.003'])

/** Normalize the logo so its longest axis maps to this many world units.
 *  2.5 gives a confident hero presence — at chapter 0/6 the mark fills
 *  roughly the central 80% of the viewport height with the camera at z=3.4
 *  and FOV 50. */
const LOGO_TARGET_EXTENT = 2.5

interface GlbMesh {
  /** Kept so the sampler's local-space output can be projected to world space. */
  worldMatrix: THREE.Matrix4
  sampler: MeshSurfaceSampler
  color: THREE.Color
  area: number
}

/** Pre-transformed edge in logo-space, used by the wireframe trail sequencer. */
interface LogoEdge {
  start: THREE.Vector3  // already in normalized logo-space
  end: THREE.Vector3
  color: THREE.Color    // brand color of the source mesh
  length: number        // in logo-space units; used for filtering noise
  /** Position hashes of the endpoints, used to look up connected edges so a
   *  trail can walk from edge to edge instead of dying after one edge. */
  startKey: string
  endKey: string
}

interface LogoGlb {
  meshes: GlbMesh[]
  totalArea: number
  /** Centering offset applied to all sample positions. */
  center: THREE.Vector3
  /** Uniform scale to fit the model into roughly [-0.9, 0.9]. */
  scale: number
  /** All mesh edges, pre-transformed into logo-space + filtered to drop the
   *  short interior-tessellation noise. Drives the trail sequencer. */
  edges: LogoEdge[]
  /** Vertex-position-key → indices of edges that touch that vertex. Built
   *  during preload so trail traversal is O(1) per step. */
  vertexEdges: Map<string, number[]>
}

/** Quantized position hash used to merge shared vertices across meshes. */
function posKey(v: THREE.Vector3): string {
  const q = (n: number) => Math.round(n * 1000) / 1000
  return q(v.x) + ',' + q(v.y) + ',' + q(v.z)
}

let _logoGlb: LogoGlb | null = null

/** Per-particle RGB colors when the GLB sampler is the active source. Reset
 *  every genLogo() call. colorize() reads this for direct color routing. */
let _logoCachedColors: Float32Array | null = null

export function getLogoCachedColors(): Float32Array | null {
  return _logoCachedColors
}

/**
 * Preload the 3D logo GLB and cache mesh samplers + material colors.
 * Idempotent; safe to call multiple times.
 */
export async function preloadLogoGlb(url: string): Promise<void> {
  if (_logoGlb) return
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(url)
  const scene = gltf.scene
  scene.updateMatrixWorld(true)

  // Gather meshes + their material colors + per-mesh surface areas. Sampling
  // proportional to area gives even surface density across the model. We
  // also stash a reference to each mesh's underlying Mesh so we can extract
  // edges after the bbox/scale is known.
  const meshes: GlbMesh[] = []
  const meshRefs: { mesh: THREE.Mesh; color: THREE.Color }[] = []
  scene.traverse(obj => {
    const m = obj as THREE.Mesh
    if (!(m as unknown as { isMesh?: boolean }).isMesh) return
    const mat = Array.isArray(m.material) ? m.material[0] : m.material
    const matName = (mat as THREE.Material).name ?? ''
    if (LOGO_MAT_SKIP.has(matName)) return
    const color = (mat as THREE.MeshStandardMaterial).color?.clone()
      ?? new THREE.Color('#ff6600')
    const sampler = new MeshSurfaceSampler(m).build()
    const area = computeMeshArea(m)
    meshes.push({
      worldMatrix: m.matrixWorld.clone(),
      sampler,
      color,
      area,
    })
    meshRefs.push({ mesh: m, color })
  })

  // Normalize: center on bbox midpoint, scale so longest axis fits inside
  // `LOGO_TARGET_EXTENT` world units.
  const bbox = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3()
  bbox.getCenter(center)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = LOGO_TARGET_EXTENT / maxDim

  // Extract edges from each mesh, transform endpoints into logo-space (apply
  // worldMatrix → subtract bbox center → scale), and dedupe via a string key
  // per vertex-index pair. Filter to length > 0.04 to drop the dense interior-
  // tessellation noise — what remains traces the meaningful curves of the V,
  // arch, wings.
  const edges = extractEdges(meshRefs, center, scale)
  edges.sort((a, b) => b.length - a.length)

  // Build the vertex-edge adjacency map AFTER sorting so the recorded indices
  // are stable.
  const vertexEdges = new Map<string, number[]>()
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]
    if (!vertexEdges.has(e.startKey)) vertexEdges.set(e.startKey, [])
    if (!vertexEdges.has(e.endKey))   vertexEdges.set(e.endKey, [])
    vertexEdges.get(e.startKey)!.push(i)
    vertexEdges.get(e.endKey)!.push(i)
  }

  _logoGlb = {
    meshes,
    totalArea: meshes.reduce((s, m) => s + m.area, 0) || 1,
    center,
    scale,
    edges,
    vertexEdges,
  }
}

/** Drop edges shorter than this (in normalized logo-space units). Above 0.04
 *  we filter most interior-tessellation noise; at 0.08 only the meaningful
 *  silhouette/structural edges survive, which makes trail paths read as
 *  intentional contours rather than random zig-zag. */
const MIN_EDGE_LENGTH = 0.08

function extractEdges(
  meshRefs: { mesh: THREE.Mesh; color: THREE.Color }[],
  center: THREE.Vector3,
  scale: number,
): LogoEdge[] {
  const out: LogoEdge[] = []
  const tmp = new THREE.Vector3()
  for (const { mesh, color } of meshRefs) {
    const geom = mesh.geometry as THREE.BufferGeometry
    const pos = geom.getAttribute('position').array as Float32Array
    const index = geom.index?.array
    const matrix = mesh.matrixWorld

    // Pre-compute each vertex in logo-space so we don't re-transform.
    const vCount = pos.length / 3
    const verts: THREE.Vector3[] = new Array(vCount)
    for (let v = 0; v < vCount; v++) {
      verts[v] = new THREE.Vector3()
        .fromArray(pos, v * 3)
        .applyMatrix4(matrix)
        .sub(center)
        .multiplyScalar(scale)
    }

    const seen = new Set<string>()
    const addEdge = (a: number, b: number) => {
      const lo = Math.min(a, b)
      const hi = Math.max(a, b)
      const k = lo + '-' + hi
      if (seen.has(k)) return
      seen.add(k)
      const s = verts[lo]
      const e = verts[hi]
      tmp.subVectors(e, s)
      const length = tmp.length()
      if (length < MIN_EDGE_LENGTH) return
      out.push({
        start: s.clone(),
        end: e.clone(),
        color,
        length,
        startKey: posKey(s),
        endKey: posKey(e),
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
        addEdge(i, i + 1)
        addEdge(i + 1, i + 2)
        addEdge(i + 2, i)
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
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const ab = new THREE.Vector3()
  const ac = new THREE.Vector3()
  const cross = new THREE.Vector3()
  if (idx) {
    for (let i = 0; i < idx.length; i += 3) {
      a.fromArray(pos, idx[i] * 3).applyMatrix4(matrix)
      b.fromArray(pos, idx[i + 1] * 3).applyMatrix4(matrix)
      c.fromArray(pos, idx[i + 2] * 3).applyMatrix4(matrix)
      ab.subVectors(b, a)
      ac.subVectors(c, a)
      cross.crossVectors(ab, ac)
      area += cross.length() * 0.5
    }
  } else {
    for (let i = 0; i < pos.length; i += 9) {
      a.fromArray(pos, i).applyMatrix4(matrix)
      b.fromArray(pos, i + 3).applyMatrix4(matrix)
      c.fromArray(pos, i + 6).applyMatrix4(matrix)
      ab.subVectors(b, a)
      ac.subVectors(c, a)
      cross.crossVectors(ab, ac)
      area += cross.length() * 0.5
    }
  }
  return area
}

function genLogoGlb(count: number, glb: LogoGlb): Float32Array {
  const arr = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const tmp = new THREE.Vector3()

  let cursor = 0
  for (let mi = 0; mi < glb.meshes.length; mi++) {
    const m = glb.meshes[mi]
    const isLast = mi === glb.meshes.length - 1
    const n = isLast
      ? count - cursor // soak up remainder so we always fill exactly `count`
      : Math.round((m.area / glb.totalArea) * count)
    for (let i = 0; i < n && cursor < count; i++) {
      m.sampler.sample(tmp)
      // sampler returns local-space coords; project to world via the mesh's
      // cached worldMatrix, then center + scale to fit the [-0.9, 0.9] range
      // that other particle states use.
      tmp.applyMatrix4(m.worldMatrix)
      tmp.sub(glb.center).multiplyScalar(glb.scale)
      arr[cursor * 3]     = tmp.x
      arr[cursor * 3 + 1] = tmp.y
      arr[cursor * 3 + 2] = tmp.z
      colors[cursor * 3]     = m.color.r
      colors[cursor * 3 + 1] = m.color.g
      colors[cursor * 3 + 2] = m.color.b
      cursor++
    }
  }
  // Edge case: rounding errors leave some indices unfilled. Wrap from start.
  while (cursor < count) {
    const j = cursor % Math.max(1, cursor)
    arr[cursor * 3]     = arr[j * 3]
    arr[cursor * 3 + 1] = arr[j * 3 + 1]
    arr[cursor * 3 + 2] = arr[j * 3 + 2]
    colors[cursor * 3]     = colors[j * 3]
    colors[cursor * 3 + 1] = colors[j * 3 + 1]
    colors[cursor * 3 + 2] = colors[j * 3 + 2]
    cursor++
  }

  _logoCachedColors = colors
  _logoTags = null  // invalidate the SVG-tag path
  return arr
}

/**
 * Generate logo target positions for `count` particles.
 *   - GLB path (preferred): area-weighted surface samples with direct material
 *     colors. Active once `preloadLogoGlb()` has completed.
 *   - SVG fallback path: rejection-sampled 2D path points with region tags.
 */
export const genLogo: StateGenerator = (count) => {
  if (_logoGlb) return genLogoGlb(count, _logoGlb)
  _logoCachedColors = null
  return genLogoSvg(count)
}

// ============================================================================
// Wireframe trails (multi-edge graph traversal)
// ============================================================================
// A subset of the logo's particles (the last `LOGO_TRAIL_COUNT` indices of
// the geometry buffers) is dedicated to "trail" particles that walk the
// mesh wireframe like ants on a circuit. Each trail:
//   1. fades in at a random edge
//   2. travels across the edge
//   3. when it reaches the next vertex, picks a connected edge and continues
//   4. after 3–6 edges it fades out at its current vertex
//   5. respawns elsewhere
// The result reads as the logo's structure slowly redistributing itself,
// not discrete sparks appearing and disappearing.

/** Number of geometry indices reserved for trail particles. ~5% of the
 *  total 3400 — sparse enough that each trail reads as deliberate. */
export const LOGO_TRAIL_COUNT = 180

const FADE_IN_SEC = 0.7
const FADE_OUT_SEC = 0.9
/** Constant world-space velocity. With logo extent 2.5, a velocity of 0.05
 *  means a trail crosses the longest silhouette edge (~0.4) in ~8 seconds,
 *  and a short edge (~0.08) in ~1.6 seconds — visibly consistent regardless
 *  of which edge a trail is on. */
const WORLD_VELOCITY_BASE = 0.05
const WORLD_VELOCITY_VARIANCE = 0.4   // ±20% per particle
const MIN_EDGES_PER_TRAIL = 3
const MAX_EDGES_PER_TRAIL = 5
/** Trail particles spawn with t in [0, SPAWN_T_MAX) so they don't all snap
 *  to the same edge-position on first frame (would look like a flash). */
const SPAWN_T_MAX = 0.5

interface TrailParticle {
  edgeIx: number
  /** True if traveling end → start (otherwise start → end). The mesh's
   *  edge.start/end are arbitrary; we pick orientation per traversal. */
  reverse: boolean
  /** Parametric position along the chosen direction, 0..1. */
  t: number
  /** Per-particle world-space velocity (units per second). Constant across
   *  edges of the same trail — the per-edge `t/sec` rate is derived from
   *  this and the current edge's length, so visible speed stays steady
   *  even as edge lengths vary. */
  velocity: number
  phase: 'fadeIn' | 'travel' | 'fadeOut'
  /** Time (sec) the current phase started. */
  phaseStart: number
  /** How many edges this trail has crossed so far. */
  edgesTraversed: number
  /** Random per-trail edge-count target before fade-out. */
  maxEdges: number
  /** The previous edge — excluded from the next-edge pick so the trail
   *  doesn't ping-pong back the way it came. */
  prevEdgeIx: number
}

let _trails: TrailParticle[] = []
let _lastTrailT = 0

function pickEdgeIndex(edgeCount: number): number {
  // Edges are sorted longest-first in preload; bias the random pick toward
  // index 0 with a soft pow curve so silhouette edges light up more often.
  const r = Math.pow(Math.random(), 1.6)
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

/** Find a random edge that touches `destKey`, excluding `currentIx` (and
 *  `prevIx` to prevent immediate ping-pong unless it's the only option). */
function pickNextEdge(
  currentIx: number,
  prevIx: number,
  destKey: string,
): { ix: number; reverse: boolean } | null {
  if (!_logoGlb) return null
  const connected = _logoGlb.vertexEdges.get(destKey)
  if (!connected || connected.length === 0) return null
  type Cand = { ix: number; reverse: boolean }
  const main: Cand[] = []
  const fallback: Cand[] = []  // include prevIx for dead-end recovery
  for (const ix of connected) {
    if (ix === currentIx) continue
    const e = _logoGlb.edges[ix]
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

/**
 * Advance the wireframe-trail particles by one frame. Writes position +
 * color + alpha for the last `LOGO_TRAIL_COUNT` indices of the slot geometry.
 * Returns true if anything was written.
 */
export function tickLogoTrails(
  geo: THREE.BufferGeometry,
  particleCount: number,
  t: number,
): boolean {
  if (!_logoGlb || _logoGlb.edges.length === 0) return false

  // Lazy-init on the first call after entering logo state.
  if (_trails.length === 0) {
    for (let i = 0; i < LOGO_TRAIL_COUNT; i++) {
      _trails.push(spawnTrail(t, _logoGlb.edges.length))
    }
    _lastTrailT = t
  }

  const dt = Math.min(0.1, Math.max(0, t - _lastTrailT))
  _lastTrailT = t

  const positions = geo.getAttribute('position').array as Float32Array
  const colors = geo.getAttribute('color').array as Float32Array
  const alphas = geo.getAttribute('aAlpha').array as Float32Array

  const startIx = particleCount - _trails.length
  if (startIx < 0) return false

  for (let i = 0; i < _trails.length; i++) {
    const trail = _trails[i]
    let edge = _logoGlb.edges[trail.edgeIx]
    if (!edge) {
      _trails[i] = spawnTrail(t, _logoGlb.edges.length)
      continue
    }

    // Advance along the current edge at constant world velocity. Long
    // edges → low t/sec → take longer to traverse; short edges → quick.
    // Net visible speed stays steady.
    const tSpeed = edge.length > 1e-6 ? trail.velocity / edge.length : 1
    trail.t += tSpeed * dt

    // If we crossed the far vertex, decide whether to continue onto a
    // connected edge or start the fade-out for the end of the journey.
    if (trail.phase !== 'fadeOut' && trail.t >= 1) {
      trail.edgesTraversed++
      if (trail.edgesTraversed >= trail.maxEdges) {
        // End of journey — sit at this vertex while fading.
        trail.phase = 'fadeOut'
        trail.phaseStart = t
        trail.t = 1
      } else {
        // Find a connected edge from the destination vertex.
        const destKey = trail.reverse ? edge.startKey : edge.endKey
        const next = pickNextEdge(trail.edgeIx, trail.prevEdgeIx, destKey)
        if (next) {
          trail.prevEdgeIx = trail.edgeIx
          trail.edgeIx = next.ix
          trail.reverse = next.reverse
          // Carry the overshoot into the new edge so timing stays smooth.
          trail.t -= 1
          if (trail.t < 0) trail.t = 0
          edge = _logoGlb.edges[trail.edgeIx]
        } else {
          // No way forward (shouldn't happen with our mesh).
          trail.phase = 'fadeOut'
          trail.phaseStart = t
          trail.t = 1
        }
      }
    }

    // Phase-driven fade.
    const phaseAge = t - trail.phaseStart
    let fade = 1
    if (trail.phase === 'fadeIn') {
      fade = Math.min(1, phaseAge / FADE_IN_SEC)
      if (phaseAge >= FADE_IN_SEC) {
        trail.phase = 'travel'
        trail.phaseStart = t
      }
    } else if (trail.phase === 'fadeOut') {
      fade = Math.max(0, 1 - phaseAge / FADE_OUT_SEC)
      if (phaseAge >= FADE_OUT_SEC) {
        _trails[i] = spawnTrail(t, _logoGlb.edges.length)
        continue
      }
    }

    // Lerp position along the current edge in the chosen direction.
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

    colors[pIx * 3]     = edge.color.r
    colors[pIx * 3 + 1] = edge.color.g
    colors[pIx * 3 + 2] = edge.color.b
    alphas[pIx] = fade
  }

  return true
}

/** Reset trail particle state — called when the user leaves the logo state
 *  so the next logo entry starts fresh from random edges. */
export function resetLogoTrails(): void {
  _trails = []
  _lastTrailT = 0
}
