import { htmlEl } from '../lib/dom'
import type { ChapterConfig } from '../scroll/types'

/** Right-side progress rail with one dot per chapter. */
export function renderChapterRail(chapters: ChapterConfig[]): HTMLElement {
  const dots = chapters
    .map((c, i) => `
      <button class="dot" data-rail-dot data-jump="${i}">
        <span class="label"><span class="ix">${String(i).padStart(2, '0')}</span><span class="nm">${c.label}</span></span>
        <span class="mark"></span>
      </button>
    `)
    .join('')

  return htmlEl(`
    <aside class="nv-rail" aria-label="Chapter progress">
      ${dots}
    </aside>
  `)
}
