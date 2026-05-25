import { htmlEl } from '../lib/dom'
import { LOGO_USE_HTML } from './logo-mark'

/**
 * Top floating brand + CTA. Visible on chapters 1–8 (`data-nav-show` consumed
 * by the scroll engine, which sets `--nav-show` on the host). The middle
 * chapter links were removed in favor of the right-side rail — keeping both
 * was redundant and ate the upper viewport area on laptop heights.
 */
export function renderNav(): HTMLElement {
  return htmlEl(`
    <header class="nv-nav" data-nav-show="1,2,3,4,5,6,7,8">
      <a class="brand" href="#" data-jump="0">
        <span class="mark">${LOGO_USE_HTML}</span>
        <span>nevula</span>
      </a>
      <a href="#" class="cta" data-jump="9">Request brief
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
    </header>
  `)
}
