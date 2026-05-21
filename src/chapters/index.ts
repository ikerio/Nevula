import { renderChapter0 } from './ch-0'
import { renderChapter1 } from './ch-1'
import { renderChapter2 } from './ch-2'
import { renderChapter3 } from './ch-3'
import { renderChapterCmd } from './ch-cmd'
import { renderChapterMkt } from './ch-mkt'
import { renderChapter4 } from './ch-4'
import { renderChapterMfst } from './ch-mfst'
import { renderChapter5 } from './ch-5'
import { renderChapter6 } from './ch-6'

/**
 * Chapter order matches `CHAPTERS` in scroll/chapter-config.ts:
 *   0 Opening (logo)        — ch-0
 *   1 Platform (city)       — ch-1
 *   2 How it works          — ch-2
 *   3 Plug & Play           — ch-3
 *   4 Command Centers       — ch-cmd  ← inserted
 *   5 Marketplace           — ch-mkt  ← inserted
 *   6 Built For             — ch-4  (renumbered from old position 4)
 *   7 Manifesto / Ecosystem — ch-mfst ← inserted
 *   8 Founders              — ch-5  (renumbered from old position 5)
 *   9 Get started           — ch-6  (renumbered from old position 6)
 */
export const chapterRenderers: Array<() => HTMLElement> = [
  renderChapter0,
  renderChapter1,
  renderChapter2,
  renderChapter3,
  renderChapterCmd,
  renderChapterMkt,
  renderChapter4,
  renderChapterMfst,
  renderChapter5,
  renderChapter6,
]
