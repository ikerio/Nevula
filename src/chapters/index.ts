import { renderChapter0 } from './ch-0'
import { renderChapter1 } from './ch-1'
import { renderChapter2 } from './ch-2'
import { renderChapter3 } from './ch-3'
import { renderChapterCmd } from './ch-cmd'
import { renderChapterMkt } from './ch-mkt'
import { renderChapter4 } from './ch-4'
import { renderChapterTraction } from './ch-traction'
import { renderChapterMfst } from './ch-mfst'
import { renderChapter5 } from './ch-5'
import { renderChapter6 } from './ch-6'

/**
 * Chapter order matches `CHAPTERS` in scroll/chapter-config.ts:
 *   0 Opening (logo)        — ch-0
 *   1 Platform (city)       — ch-1
 *   2 How it works          — ch-2
 *   3 Plug & Play           — ch-3
 *   4 Command Centers       — ch-cmd
 *   5 Marketplace           — ch-mkt
 *   6 Built For             — ch-4
 *   7 Traction              — ch-traction ← inserted 2026-05-25
 *   8 Manifesto / Ecosystem — ch-mfst (renumbered 7→8)
 *   9 Founders              — ch-5  (renumbered 8→9)
 *  10 Get started           — ch-6  (renumbered 9→10)
 */
export const chapterRenderers: Array<() => HTMLElement> = [
  renderChapter0,
  renderChapter1,
  renderChapter2,
  renderChapter3,
  renderChapterCmd,
  renderChapterMkt,
  renderChapter4,
  renderChapterTraction,
  renderChapterMfst,
  renderChapter5,
  renderChapter6,
]
