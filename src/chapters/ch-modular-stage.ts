/**
 * Chapter 4 — "Modular by design" 3D stage controller.
 *
 * A genuine three.js scene scoped to the right-column stage region. One
 * PerspectiveCamera (fov 50, pixel-space world: 1 unit = 1 CSS px at z=0) is
 * shared by:
 *   • a CSS3DRenderer — re-parents the authored `.mc-card` DOM (console + 4
 *     satellite screens) into true 3D so the UI text stays crisp + tilted;
 *   • a WebGLRenderer — faint azul TubeGeometry connectors + sparse ambient
 *     dust, behind the cards (no node sprites on the lines).
 *
 * Each screen starts EMPTY; the auto-loop drags a signal chip console→screen
 * and `fillSlot()` reveals that screen's dashboard (`.is-active`). The visitor
 * can grab + drop the chip too; the loop resets all screens to empty at the
 * start of each cycle. A dashed SVG arc traces the active connector.
 *
 * Lifecycle mirrors ch-3-console.ts: gated on `nv:chapter` index 4 (own rAF
 * starts on enter, stops + parks on leave); `prefers-reduced-motion` → static
 * frame (all screens filled); ≤820px / no `#mcStage` → bail (authored markup
 * is the mobile/no-JS fallback). Disposed from main.ts (+ HMR).
 */

import * as THREE from 'three'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import gsap from 'gsap'
import type { NvChapterEvent } from '../lib/events'

const CHAPTER_INDEX = 4
const FOV = 50
const AZUL = 0x00529c
const ORANGE = 0xff6600

/** Ring layout per satellite (must match the `.mc-sat` order in ch-modular.ts). */
interface SatDef { family: string; angle: number; z: number }
const SATS: SatDef[] = [
  { family: 'fire',     angle: 142, z: -30 },
  { family: 'access',   angle: 38,  z: -30 },
  { family: 'health',   angle: 322, z: 14 },
  { family: 'mobility', angle: 218, z: 14 },
]

/** Order the chip demonstrates in the auto-loop (1:1 with the 4 screens). */
const SEQUENCE = ['fire', 'access', 'health', 'mobility'] as const

const CHIP_META: Record<string, { label: string; icon: string }> = {
  fire:     { label: 'Fire Sensor',     icon: 'flame' },
  access:   { label: 'Door Sensor',     icon: 'lock' },
  health:   { label: 'Health Sensor',   icon: 'pulse' },
  mobility: { label: 'Mobility Sensor', icon: 'run' },
}

/** family → console grid cell to glow + launch from. */
const SOURCE_CELL: Record<string, string> = {
  fire: 'ops', access: 'perimeter', health: 'health', mobility: 'mobility',
}

