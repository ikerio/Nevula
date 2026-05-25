import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import type { StateGenerator } from '../types'

// ============================================================================
// Microprocessor GLB — exploded chip layers + chip cubes + central core.
// ============================================================================
// Geometry inventory (built in Blender, exported to public/assets/Microprocessor.glb):
//   - Plate_Top, Plate_Mid, Plate_Bottom, Plate_BottomInner   → particles
//   - Core                                                    → particles + solid (mix)
//   - Chip_1..4                                               → SOLID translucent acrylic only
//
// Routing by name prefix:
//   classifyMeshName() returns 'chip' | 'core' | 'plate'. Chips are skipped
//   from particle sampling entirely (rendered as solid mesh only). Core gets
//   a reduced share of the particle budget since it's also rendered solid.
//
// The GLB carries a baked 5-sec sine loop on all 9 meshes — driven each frame
// by the AnimationMixer + per-sample local→world transform for particles AND
// per-mesh local transform copy for the solid display meshes.

/** Longest-axis target extent in world units after normalization. Smaller
 *  than Public Safety's 3.0 because the microprocessor is a TALL vertical
 *  stack — at 3.0 the longest axis (Y in three.js, the plate stack) was
 *  dominating the viewport vertically. */
const MP_TARGET_EXTENT = 2.0

/** Core's share of the particle budget relative to plates (its surface area
 *  would normally entitle it to more, but it's also rendered solid, so we
 *  halve its allocation to keep the visual focus on the solid mesh). */
const CORE_SAMPLE_WEIGHT = 0.4

interface MeshRecord {
  mesh: THREE.Mesh
  sampler: MeshSurfaceSampler
  color: THREE.Color
  area: number
  kind: 'chip' | 'core' | 'plate'
}

interface MicroprocessorGlb {
  scene: THREE.Object3D
  mixer: THREE.AnimationMixer | null
  meshes: MeshRecord[]
  /** Total weighted area of sampleable meshes (plates + weighted core). */
  totalSampleArea: number
  center: THREE.Vector3
  scale: number
  /** References to chip + core meshes for solid rendering. */
  chipMeshes: THREE.Mesh[]
  coreMesh: THREE.Mesh | null
}

interface ParticleSample {
  meshIdx: number
  localPos: THREE.Vector3
}

let _glb: MicroprocessorGlb | null = null
let _samples: ParticleSample[] | null = null
let _cachedColors: Float32Array | null = null

export function getMicroprocessorCachedColors(): Float32Array | null {
  return _cachedColors
}

function classifyMeshName(name: string): 'chip' | 'core' | 'plate' {
  if (name.startsWith('Chip_')) return 'chip'
  if (name === 'Core') return 'core'
  return 'plate'
}

