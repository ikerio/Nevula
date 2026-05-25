import * as THREE from 'three'

/**
 * Intro network horizon — a quiet, ambient Three.js layer that sits behind
 * the Nevula wordmark.
 *
 * Approach: a FULL icosphere (not just the upper hemisphere) made of small
 * dots at vertices and hairline edges. The illusion of a "dome" comes from
 * silhouette emphasis: each vertex/edge's alpha is modulated by a fresnel-
 * like factor — 1 at the sphere's silhouette (where the surface is tangent
 * to the camera) and ~0 toward the center where the camera looks through
 * the sphere. This naturally produces a denser arc at the rim and a
 * sparser interior, exactly like the reference image.
 *
 * The sphere is positioned so its top sits in the middle of the lower
 * viewport band, with the rest extending below the visible canvas. The
 * back hemisphere reads through the transparent material, contributing
 * the visible mesh "depth" that appears below the rim curve.
 *
 * No latitude arcs, no anchor dots — the silhouette IS the dome.
 */

export interface NetworkHorizonHandle {
  el: HTMLCanvasElement
  fadeOut(durationMs?: number): Promise<void>
  dispose(): void
}

// ---------------------------------------------------------------------------
// Layout — world coordinates.
// ---------------------------------------------------------------------------

/** Sphere positioned so its silhouette rim lands in the lower third of
 *  the viewport, with the body extending below — only the dome cap reads
 *  clearly, the bottom hemisphere goes off-canvas. */
const SPHERE_CENTER_Y = -2.55
const SPHERE_RADIUS   = 2.05

/** Count of network particles randomly scattered on the sphere surface.
 *  ~350 gives the visual density of the reference image without requiring
 *  a per-frame budget that competes with chapter rendering. */
const NODE_COUNT = 350

/** Fraction of particles that participate in any connection. The other
 *  ~70% sit as orphan dots — that's what creates the "local cluster"
 *  reading: small groups of connected nodes here and there, with empty
 *  space between them, rather than a complete mesh. */
const ANCHOR_FRAC = 0.30

/** Max world-space distance for a connection. Smaller than the sphere
 *  radius so connections stay LOCAL (cluster-forming) rather than spanning
 *  the dome. */
const LINK_DISTANCE = 0.42

/** Each anchor connects to up to this many nearest also-anchor neighbors. */
const LINKS_PER_ANCHOR = 2

const LIFT_COUNT = 8

// Camera setup (referenced when computing silhouette factor).
const CAMERA_POS = new THREE.Vector3(0, 0.35, 3.6)

// ---------------------------------------------------------------------------
// Shaders. Both POINTS and LINES use a custom shader so each vertex can
// carry its own alpha (driven by the silhouette factor + the master
// fade-in/out opacity). Three.js's stock LineBasicMaterial doesn't accept
// per-vertex alpha, only a single opacity uniform — hence the custom
// material here.
// ---------------------------------------------------------------------------

const POINT_VERTEX_SHADER = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (1.0 / -mvPosition.z) * 14.0;
  }
`

const POINT_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float edge = smoothstep(0.5, 0.35, d);
    gl_FragColor = vec4(uColor, vAlpha * edge * uOpacity);
  }
`

const LINE_VERTEX_SHADER = /* glsl */ `
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const LINE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    gl_FragColor = vec4(uColor, vAlpha * uOpacity);
  }
`

// ---------------------------------------------------------------------------