const ICONS: Record<string, string> = {
  flame: '<path d="M12 2c1.5 3 4 4.2 4 7.5a4 4 0 0 1-8 0c0-1.3.5-2.2 1-3 .2 1 .8 1.6 1.7 1.8C10 6.8 11 4.6 12 2Z"/><path d="M9 14a3 3 0 0 0 6 0c0-1-.4-1.8-1-2.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  pulse: '<path d="M2 12h4l2.5-6 4 12 2.5-6H22"/>',
  run: '<circle cx="13" cy="4" r="2"/><path d="m6 17 3-4 3 2 2-3"/><path d="M9 13 8 9l4-1 2 3 3 1"/>',
}
const iconSvg = (k: string) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] ?? ''}</svg>`

export interface ModularStageHandle {
  reset(): void
  dispose(): void
}

export function initModularStage(): ModularStageHandle | null {
  const stage = document.getElementById('mcStage')
  if (!stage) return null
  const cardsHost = stage.querySelector<HTMLElement>('.mc-cards')
  if (!cardsHost) return null

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mobile = window.matchMedia('(max-width: 820px)').matches
  const coarse = window.matchMedia('(pointer: coarse)').matches

  // Mobile: leave the authored static markup as-is (flat stacked, all filled).
  if (mobile) return { reset() {}, dispose() {} }

  // ---- collect authored cards ----
  const consoleEl = cardsHost.querySelector<HTMLElement>('.mc-console')
  const satEls = Array.from(cardsHost.querySelectorAll<HTMLElement>('.mc-sat'))
  if (!consoleEl || satEls.length === 0) return { reset() {}, dispose() {} }
  const satByFamily = new Map<string, HTMLElement>()
  satEls.forEach(el => satByFamily.set(el.dataset.mcFamily ?? '', el))
  const cellByKey = new Map<string, HTMLElement>()
  consoleEl.querySelectorAll<HTMLElement>('.mc-cell').forEach(c => cellByKey.set(c.dataset.mcCell ?? '', c))

  // ---- scene + renderers ----
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const scene = new THREE.Scene()
  const css3dScene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 6000)

  const canvas = document.createElement('canvas')
  canvas.className = 'mc-gl'
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
  renderer.setPixelRatio(dpr)
  stage.appendChild(canvas)

  // Active-connector dashed arc (crisp screen-space SVG, sits behind the cards).
  const NS = 'http://www.w3.org/2000/svg'
  const arcSvg = document.createElementNS(NS, 'svg')
  arcSvg.setAttribute('class', 'mc-arc')
  const arcPath = document.createElementNS(NS, 'path')
  arcSvg.appendChild(arcPath)
  stage.appendChild(arcSvg)

  const css3d = new CSS3DRenderer()
  const cdom = css3d.domElement
  cdom.className = 'mc-css3d'
  cdom.style.position = 'absolute'
  cdom.style.inset = '0'
  cdom.style.zIndex = '2'
  cdom.style.pointerEvents = 'none' // empty areas click-through; cards set their own `auto`
  stage.appendChild(cdom)

  const chipLayer = document.createElement('div')
  chipLayer.className = 'mc-chip-layer'
  const chip = document.createElement('div')
  chip.className = 'mc-chip'
  chip.style.opacity = '0'
  chipLayer.appendChild(chip)
  stage.appendChild(chipLayer)

  // ---- CSS3D objects ----
  const consoleObj = new CSS3DObject(consoleEl)
  css3dScene.add(consoleObj)
  const satObjs = new Map<string, CSS3DObject>()
  for (const el of satEls) {
    const obj = new CSS3DObject(el)
    css3dScene.add(obj)
    satObjs.set(el.dataset.mcFamily ?? '', obj)
  }

  // ---- connectors (rebuilt by layout()) ----
  interface Conn { family: string; curve: THREE.QuadraticBezierCurve3; mesh: THREE.Mesh }
  const conns: Conn[] = []
  const connGroup = new THREE.Group()
  scene.add(connGroup)
  const connMat = new THREE.MeshBasicMaterial({
    color: AZUL, transparent: true, opacity: 0.22, blending: THREE.NormalBlending, depthWrite: false,
  })

  // ---- ambient dust (sparse, soft) ----
  const dotTex = makeDotTexture()
  const DUST = 80
  const dustGeo = new THREE.BufferGeometry()
  const dustPos = new Float32Array(DUST * 3)
  const dustSeed = new Float32Array(DUST)
  const dustCol = new Float32Array(DUST * 3)
  const cAzul = new THREE.Color(AZUL), cOrange = new THREE.Color(ORANGE)
  for (let i = 0; i < DUST; i++) {
    dustSeed[i] = Math.random() * 100
    const c = Math.random() < 0.7 ? cAzul : cOrange
    dustCol[i * 3] = c.r; dustCol[i * 3 + 1] = c.g; dustCol[i * 3 + 2] = c.b
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3))
  dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3))
  const dustMat = new THREE.PointsMaterial({
    map: dotTex, size: 6, sizeAttenuation: true, transparent: true, opacity: 0.3,
    vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false,
  })
  const dustPts = new THREE.Points(dustGeo, dustMat)
  scene.add(dustPts)

  // ---- layout (init + resize): sizes renderers, places cards, builds connectors ----
  let W = 1, H = 1, camZ = 1000
  const satPos = new Map<string, THREE.Vector3>()

  const layout = () => {
    const r = stage.getBoundingClientRect()
    W = Math.max(2, r.width); H = Math.max(2, r.height)
    camZ = (H / 2) / Math.tan((FOV / 2) * Math.PI / 180)
    camera.aspect = W / H
    camera.position.z = camZ
    camera.far = camZ + 2000
    camera.updateProjectionMatrix()
    renderer.setSize(W, H, false)
    css3d.setSize(W, H)
    cdom.style.overflow = 'visible' // let edge satellites use the side margin (CSS3DRenderer forces hidden)

    const rx = W * 0.40, ry = H * 0.42
    consoleObj.position.set(0, 0, 0)
    for (const def of SATS) {
      const a = def.angle * Math.PI / 180
      const p = new THREE.Vector3(Math.cos(a) * rx, Math.sin(a) * ry, def.z)
      satPos.set(def.family, p)
      const obj = satObjs.get(def.family)
      if (obj) {
        obj.position.copy(p)
        obj.rotation.set(Math.sin(a) * 0.3, -Math.cos(a) * 0.46, 0) // yaw/pitch toward center (monitor-wall tilt)
      }
    }

    // (re)build connector tubes
    for (const c of conns) { connGroup.remove(c.mesh); c.mesh.geometry.dispose() }
    conns.length = 0
    for (const def of SATS) {
      const end = satPos.get(def.family)!
      const start = new THREE.Vector3(end.x, end.y, end.z).multiplyScalar(0.24).setZ(8)
      const mid = new THREE.Vector3((start.x + end.x) / 2, (start.y + end.y) / 2 + 24, (start.z + end.z) / 2 + 28)
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end.clone().multiplyScalar(0.84))
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 1.2, 8, false), connMat)
      connGroup.add(mesh)
      conns.push({ family: def.family, curve, mesh })
    }
  }
  layout()

  // ---- chip helpers ----
  const _v = new THREE.Vector3()
  function project(p: THREE.Vector3): [number, number] {
    _v.copy(p).project(camera)
    return [(_v.x * 0.5 + 0.5) * W, (-_v.y * 0.5 + 0.5) * H]
  }
  function setChipScreen(sx: number, sy: number) {
    chip.style.transform = `translate(-50%,-50%) translate(${sx}px,${sy}px)`
  }
  function dressChip(family: string) {
    const m = CHIP_META[family]
    if (!m) return
    chip.innerHTML =
      `<span class="mc-chip-ic">${iconSvg(m.icon)}</span>` +
      `<span class="mc-chip-txt"><span class="nm">${m.label}</span></span>` +
      `<span class="mc-chip-cur" aria-hidden="true"></span>`
    chip.dataset.family = family
  }

  // ---- shared chip/render state ----
  type Mode = 'hidden' | 'travel' | 'rest' | 'drag'
  const S = {
    mode: 'hidden' as Mode,
    chipT: 0,
    curve: null as THREE.QuadraticBezierCurve3 | null,
    rest: new THREE.Vector3(),
    activeFamily: '',
  }

  /** Reveal the dashboard on the screen a signal arrived at / was dropped on. */
  function fillSlot(family: string) {
    satByFamily.get(family)?.classList.add('is-active')
  }
  /** Empty every screen + clear the console cell glows. */
  function clearScreens() {
    satByFamily.forEach(el => el.classList.remove('is-active'))
    cellByKey.forEach(c => c.classList.remove('is-hot'))
  }

  // ---- auto-loop timeline (mutates plain state; rAF does the rendering) ----
  let tl: gsap.core.Timeline | null = null
  function buildTimeline() {
    const t = gsap.timeline({ repeat: -1, paused: true })
    t.call(clearScreens) // each cycle starts with empty screens
    for (const family of SEQUENCE) {
      const conn = conns.find(c => c.family === family)
      t.call(() => {
        dressChip(family)
        S.curve = conn?.curve ?? null
        S.chipT = 0
        S.mode = 'travel'
        S.activeFamily = family
        chip.style.opacity = '1'
        chip.classList.remove('is-grab')
        cellByKey.get(SOURCE_CELL[family])?.classList.add('is-hot')
      })
      t.to(S, { chipT: 1, duration: 1.4, ease: 'power1.inOut' })
      t.call(() => {
        S.mode = 'rest'
        S.rest.copy(satPos.get(family) ?? new THREE.Vector3())
        cellByKey.get(SOURCE_CELL[family])?.classList.remove('is-hot')
        fillSlot(family) // screen fills with its dashboard
      })
      t.to(chip, { opacity: 0, duration: 0.4, delay: 0.9 })
      t.call(() => { S.mode = 'hidden'; S.activeFamily = '' })
      t.to({}, { duration: 0.4 })
    }
    t.to({}, { duration: 1.8 }) // hold the fully-composed view before re-emptying
    return t
  }

  // ---- pointer drag (grab + drop) ----
  let idleTimer = 0
  function pauseLoop() { tl?.pause() }
  function scheduleResume() {
    window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => { if (active && !reduce) tl?.play() }, 3600)
  }
  function nearestSat(sx: number, sy: number): string | null {
    let best: string | null = null, bestD = 150 * 150
    for (const def of SATS) {
      const [px, py] = project(satPos.get(def.family)!)
      const d = (px - sx) ** 2 + (py - sy) ** 2
      if (d < bestD) { bestD = d; best = def.family }
    }
    return best
  }
  let dragId = -1
  const onChipDown = (e: PointerEvent) => {
    if (reduce) return
    e.preventDefault()
    dragId = e.pointerId
    S.mode = 'drag'
    chip.classList.add('is-grab')
    pauseLoop()
    window.clearTimeout(idleTimer)
    try { chip.setPointerCapture(dragId) } catch { /* no active pointer */ }
  }
  const onChipMove = (e: PointerEvent) => {
    if (S.mode !== 'drag' || e.pointerId !== dragId) return
    const r = stage.getBoundingClientRect()
    setChipScreen(e.clientX - r.left, e.clientY - r.top)
  }
  const onChipUp = (e: PointerEvent) => {
    if (e.pointerId !== dragId) return
    try { chip.releasePointerCapture(dragId) } catch { /* already released */ }
    dragId = -1
    chip.classList.remove('is-grab')
    const r = stage.getBoundingClientRect()
    const sx = e.clientX - r.left, sy = e.clientY - r.top
    const hit = nearestSat(sx, sy)
    if (hit) {
      fillSlot(hit)
      S.mode = 'rest'; S.rest.copy(satPos.get(hit) ?? new THREE.Vector3())
      gsap.fromTo(chip, { opacity: 1 }, { opacity: 0, duration: 0.5, delay: 0.5 })
    } else {
      S.mode = 'rest'; S.rest.set(0, 0, 0)
      gsap.to(chip, { opacity: 0, duration: 0.35 })
    }
    scheduleResume()
  }
  chip.addEventListener('pointerdown', onChipDown)
  chip.addEventListener('pointermove', onChipMove)
  chip.addEventListener('pointerup', onChipUp)
  chip.addEventListener('pointercancel', onChipUp)

  // ---- camera parallax (subtle; pointer over the stage) ----
  const parTarget = { x: 0, y: 0 }
  const parallax = !reduce && !coarse
  const onStageMove = (e: PointerEvent) => {
    if (!parallax) return
    const r = stage.getBoundingClientRect()
    parTarget.x = ((e.clientX - r.left) / r.width - 0.5) * 38
    parTarget.y = -((e.clientY - r.top) / r.height - 0.5) * 26
  }
  const onStageLeave = () => { parTarget.x = 0; parTarget.y = 0 }
  if (parallax) {
    stage.addEventListener('pointermove', onStageMove)
    stage.addEventListener('pointerleave', onStageLeave)
  }

  // ---- render loop ----
  let rafId = 0
  let disposed = false
  let active = false
  let arcOffset = 0
  const clock = new THREE.Clock()

  function render(elapsed: number) {
    camera.position.x += (parTarget.x - camera.position.x) * 0.06
    camera.position.y += (parTarget.y - camera.position.y) * 0.06
    camera.lookAt(0, 0, 0)

    // dust drift
    for (let i = 0; i < DUST; i++) {
      const s = dustSeed[i]
      dustPos[i * 3] = Math.sin(elapsed * 0.12 + s) * (W * 0.46) + Math.cos(s * 1.7) * 30
      dustPos[i * 3 + 1] = Math.cos(elapsed * 0.10 + s * 1.3) * (H * 0.46)
      dustPos[i * 3 + 2] = Math.sin(elapsed * 0.08 + s * 0.6) * 140 - 60
    }
    dustGeo.attributes.position.needsUpdate = true

    // chip follows curve (travel) or anchor (rest); drag is set on pointermove
    if (S.mode === 'travel' && S.curve) {
      const [sx, sy] = project(S.curve.getPoint(S.chipT)); setChipScreen(sx, sy)
    } else if (S.mode === 'rest') {
      const [sx, sy] = project(S.rest); setChipScreen(sx, sy)
    }

    // dashed arc tracing the active connector (hidden while dragging)
    if (S.activeFamily && S.mode !== 'drag') {
      const c = conns.find(cc => cc.family === S.activeFamily)
      if (c) {
        let d = ''
        for (let i = 0; i <= 18; i++) {
          const [sx, sy] = project(c.curve.getPoint(i / 18))
          d += (i ? 'L' : 'M') + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' '
        }
        arcPath.setAttribute('d', d)
        arcOffset -= 0.7
        arcPath.style.strokeDashoffset = String(arcOffset)
      }
    } else if (arcPath.getAttribute('d')) {
      arcPath.setAttribute('d', '')
    }

    renderer.render(scene, camera)
    css3d.render(css3dScene, camera)
  }

  function loop() {
    if (disposed || !active) { rafId = 0; return }
    render(clock.getElapsedTime())
    rafId = requestAnimationFrame(loop)
  }
  function start() {
    if (rafId || disposed) return
    rafId = requestAnimationFrame(loop)
  }
  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
  }

  // ---- resize ----
  let resizeRaf = 0
  const onResize = () => {
    if (resizeRaf) return
    resizeRaf = requestAnimationFrame(() => { resizeRaf = 0; layout(); render(clock.getElapsedTime()) })
  }
  window.addEventListener('resize', onResize)

  // ---- lifecycle ----
  function reset() {
    tl?.pause(0)
    S.mode = 'hidden'; S.activeFamily = ''
    chip.style.opacity = '0'
    clearScreens()
  }

  // settle one frame so the CSS3D cards are positioned before the chapter shows
  render(0)

  if (reduce) {
    SEQUENCE.forEach(f => fillSlot(f)) // static: all screens populated
    render(0)
  } else {
    tl = buildTimeline()
  }

  const chapterFn = (e: NvChapterEvent) => {
    const entering = e.detail.index === CHAPTER_INDEX
    if (entering && !active) {
      active = true
      if (reduce) { render(0); return }
      start()
      tl?.restart()
    } else if (!entering && active) {
      active = false
      stop()
      tl?.pause()
      window.clearTimeout(idleTimer)
    }
  }
  window.addEventListener('nv:chapter', chapterFn)

  return {
    reset,
    dispose() {
      disposed = true
      stop()
      tl?.kill(); tl = null
      window.clearTimeout(idleTimer)
      window.removeEventListener('nv:chapter', chapterFn)
      window.removeEventListener('resize', onResize)
      if (parallax) { stage.removeEventListener('pointermove', onStageMove); stage.removeEventListener('pointerleave', onStageLeave) }
      chip.removeEventListener('pointerdown', onChipDown)
      chip.removeEventListener('pointermove', onChipMove)
      chip.removeEventListener('pointerup', onChipUp)
      chip.removeEventListener('pointercancel', onChipUp)
      for (const c of conns) c.mesh.geometry.dispose()
      connMat.dispose()
      dustGeo.dispose(); dustMat.dispose()
      dotTex.dispose()
      renderer.dispose()
      canvas.remove(); arcSvg.remove(); cdom.remove(); chipLayer.remove()
    },
  }
}

/** Small radial-gradient sprite for soft additive dots. */
function makeDotTexture(): THREE.Texture {
  const s = 64
  const cv = document.createElement('canvas'); cv.width = cv.height = s
  const ctx = cv.getContext('2d')!
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, s, s)
  const tex = new THREE.Texture(cv)
  tex.needsUpdate = true
  return tex
}
