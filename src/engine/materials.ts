import * as THREE from 'three'
import type { ParticleState } from './types'
import vertexShader from './shaders/particle.vert.glsl?raw'
import fragmentShader from './shaders/particle.frag.glsl?raw'

export interface ParticleUniforms {
  uSize: { value: number }
  uPixelRatio: { value: number }
  uOpacity: { value: number }
  /** Internal alpha multiplier driven by the per-state blending crossfade. */
  uBlendFade: { value: number }
  uFogColor: { value: THREE.Color }
  uFogDensity: { value: number }
}

/**
 * Per-state blending mode. Trails uses additive (the radial spokes converging
 * on a hub benefit from energy-style oversaturation). Everything else,
 * including logo, stays on normal blending — additive on the logo washed
 * dense clusters out to peach/white, which dominated over the brand orange.
 * Bloom still provides the glow on bright pixels through normal blending.
 */
export const STATE_BLENDING: Record<ParticleState, THREE.Blending> = {
  nebula:          THREE.NormalBlending,
  constellation:   THREE.NormalBlending,
  flow:            THREE.NormalBlending,
  city:            THREE.NormalBlending,
  building:        THREE.NormalBlending,
  home:            THREE.NormalBlending,
  device:          THREE.NormalBlending,
  logo:            THREE.NormalBlending,
  trails:          THREE.AdditiveBlending,
  'public-safety': THREE.NormalBlending,
  'microprocessor': THREE.NormalBlending,
  'traction':      THREE.NormalBlending,
}

export interface ParticleMaterialOptions {
  /** Base point size; the shader scales by aSize per-particle and DPR. */
  size: number
  /** Renderer pixel ratio (read once at construction). */
  pixelRatio: number
  /** Per-state blending mode. Phase 5 will switch this per-state at runtime. */
  blending?: THREE.Blending
  /** Hex color for FogExp2 mix. Default matches `--bg-base` silver. */
  fogColor?: number
  /** FogExp2 density. 0 disables fog. Default 0 (off). */
  fogDensity?: number
}

/** Builds the shared Points ShaderMaterial used by both background + slots. */
export function createParticleMaterial(opts: ParticleMaterialOptions): {
  material: THREE.ShaderMaterial
  uniforms: ParticleUniforms
} {
  const uniforms: ParticleUniforms = {
    uSize:       { value: opts.size * 520 },
    uPixelRatio: { value: opts.pixelRatio },
    uOpacity:    { value: 1.0 },
    uBlendFade:  { value: 1.0 },
    uFogColor:   { value: new THREE.Color(opts.fogColor ?? 0xe6e8ef) },
    uFogDensity: { value: opts.fogDensity ?? 0 },
  }
  const material = new THREE.ShaderMaterial({
    // Cast: ShaderMaterial expects a loose { [key]: IUniform } index, but we
    // model the uniforms as a precise typed record for consumer ergonomics.
    uniforms: uniforms as unknown as { [key: string]: THREE.IUniform },
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: opts.blending ?? THREE.NormalBlending,
    vertexColors: true,
  })
  return { material, uniforms }
}