// ============================================================================
// Preload — fetch GLB, build per-mesh samplers, wire up the AnimationMixer.
// ============================================================================
export async function preloadMicroprocessorGlb(url: string): Promise<void> {
  if (_glb) return
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(url)
  const scene = gltf.scene
  scene.updateMatrixWorld(true)

  const meshes: MeshRecord[] = []
  const chipMeshes: THREE.Mesh[] = []
  let coreMesh: THREE.Mesh | null = null

  scene.traverse(obj => {
    const m = obj as THREE.Mesh
    if (!(m as unknown as { isMesh?: boolean }).isMesh) return
    const mat = Array.isArray(m.material) ? m.material[0] : m.material
    const color = (mat as THREE.MeshStandardMaterial)?.color?.clone()
      ?? new THREE.Color('#a8b0c0')
    const kind = classifyMeshName(m.name)
    meshes.push({
      mesh: m,
      sampler: new MeshSurfaceSampler(m).build(),
      color,
      area: computeMeshArea(m),
      kind,
    })
    if (kind === 'chip') chipMeshes.push(m)
    if (kind === 'core') coreMesh = m
  })

  // Sort chips by name so external consumers (e.g. HTML overlay binding)
  // get a stable Chip_1, Chip_2, Chip_3, Chip_4 order regardless of GLB
  // traversal order.
  chipMeshes.sort((a, b) => a.name.localeCompare(b.name))

  const bbox = new THREE.Box3().setFromObject(scene)
  const center = new THREE.Vector3()
  bbox.getCenter(center)
  const size = new THREE.Vector3()
  bbox.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const scale = MP_TARGET_EXTENT / maxDim

  let mixer: THREE.AnimationMixer | null = null
  if (gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(scene)
    for (const clip of gltf.animations) {
      const action = mixer.clipAction(clip)
      action.setLoop(THREE.LoopRepeat, Infinity)
      action.play()
    }
  }

  // Sum weighted areas of SAMPLEABLE meshes only (plates 1.0, core 0.4, chips 0).
  const totalSampleArea = meshes.reduce((s, m) => {
    if (m.kind === 'chip') return s
    const w = m.kind === 'core' ? CORE_SAMPLE_WEIGHT : 1.0
    return s + m.area * w
  }, 0) || 1

  _glb = {
    scene, mixer, meshes,
    totalSampleArea, center, scale,
    chipMeshes, coreMesh,
  }
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

// ============================================================================
// Initial particle generation — area-weighted across plates + core (chips
// skipped, rendered solid only).
// ============================================================================
function genFromGlb(count: number, glb: MicroprocessorGlb): Float32Array {
  const arr = new Float32Array(count * 3)
  const samples: ParticleSample[] = new Array(count)
  const tmp = new THREE.Vector3()

  // Build ordered list of sampleable meshes (excluding chips).
  const sampleable: { record: MeshRecord; index: number; weight: number }[] = []
  for (let mi = 0; mi < glb.meshes.length; mi++) {
    const m = glb.meshes[mi]
    if (m.kind === 'chip') continue
    const weight = m.kind === 'core' ? CORE_SAMPLE_WEIGHT : 1.0
    sampleable.push({ record: m, index: mi, weight })
  }

  let cursor = 0
  for (let si = 0; si < sampleable.length; si++) {
    const entry = sampleable[si]
    const m = entry.record
    const isLast = si === sampleable.length - 1
    const weightedArea = m.area * entry.weight
    const n = isLast
      ? count - cursor
      : Math.round((weightedArea / glb.totalSampleArea) * count)
    for (let i = 0; i < n && cursor < count; i++) {
      const localPos = new THREE.Vector3()
      m.sampler.sample(localPos)
      tmp.copy(localPos).applyMatrix4(m.mesh.matrixWorld)
      tmp.sub(glb.center).multiplyScalar(glb.scale)
      arr[cursor * 3]     = tmp.x
      arr[cursor * 3 + 1] = tmp.y
      arr[cursor * 3 + 2] = tmp.z
      samples[cursor] = { meshIdx: entry.index, localPos }
      cursor++
    }
  }
  while (cursor < count) {
    const j = cursor === 0 ? 0 : cursor - 1
    arr[cursor * 3]     = arr[j * 3]
    arr[cursor * 3 + 1] = arr[j * 3 + 1]
    arr[cursor * 3 + 2] = arr[j * 3 + 2]
    samples[cursor] = samples[j] ?? { meshIdx: -1, localPos: new THREE.Vector3() }
    cursor++
  }

  _samples = samples
  _cachedColors = null
  return arr
}

export const genMicroprocessor: StateGenerator = (count) => {
  if (_glb) return genFromGlb(count, _glb)
  console.warn('[nevula] microprocessor GLB not loaded; emitting fallback positions')
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
// Solid mesh display — translucent acrylic chip cubes + mixed core. These
// render alongside the particles (children of slot.points, so they inherit
// the points' rotation/scale/offset transforms). Lifecycle managed via
// ensureDisplay/teardownDisplay; transforms synced each frame from the
// original GLB meshes (which the AnimationMixer drives).
// ============================================================================

interface SolidMeshRecord {
  /** Original animated mesh from gltf.scene. */
  source: THREE.Mesh
  /** Display clone in our render scene — shares geometry, has its own material. */
  display: THREE.Mesh
  /** Subtle edge outline along the mesh's hard edges. */
  edges: THREE.LineSegments
  edgeMaterial: THREE.LineBasicMaterial
  /** Hover lerp 0..1. Driven toward hoverTarget each frame. */
  hoverLerp: number
  hoverTarget: number
  /** MeshPhongMaterial gives the acrylic look — diffuse base color + a
   *  specular highlight (the soft white sheen on the top face that the
   *  user's reference shows) without the self-illumination of `emissive`
   *  that read as "fluorescent" earlier. */
  material: THREE.MeshPhongMaterial
  baseR: number
  baseG: number
  baseB: number
  baseOpacity: number
  baseEdgeOpacity: number
}

let _displayGroup: THREE.Group | null = null
let _displayParent: THREE.Object3D | null = null
let _chipDisplays: SolidMeshRecord[] = []
let _coreDisplay: SolidMeshRecord | null = null
/** Lights attached to the display group so chips get proper per-face shading.
 *  Cleared on teardown so they don't accumulate across state entries. */
let _displayLights: THREE.Light[] = []

const _mouseNDC = new THREE.Vector2(-2, -2)  // start off-screen so nothing hovers until mouse moves
const _raycaster = new THREE.Raycaster()
let _hoverListenerActive = false

/** Current hovered chip index (-1 if none). Exposed for HTML overlay
 *  binding — chapter code reads this each frame to show/hide the chip-
 *  specific tooltip card. */
let _hoveredChipIx: number = -1

/** Per-chip screen-space position (in viewport pixels) — recomputed each
 *  frame because chip world positions change with the GLB animation +
 *  slot.points' isometric rotation. Used by the HTML overlay system. */
const _chipScreenPositions: Array<{ x: number; y: number }> = []

/** Returns the index of the chip currently under the cursor, or -1. */
export function getMicroprocessorHoveredChipIndex(): number {
  return _hoveredChipIx
}

/** Returns viewport-pixel positions for each chip (sorted Chip_1..N). The
 *  returned array is the live module array — callers should treat it as
 *  read-only and copy if they need to retain values across frames. */
export function getMicroprocessorChipScreenPositions(): ReadonlyArray<{ x: number; y: number }> {
  return _chipScreenPositions
}

function onPointerMove(e: PointerEvent): void {
  _mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1
  _mouseNDC.y = -((e.clientY / window.innerHeight) * 2 - 1)
}

function ensureHoverListener(): void {
  if (_hoverListenerActive) return
  window.addEventListener('pointermove', onPointerMove, { passive: true })
  _hoverListenerActive = true
}

function removeHoverListener(): void {
  if (!_hoverListenerActive) return
  window.removeEventListener('pointermove', onPointerMove)
  _hoverListenerActive = false
}

/** Build a chip-style material — glossy SOLID acrylic in a bright royal
 *  blue that matches the user's reference image (a vivid blue, brighter
 *  than the brand COBALT #1A5FB4 but still in the blue family). Phong
 *  shading gives the soft top-face highlight that defines the acrylic
 *  look. NO emissive — lighting alone drives brightness, avoiding the
 *  "fluorescent" feel of earlier passes. */
function makeChipMaterial(): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x3866EC),
    // Soft cool-white specular — gives the broad fuzzy highlight the
    // reference shows, not a sharp mirror reflection.
    specular: new THREE.Color(0xd4e0ff),
    // Lower shininess = broader, softer specular spot. 30 is right for
    // a polished-but-not-glass acrylic block.
    shininess: 30,
    transparent: true,
    opacity: 0.86,
    side: THREE.FrontSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

/** Build a core-style material — SAME blue family as the chips (no orange)
 *  but a slightly DEEPER tone so the central die reads as a foundation
 *  beneath the surface chips. Opacity dialed lower than chips so the
 *  particles inside still read through. */
function makeCoreMaterial(): THREE.MeshPhongMaterial {
  return new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x1F4AC0),
    specular: new THREE.Color(0xb8c8f0),
    shininess: 30,
    transparent: true,
    opacity: 0.55,
    side: THREE.FrontSide,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}

