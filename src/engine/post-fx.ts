import type * as THREE from 'three'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ToneMappingEffect,
  ToneMappingMode,
  KernelSize,
} from 'postprocessing'

export interface PostFxOptions {
  /** Bloom intensity multiplier. Default 0.45. */
  bloomIntensity?: number
  /** Luminance threshold for bloom extraction. Default 0.20 (low — captures orange particles on a silver bg). */
  bloomThreshold?: number
  /** Luminance smoothing (soft edge of the threshold). Default 0.35. */
  bloomSmoothing?: number
  /** Bloom blur kernel. Default MEDIUM. */
  bloomKernel?: KernelSize
  /** Use modern mipmap blur (soft bloom). Default true. */
  bloomMipmap?: boolean
  /** Tonemap mode. Default ACES_FILMIC. */
  toneMapping?: ToneMappingMode
}

/**
 * Builds an EffectComposer with RenderPass → BloomEffect → ACES tonemap.
 * Background slot only — preview slots bypass this and render raw via the
 * scissor path in shared-context.
 */
export function createComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  opts: PostFxOptions = {},
): EffectComposer {
  const composer = new EffectComposer(renderer)

  composer.addPass(new RenderPass(scene, camera))

  const bloom = new BloomEffect({
    // Threshold lowered to 0.10 to catch cobalt particles (luminance ~0.10-0.15)
    // in addition to orange (~0.45). Smoothing widened so the threshold edge is
    // soft. Intensity dialed down to 0.40 to compensate for catching more pixels.
    intensity:           opts.bloomIntensity ?? 0.40,
    luminanceThreshold:  opts.bloomThreshold ?? 0.10,
    luminanceSmoothing:  opts.bloomSmoothing ?? 0.40,
    kernelSize:          opts.bloomKernel    ?? KernelSize.MEDIUM,
    mipmapBlur:          opts.bloomMipmap    ?? true,
  })

  const tonemap = new ToneMappingEffect({
    mode: opts.toneMapping ?? ToneMappingMode.ACES_FILMIC,
  })

  composer.addPass(new EffectPass(camera, bloom, tonemap))

  return composer
}