export function mountNetworkHorizon(): NetworkHorizonHandle {
  const canvas = document.createElement('canvas')
  canvas.className = 'intro-network'
  canvas.setAttribute('aria-hidden', 'true')

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'low-power',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 20)
  camera.position.copy(CAMERA_POS)
  camera.lookAt(0, -0.30, 0)

  // -- Scatter particles on the sphere surface ----------------------------
  // Uniform spherical distribution via the inverse-CDF method. Each particle
  // gets its world position and silhouette factor computed once.
  const nodeCount = NODE_COUNT
  const worldPos = new Float32Array(nodeCount * 3)
  const silhouette = new Float32Array(nodeCount)
  // Local sphere-centered position (for outward direction).
  const localPos = new Float32Array(nodeCount * 3)

  for (let i = 0; i < nodeCount; i++) {
    // Uniform sphere sampling — y = 1 - 2u gives uniform polar density,
    // θ = 2π v gives uniform azimuth. No clustering at poles.
    const u = Math.random()
    const v = Math.random()
    const cy = 1 - 2 * u
    const sy = Math.sqrt(Math.max(0, 1 - cy * cy))
    const theta = v * Math.PI * 2

    const lx = sy * Math.cos(theta) * SPHERE_RADIUS
    const ly = cy * SPHERE_RADIUS
    const lz = sy * Math.sin(theta) * SPHERE_RADIUS

    localPos[i * 3]     = lx
    localPos[i * 3 + 1] = ly
    localPos[i * 3 + 2] = lz

    const wx = lx
    const wy = ly + SPHERE_CENTER_Y
    const wz = lz
    worldPos[i * 3]     = wx
    worldPos[i * 3 + 1] = wy
    worldPos[i * 3 + 2] = wz

    // Silhouette = 1 - |dot(outward, view)|
    //   outward = normalized local position (sphere is centered at local
    //   origin, so the local position IS the outward direction × radius)
    //   view = normalized (camera - world position)
    const ox = lx / SPHERE_RADIUS
    const oy = ly / SPHERE_RADIUS
    const oz = lz / SPHERE_RADIUS

    const vx = CAMERA_POS.x - wx
    const vy = CAMERA_POS.y - wy
    const vz = CAMERA_POS.z - wz
    const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz)
    const dx = vx / vLen
    const dy = vy / vLen
    const dz = vz / vLen

    const dot = ox * dx + oy * dy + oz * dz
    silhouette[i] = 1 - Math.abs(dot)
  }

  // -- Per-vertex node attributes -----------------------------------------
  const nodeSize  = new Float32Array(nodeCount)
  const nodeAlpha = new Float32Array(nodeCount)
  // Baseline (non-silhouette-modulated) alpha, animation loop multiplies
  // by silhouette + small breathing variation.
  const nodeBaseAlpha = new Float32Array(nodeCount)
  const nodePhase     = new Float32Array(nodeCount)
  const nodePulses    = new Float32Array(nodeCount)

  for (let i = 0; i < nodeCount; i++) {
    // Particles vary subtly in size — gives the field organic texture
    // rather than uniform-grid feel.
    nodeSize[i] = 0.40 + Math.random() * 0.25
    // Base alpha scaled by silhouette^2.2 — rim particles ~0.55 alpha,
    // center particles ~0.04 alpha. The quadratic curve compresses the
    // visible band toward the rim, matching the reference's "halo"
    // reading.
    const sil = silhouette[i]
    const silBoost = Math.pow(sil, 2.2)
    nodeBaseAlpha[i] = 0.04 + 0.55 * silBoost
    nodeAlpha[i]     = nodeBaseAlpha[i]
    nodePhase[i]     = Math.random() * Math.PI * 2
    // Very rare pulses — only at high-silhouette particles where they're
    // actually visible.
    nodePulses[i]    = (sil > 0.7 && Math.random() < 0.06) ? 1 : 0
  }

  const nodeGeo = new THREE.BufferGeometry()
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(worldPos, 3))
  nodeGeo.setAttribute('aSize',   new THREE.BufferAttribute(nodeSize, 1))
  nodeGeo.setAttribute('aAlpha',  new THREE.BufferAttribute(nodeAlpha, 1))

  const nodeMat = new THREE.ShaderMaterial({
    vertexShader: POINT_VERTEX_SHADER,
    fragmentShader: POINT_FRAGMENT_SHADER,
    uniforms: {
      uColor:   { value: new THREE.Color(0x6685a8) },
      uOpacity: { value: 1.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
  scene.add(new THREE.Points(nodeGeo, nodeMat))

  // -- Selective local connections ----------------------------------------
  // Pick ~30% of particles as "anchors." Each anchor links to its 1–2
  // nearest also-anchor neighbors within LINK_DISTANCE. The other ~70% of
  // particles have NO connections — that's what creates the "small clusters
  // with empty space between" reading from the reference, instead of a
  // complete wireframe.
  const isAnchor: boolean[] = []
  const anchorIdxs: number[] = []
  for (let i = 0; i < nodeCount; i++) {
    if (Math.random() < ANCHOR_FRAC) {
      isAnchor.push(true)
      anchorIdxs.push(i)
    } else {
      isAnchor.push(false)
    }
  }

  const edgeSet = new Set<string>()
  for (const i of anchorIdxs) {
    const dists: Array<{ idx: number; d: number }> = []
    for (const j of anchorIdxs) {
      if (i === j) continue
      const dx = worldPos[i * 3]     - worldPos[j * 3]
      const dy = worldPos[i * 3 + 1] - worldPos[j * 3 + 1]
      const dz = worldPos[i * 3 + 2] - worldPos[j * 3 + 2]
      const d  = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (d < LINK_DISTANCE) dists.push({ idx: j, d })
    }
    dists.sort((a, b) => a.d - b.d)
    // Connect to nearest LINKS_PER_ANCHOR; some anchors will find fewer
    // (or zero) neighbors within range — that's fine, they become orphan
    // anchors and contribute only their dot.
    const linksToMake = Math.min(LINKS_PER_ANCHOR, dists.length)
    for (let k = 0; k < linksToMake; k++) {
      const j = dists[k].idx
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      edgeSet.add(key)
    }
  }

  const linePos   = new Float32Array(edgeSet.size * 6)
  const lineAlpha = new Float32Array(edgeSet.size * 2)
  let li = 0
  for (const key of edgeSet) {
    const [aStr, bStr] = key.split('-')
    const a = parseInt(aStr, 10)
    const b = parseInt(bStr, 10)
    linePos[li * 6]     = worldPos[a * 3]
    linePos[li * 6 + 1] = worldPos[a * 3 + 1]
    linePos[li * 6 + 2] = worldPos[a * 3 + 2]
    linePos[li * 6 + 3] = worldPos[b * 3]
    linePos[li * 6 + 4] = worldPos[b * 3 + 1]
    linePos[li * 6 + 5] = worldPos[b * 3 + 2]
    // Silhouette-modulated alpha — bright at rim, faint toward center.
    const aA = 0.04 + 0.48 * Math.pow(silhouette[a], 1.5)
    const aB = 0.04 + 0.48 * Math.pow(silhouette[b], 1.5)
    lineAlpha[li * 2]     = aA
    lineAlpha[li * 2 + 1] = aB
    li++
  }

  const linkGeo = new THREE.BufferGeometry()
  linkGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3))
  linkGeo.setAttribute('aAlpha',   new THREE.BufferAttribute(lineAlpha, 1))
  const linkMat = new THREE.ShaderMaterial({
    vertexShader: LINE_VERTEX_SHADER,
    fragmentShader: LINE_FRAGMENT_SHADER,
    uniforms: {
      uColor:   { value: new THREE.Color(0x6e8aab) },
      uOpacity: { value: 1.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
  scene.add(new THREE.LineSegments(linkGeo, linkMat))

  // -- Lifting particles --------------------------------------------------
  const liftPos   = new Float32Array(LIFT_COUNT * 3)
  const liftSize  = new Float32Array(LIFT_COUNT)
  const liftAlpha = new Float32Array(LIFT_COUNT)
  const liftSpawn = new Float32Array(LIFT_COUNT * 3)
  const liftAge   = new Float32Array(LIFT_COUNT)
  const liftLife  = new Float32Array(LIFT_COUNT)
  const liftSway  = new Float32Array(LIFT_COUNT)

  function spawnLiftParticle(i: number): void {
    // Spawn anywhere on the visible upper portion of the sphere — bias
    // toward the silhouette band so the lift visually "emerges from" the
    // dome rim.
    const phi   = Math.acos(0.10 + Math.random() * 0.55)
    const theta = Math.random() * Math.PI * 2
    liftSpawn[i * 3]     = Math.sin(phi) * Math.cos(theta) * SPHERE_RADIUS
    liftSpawn[i * 3 + 1] = Math.cos(phi) * SPHERE_RADIUS + SPHERE_CENTER_Y
    liftSpawn[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * SPHERE_RADIUS
    liftAge[i]   = 0
    liftLife[i]  = 3.0 + Math.random() * 2.5
    liftSize[i]  = 0.7 + Math.random() * 0.35
    liftSway[i]  = 0.6 + Math.random() * 0.7
  }

  for (let i = 0; i < LIFT_COUNT; i++) {
    spawnLiftParticle(i)
    liftAge[i] = (Math.random() - 0.3) * liftLife[i]
    liftPos[i * 3]     = liftSpawn[i * 3]
    liftPos[i * 3 + 1] = liftSpawn[i * 3 + 1]
    liftPos[i * 3 + 2] = liftSpawn[i * 3 + 2]
    liftAlpha[i] = 0
  }

  const liftGeo = new THREE.BufferGeometry()
  liftGeo.setAttribute('position', new THREE.BufferAttribute(liftPos, 3))
  liftGeo.setAttribute('aSize',   new THREE.BufferAttribute(liftSize, 1))
  liftGeo.setAttribute('aAlpha',  new THREE.BufferAttribute(liftAlpha, 1))

  const liftMat = new THREE.ShaderMaterial({
    vertexShader: POINT_VERTEX_SHADER,
    fragmentShader: POINT_FRAGMENT_SHADER,
    uniforms: {
      uColor:   { value: new THREE.Color(0x88a8d0) },
      uOpacity: { value: 1.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
  scene.add(new THREE.Points(liftGeo, liftMat))

  // -- Resize -------------------------------------------------------------
  function resize(): void {
    const w = window.innerWidth
    const h = window.innerHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()
  window.addEventListener('resize', resize)

  // -- Animation ----------------------------------------------------------
  const clock = new THREE.Clock()
  let raf = 0
  const ROTATION_SPEED = 0.012
  const LIFT_SPEED     = 0.22

  let masterOpacity = 0
  const FADE_IN_DURATION = 1.0
  let mountedAt = -1

  function tick(): void {
    raf = requestAnimationFrame(tick)
    const t  = clock.getElapsedTime()
    const dt = Math.min(clock.getDelta(), 0.05)
    if (mountedAt < 0) mountedAt = t

    if (!fadingOut) {
      const sinceMount = t - mountedAt
      masterOpacity = Math.min(1, sinceMount / FADE_IN_DURATION)
    }

    nodeMat.uniforms.uOpacity.value = masterOpacity
    liftMat.uniforms.uOpacity.value = masterOpacity
    linkMat.uniforms.uOpacity.value = masterOpacity

    // Pulse the flagged nodes — sparse, never synchronous.
    for (let i = 0; i < nodeCount; i++) {
      if (nodePulses[i] > 0.5) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.7 + nodePhase[i])
        nodeAlpha[i] = nodeBaseAlpha[i] * (0.55 + 0.45 * pulse)
      }
    }
    nodeGeo.getAttribute('aAlpha').needsUpdate = true

    // Lifting particles — drift up, fade, dormant gap, recycle.
    for (let i = 0; i < LIFT_COUNT; i++) {
      liftAge[i] += dt
      if (liftAge[i] > liftLife[i]) {
        spawnLiftParticle(i)
        liftAge[i] = -(0.6 + Math.random() * 2.2)
      }
      if (liftAge[i] < 0) {
        liftAlpha[i] = 0
        continue
      }
      const tt = liftAge[i] / liftLife[i]
      const lift = LIFT_SPEED * liftAge[i]
      const sway = Math.sin(t * liftSway[i] + i) * 0.04 * tt
      liftPos[i * 3]     = liftSpawn[i * 3] + sway
      liftPos[i * 3 + 1] = liftSpawn[i * 3 + 1] + lift
      liftPos[i * 3 + 2] = liftSpawn[i * 3 + 2] + sway * 0.5
      let a: number
      if (tt < 0.15)      a = tt / 0.15
      else if (tt > 0.40) a = Math.max(0, 1 - (tt - 0.40) / 0.60)
      else                a = 1
      liftAlpha[i] = a * 0.70
    }
    liftGeo.getAttribute('position').needsUpdate = true
    liftGeo.getAttribute('aAlpha').needsUpdate = true

    scene.rotation.y = t * ROTATION_SPEED

    renderer.render(scene, camera)
  }
  raf = requestAnimationFrame(tick)

  // -- fadeOut + dispose --------------------------------------------------
  let disposed = false
  let fadingOut = false
  let fadeOutResolve: (() => void) | null = null

  function fadeOut(durationMs: number = 700): Promise<void> {
    if (fadingOut || disposed) return Promise.resolve()
    fadingOut = true
    const startOpacity = masterOpacity
    const startedAt = performance.now()
    return new Promise<void>(resolve => {
      fadeOutResolve = resolve
      const fadeStep = (): void => {
        if (disposed) { resolve(); return }
        const elapsed = performance.now() - startedAt
        const tProg = Math.min(1, elapsed / durationMs)
        masterOpacity = startOpacity * (1 - tProg)
        if (tProg < 1) requestAnimationFrame(fadeStep)
        else { resolve(); fadeOutResolve = null }
      }
      requestAnimationFrame(fadeStep)
    })
  }

  function dispose(): void {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
    if (fadeOutResolve) fadeOutResolve()
    scene.traverse(obj => {
      const mesh = obj as THREE.Mesh
      const geo = (mesh as unknown as { geometry?: THREE.BufferGeometry }).geometry
      const mat = (mesh as unknown as { material?: THREE.Material | THREE.Material[] }).material
      if (geo) geo.dispose()
      if (mat) {
        if (Array.isArray(mat)) mat.forEach(m => m.dispose())
        else mat.dispose()
      }
    })
    renderer.dispose()
    canvas.remove()
  }

  return { el: canvas, fadeOut, dispose }
}