/** Build a subtle edge outline. Color chosen to harmonize with the chip
 *  base — a slightly lighter cobalt, NOT bright white (which read as a
 *  neon outline). Opacity low enough that the edge defines silhouette
 *  without competing with the chip surface. */
function makeChipEdgeMaterial(opacity: number): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: 0x6a8fbc,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
  })
}

function makeCoreEdgeMaterial(opacity: number): THREE.LineBasicMaterial {
  // Now blue family too — was warm peach when the core was orange.
  return new THREE.LineBasicMaterial({
    color: 0x5070b8,
    transparent: true,
    opacity,
    depthWrite: false,
    depthTest: true,
  })
}

function ensureDisplay(parent: THREE.Object3D): void {
  if (!_glb) return
  if (_displayGroup && _displayParent === parent) return
  if (_displayGroup && _displayParent !== parent) {
    teardownDisplay()
  }

  // The display group applies the same (subtract center, multiply scale)
  // normalization that genFromGlb applies to particle positions.
  _displayGroup = new THREE.Group()
  _displayGroup.position.copy(_glb.center).multiplyScalar(-_glb.scale)
  _displayGroup.scale.setScalar(_glb.scale)
  parent.add(_displayGroup)
  _displayParent = parent

  // ---- Lights for the Phong acrylic shading. The reference image looks
  // like soft area-style lighting — to approximate, use a HemisphereLight
  // (gradient sky-to-ground ambient that gives subtle dimensional shading
  // even on the underside) plus a moderate directional KEY for the
  // top-face highlight.
  _displayLights = []
  const hemi = new THREE.HemisphereLight(0xffffff, 0xc4d4f5, 0.85)
  _displayGroup.add(hemi)
  _displayLights.push(hemi)

  const key = new THREE.DirectionalLight(0xffffff, 0.70)
  key.position.set(0.4, 1.5, 0.9)
  _displayGroup.add(key)
  _displayLights.push(key)

  const ambient = new THREE.AmbientLight(0xffffff, 0.30)
  _displayGroup.add(ambient)
  _displayLights.push(ambient)

  // ---- Chip display meshes + edge outlines.
  _chipDisplays = []
  for (const chip of _glb.chipMeshes) {
    const mat = makeChipMaterial()
    const display = new THREE.Mesh(chip.geometry, mat)
    _displayGroup.add(display)

    const edgesGeo = new THREE.EdgesGeometry(chip.geometry, 15)
    const edgeMat = makeChipEdgeMaterial(0.35)
    const edges = new THREE.LineSegments(edgesGeo, edgeMat)
    // Render edges AFTER the chip so the polygon offset on the chip lets
    // edges land cleanly on top of the front faces. Edges are children of
    // the display mesh so they share its transform automatically.
    edges.renderOrder = 1
    display.add(edges)

    _chipDisplays.push({
      source: chip, display, edges, edgeMaterial: edgeMat,
      hoverLerp: 0, hoverTarget: 0, material: mat,
      baseR: mat.color.r, baseG: mat.color.g, baseB: mat.color.b,
      baseOpacity: mat.opacity,
      baseEdgeOpacity: edgeMat.opacity,
    })
  }
  if (_glb.coreMesh) {
    const mat = makeCoreMaterial()
    const display = new THREE.Mesh(_glb.coreMesh.geometry, mat)
    _displayGroup.add(display)

    const edgesGeo = new THREE.EdgesGeometry(_glb.coreMesh.geometry, 15)
    const edgeMat = makeCoreEdgeMaterial(0.32)
    const edges = new THREE.LineSegments(edgesGeo, edgeMat)
    edges.renderOrder = 1
    display.add(edges)

    _coreDisplay = {
      source: _glb.coreMesh, display, edges, edgeMaterial: edgeMat,
      hoverLerp: 0, hoverTarget: 0, material: mat,
      baseR: mat.color.r, baseG: mat.color.g, baseB: mat.color.b,
      baseOpacity: mat.opacity,
      baseEdgeOpacity: edgeMat.opacity,
    }
  }

  ensureHoverListener()
}

