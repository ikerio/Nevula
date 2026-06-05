import type { ChapterConfig } from './types'

/**
 * The 10-chapter timeline. Three new sections (Command Centers, Marketplace,
 * Manifesto/Ecosystem) were inserted in 2026-05-20 — the original chapters
 * stayed in place but renumbered: Built For 4→6, Founders 5→8, Closing 6→9.
 *
 * Particle state + scale + offset (x, y) bias the subject across the viewport.
 * Positive x = right of center; positive y = up.
 *
 * `label` populates the right-side chapter rail. Chapter 7's label is
 * 'Ecosystem' (the rail-facing name) rather than its data-screen-label
 * 'Manifesto' so it reads as the third ecosystem-appeal section.
 */
export const CHAPTERS: ChapterConfig[] = [
  // Hero chapters (logo) use slightly bigger particles so the brand mark
  // reads as a solid V rather than a sparse outline.
  { key: 'opening',     state: 'logo',          scale: 1.15, offset: [0,     0],     size: 0.030, label: 'Opening' },
  { key: 'platform',    state: 'city',          scale: 1.05, offset: [0.55,  0.05],               label: 'Platform' },
  { key: 'howitworks',  state: 'constellation', scale: 0.95, offset: [0.55, -0.05],               label: 'How it works' },
  { key: 'plugplay',    state: 'trails',        scale: 0.95, offset: [0.55,  0.00],               label: 'Plug & Play' },
  // --- Temporarily disabled 2026-06-05 — develop further later. Re-enable each
  //     here AND its renderer in chapters/index.ts, then restore contiguous
  //     data-chapter numbers on the sections. (Traction uses its own bespoke
  //     `traction` particle state: 4 cluster anchors behind the partner cards,
  //     faint convergence Beziers toward center, and a horizontal spine.) ---
  // { key: 'commandctrs', state: 'building',      scale: 1.00, offset: [-0.55, 0.00],               label: 'Command' },
  // { key: 'marketplace', state: 'home',          scale: 0.95, offset: [0.00, -0.30],               label: 'Marketplace' },
  // { key: 'builtfor',    state: 'device',        scale: 1.05, offset: [-0.55, 0.05],               label: 'Built for' },
  // { key: 'traction',    state: 'traction',      scale: 1.00, offset: [0.00,  0.00],               label: 'Traction' },
  // { key: 'manifesto',   state: 'nebula',        scale: 1.10, offset: [0.00,  0.00],               label: 'Ecosystem' },
  { key: 'founders',    state: 'nebula',        scale: 0.85, offset: [0,    -0.20],               label: 'Founders' },
  { key: 'closing',     state: 'logo',          scale: 1.15, offset: [0,     0],     size: 0.030, label: 'Get started' },
]
