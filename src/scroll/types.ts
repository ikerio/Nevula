/**
 * The 9 possible particle states. Defined here (duplicated in engine/types.ts
 * in Phase 3) so the scroll engine compiles without depending on the engine yet.
 */
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

export interface ChapterConfig {
  key: string
  /** Particle state to morph into when this chapter is dominant. */
  state: ParticleState
  /** Particle field scale (default 1). */
  scale?: number
  /** Subject offset [x, y] in normalized viewport units; +x right, +y up. */
  offset?: [number, number]
  /** Per-particle base size. Engine default 0.022. Bump for hero chapters
   *  where particles should read bigger (e.g., the logo mark). */
  size?: number
  /** Human-readable label used in nav/rail. */
  label: string
}

export interface ScrollState {
  progress: number
  t: number
  currentIndex: number
}

export interface NevulaScrollOptions {
  chapters: ChapterConfig[]
  /** Element hosting [data-chapter] children. Defaults to document. */
  container?: Document | HTMLElement
  /** Height per chapter in vh units. Default 180. */
  perChapterVh?: number
  /** 0..1 lerp factor. 1 = direct bind to scroll (default). */
  lerpSpeed?: number
  /** Soft snap toward nearest chapter when idle. Default false. */
  snap?: boolean
  /** Fired when the dominant chapter changes. */
  onChapterChange?: (idx: number, config: ChapterConfig, prev: number) => void
  /** Fired every tick. */
  onProgress?: (state: ScrollState) => void
}