function teardownDisplay(): void {
  if (_displayGroup && _displayParent) {
    _displayParent.remove(_displayGroup)
  }
  for (const rec of _chipDisplays) {
    rec.material.dispose()
    rec.edgeMaterial.dispose()
    rec.edges.geometry.dispose()
  }
  if (_coreDisplay) {
    _coreDisplay.material.dispose()
    _coreDisplay.edgeMaterial.dispose()
    _coreDisplay.edges.geometry.dispose()
  }
  _displayLights = []
  _displayGroup = null
  _displayParent = null
  _chipDisplays = []
  _coreDisplay = null
}

function syncDisplayTransforms(): void {
  for (const rec of _chipDisplays) {
    rec.display.position.copy(rec.source.position)
    rec.display.quaternion.copy(rec.source.quaternion)
    // Apply hover scale on top of the source scale so the chip "pops" out a bit.
    const s = 1.0 + rec.hoverLerp * 0.08
    rec.display.scale.copy(rec.source.scale).multiplyScalar(s)
  }
  if (_coreDisplay) {
    _coreDisplay.display.position.copy(_coreDisplay.source.position)
    _coreDisplay.display.quaternion.copy(_coreDisplay.source.quaternion)
    _coreDisplay.display.scale.copy(_coreDisplay.source.scale)
  }
}

