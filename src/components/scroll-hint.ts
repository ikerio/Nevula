import { htmlEl } from '../lib/dom'

/** Bottom-center "scroll to begin" hint. Visible only on chapter 0. */
export function renderScrollHint(): HTMLElement {
  return htmlEl(`
    <div class="nv-scroll-hint" data-nav-show="0">
      <span>Scroll to begin</span>
      <span class="line"></span>
    </div>
  `)
}
