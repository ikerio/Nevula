import { renderChapter0 } from './ch-0'
import { renderChapter1 } from './ch-1'
import { renderChapter2 } from './ch-2'
import { renderChapter3 } from './ch-3'
// --- Temporarily disabled 2026-06-05 — to be developed further later. -------
//   To re-enable any of these: uncomment its import below AND its matching
//   entry in BOTH the chapterRenderers array (below) and CHAPTERS in
//   scroll/chapter-config.ts, then restore contiguous data-chapter numbers on
//   the sections (today the survivors are renumbered 0..5; Founders is 4,
//   Get-started is 5 — they'd shift back) and the nav's data-nav-show/data-jump.
// import { renderChapterCmd } from './ch-cmd'            // Command Centers
// import { renderChapterMkt } from './ch-mkt'            // Marketplace
// import { renderChapter4 } from './ch-4'                // Built For
// import { renderChapterTraction } from './ch-traction'  // Traction
// import { renderChapterMfst } from './ch-mfst'          // Manifesto / Ecosystem
import { renderChapter5 } from './ch-5'
import { renderChapter6 } from './ch-6'

/**
 * Chapter order matches `CHAPTERS` in scroll/chapter-config.ts. Five sections
 * (Command, Marketplace, Built For, Traction, Ecosystem) are temporarily
 * disabled — see the commented imports above.
 *
 *   0 Opening       — ch-0
 *   1 Platform      — ch-1
 *   2 How it works  — ch-2
 *   3 Plug & Play   — ch-3
 *   4 Founders      — ch-5
 *   5 Get started   — ch-6
 */
export const chapterRenderers: Array<() => HTMLElement> = [
  renderChapter0,
  renderChapter1,
  renderChapter2,
  renderChapter3,
  // renderChapterCmd,       // Command Centers — disabled
  // renderChapterMkt,       // Marketplace — disabled
  // renderChapter4,         // Built For — disabled
  // renderChapterTraction,  // Traction — disabled
  // renderChapterMfst,      // Manifesto / Ecosystem — disabled
  renderChapter5,
  renderChapter6,
]