const _tmpWorldPos = new THREE.Vector3()
const _tmpProjected = new THREE.Vector3()

/** Raycast against the chip meshes and update hover targets + lerped visuals.
 *  Also recomputes screen-space chip positions for the HTML overlay system. */
function updateHover(camera: THREE.Camera): void {
  if (_chipDisplays.length === 0) return

  // Make sure world matrices are current before raycasting (transforms got
  // updated by syncDisplayTransforms a moment ago).
  if (_displayGroup) _displayGroup.updateMatrixWorld(true)

  _raycaster.setFromCamera(_mouseNDC, camera)
  const meshes = _chipDisplays.map(c => c.display)
  const hits = _raycaster.intersectObjects(meshes, false)
  let newHoveredIx = -1
  if (hits.length > 0) {
    const hit = hits[0].object
    newHoveredIx = _chipDisplays.findIndex(c => c.display === hit)
  }
  _hoveredChipIx = newHoveredIx

  // Project each chip's world position into viewport pixels — HTML overlays
  // read this every frame to follow the chip as it animates.
  _chipScreenPositions.length = _chipDisplays.length
  for (let i = 0; i < _chipDisplays.length; i++) {
    _chipDisplays[i].display.getWorldPosition(_tmpWorldPos)
    _tmpProjected.copy(_tmpWorldPos).project(camera)
    const px = (_tmpProjected.x + 1) * 0.5 * window.innerWidth
    const py = (1 - _tmpProjected.y) * 0.5 * window.innerHeight
    _chipScreenPositions[i] = { x: px, y: py }
  }

  for (let i = 0; i < _chipDisplays.length; i++) {
    _chipDisplays[i].hoverTarget = (i === newHoveredIx) ? 1 : 0
    _chipDisplays[i].hoverLerp += (_chipDisplays[i].hoverTarget - _chipDisplays[i].hoverLerp) * 0.15
    const rec = _chipDisplays[i]
    // Subtle opacity bump + slight color brighten on hover — kept gentle so
    // the chip reads as "highlighted" without losing the matte acrylic feel.
    rec.material.opacity = rec.baseOpacity + rec.hoverLerp * 0.22
    rec.material.color.setRGB(
      rec.baseR + rec.hoverLerp * 0.12,
      rec.baseG + rec.hoverLerp * 0.10,
      rec.baseB + rec.hoverLerp * 0.05,
    )
    rec.edgeMaterial.opacity = rec.baseEdgeOpacity + rec.hoverLerp * 0.25
  }
}

// ============================================================================
// Per-frame animation tick — advances the AnimationMixer, re-transforms
// each particle's cached local sample, syncs the solid display meshes, and
// updates the hover state for chips.
// ============================================================================
const _tmpV = new THREE.Vector3()

export function tickMicroprocessorAnimation(
  targetPos: Float32Array,
  particleCount: number,
  dt: number,
  parent: THREE.Object3D,
  camera: THREE.Camera,
): boolean {
  if (!_glb || !_samples) return false
  if (_glb.mixer) {
    _glb.mixer.update(dt)
    _glb.scene.updateMatrixWorld(true)
  }
  for (let i = 0; i < particleCount; i++) {
    const sp = _samples[i]
    if (!sp || sp.meshIdx < 0) continue
    const m = _glb.meshes[sp.meshIdx]
    if (!m) continue
    _tmpV.copy(sp.localPos)
      .applyMatrix4(m.mesh.matrixWorld)
      .sub(_glb.center)
      .multiplyScalar(_glb.scale)
    targetPos[i * 3]     = _tmpV.x
    targetPos[i * 3 + 1] = _tmpV.y
    targetPos[i * 3 + 2] = _tmpV.z
  }

  // Solid display meshes (chips + core) + hover.
  ensureDisplay(parent)
  syncDisplayTransforms()
  updateHover(camera)

  return true
}

/** Called from slot.ts setSlotState when leaving microprocessor — tears
 *  down the solid display group + removes the pointermove listener. */
export function resetMicroprocessor(): void {
  teardownDisplay()
  removeHoverListener()
  _hoveredChipIx = -1
  _chipScreenPositions.length = 0
}
