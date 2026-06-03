import type * as THREE from 'three'
import type { ParticleUniforms } from './materials'

// Canonical ParticleState definition. Kept in sync with scroll/types.ts
// (scroll module re-declares it to avoid forcing the engine as a dep).
export type ParticleState =
  | 'nebula'
  | 'constellation'
  | 'flow'
  | 'logo'
  | 'trails'
  | 'city'
  | 'building'
  | 'home'
  | 'device'
  | 'public-safety'
  | 'microprocessor'
  | 'traction'

/** Returns count*3 Float32Array of XYZ positions in roughly [-1.5, 1.5]. */
export type StateGenerator = (count: number) => Float32Array

export interface SlotOptions {
  /** Number of particles. Default 1200. */
  count?: number
  /** Base point size (~0.016 yields ~8px on 1080p). */
  size?: number
  state?: ParticleState
  scale?: number
  /** Background color used by preview slots when they clear their rect. */
  clearColor?: number
  /** Alpha used by preview slots when they clear their rect. */
  clearAlpha?: number
  /** Enables pointer parallax (only meaningful for the background slot). */
  interactive?: boolean
  /** Constellation-only line segments between near neighbors. */
  lines?: boolean
  /** Hex color for FogExp2 mix. Default `--bg-base` (#e6e8ef). */
  fogColor?: number
  /** FogExp2 density. 0 disables fog. Default 0 (off for preview slots). */
  fogDensity?: number
  /** Attach the cursor-FX + nebula gas-cloud layer (background slot only). */
  backgroundFx?: boolean
}

/** Cursor-parting + orchestration-edges + gas-cloud layer (background only).
 *  All sub-objects are parented to slot.points and live in its local space. */
export interface FieldFx {
  /** Eased per-particle cursor-parting displacement. */
  dispX: Float32Array
  dispY: Float32Array
  /** Orchestration edge layer (custom per-vertex-alpha line shader). */
  edgeSeg: THREE.LineSegments
  /** Eased edge-layer visibility (fades in on ambient states). */
  linkEase: number
  /** Per-cell color accumulator (sum rgb + count) for the color field. */
  cfTemp: Float32Array
  /** Uploaded color-field bytes (rgb + coverage). */
  colorFieldData: Uint8Array
  colorTex: THREE.DataTexture
  /** Procedural fbm gas-cloud plane (nebula only). */
  cloudMesh: THREE.Mesh
  /** Eased nebula-state cloud visibility. */
  gasFade: number
  /** Cursor position projected into points-local space. */
  cursorLocal: THREE.Vector3
}

/** Internal slot record (everything the renderer needs). */
export interface SlotInternal {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  points: THREE.Points
  geo: THREE.BufferGeometry
  material: THREE.ShaderMaterial
  uniforms: ParticleUniforms
  lineSegs: THREE.LineSegments | null

  /** Current resting positions (the target the per-state behavior wiggles around). */
  targetPos: Float32Array

  /** When a new state is requested, the new positions/colors land here and slot.isMorphing flips on. */
  pendingTargets: Float32Array | null
  pendingColors: Float32Array | null
  isMorphing: boolean

  count: number
  state: ParticleState

  /** Current scale (lerped toward scaleTarget). */
  scale: number
  scaleTarget: number

  opts: Required<SlotOptions>

  /** Pointer-parallax tracking (interactive background only). */
  mouseX: number
  mouseY: number
  mouseTx: number
  mouseTy: number

  /** Subject offset within the slot's viewport. */
  offsetX: number
  offsetY: number
  offsetXTarget: number
  offsetYTarget: number

  /** Per-state base rotation applied to the points object, on top of the
   *  mouse-parallax pitch. Lerped each frame toward STATE_ROTATIONS[state]
   *  so transitions between e.g. city → public-safety smoothly rotate the
   *  scene from flat to isometric instead of snapping. */
  baseRotX: number
  baseRotY: number

  /** Preview-slot DOM element (only set on slots created via NevulaSlot). */
  el?: HTMLElement

  /** Cursor-FX + gas-cloud layer. Set only on the interactive background slot. */
  fx?: FieldFx

  /**
   * Active blending-mode crossfade. Driven by `setSlotState` whenever the new
   * state's blending differs from the current material.blending. The shader's
   * uBlendFade uniform ramps 1 → 0 → 1 across the swap to hide the visual pop.
   */
  blendingTransition: BlendingTransition | null
}

export interface BlendingTransition {
  phase: 'fading-out' | 'fading-in'
  /** performance.now() when the current phase started. */
  startedAt: number
  /** uBlendFade value at the start of the current phase. */
  fromFade: number
  /** Target blending mode applied at the fade-out → fade-in boundary. */
  targetBlending: THREE.Blending
}

export interface SlotHandle {
  setState(s: ParticleState): void
  /** Set the scale TARGET. The slot lerps toward this value (5% per frame). */
  setScale(s: number): void
  /** Set the scale instantly — both current and target. Used for GSAP-driven
   *  tweens where the slot's internal lerp would lag behind the animation. */
  setScaleImmediate(s: number): void
  setOpacity(o: number): void
  setOffset(x: number, y: number): void
  /** Update per-particle base size (default 0.022 set at slot creation). */
  setSize(s: number): void
  readonly state: ParticleState
}

/** The background slot's public handle. Same shape as a preview-slot handle. */
export type FieldHandle = SlotHandle
