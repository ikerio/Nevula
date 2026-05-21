import { htmlEl } from '../lib/dom'
import { LOGO_USE_HTML } from './logo-mark'

/**
 * Top nav. Visible on chapters 1–8 only (`data-nav-show` consumed by the
 * scroll engine, which sets `--nav-show` on the host element).
 *
 * Note: the nav skips chapter 7 (Manifesto / Ecosystem) — that chapter only
 * appears in the right-side rail. The CTA jumps to the Closing (9).
 */
export function renderNav(): HTMLElement {
  return htmlEl(`
    <header class="nv-nav" data-nav-show="1,2,3,4,5,6,7,8">
      <a class="brand" href="#" data-jump="0">
        <span class="mark">${LOGO_USE_HTML}</span>
        <span>nevula</span>
      </a>
      <nav class="links">
        <a href="#" data-jump="1">Platform</a>
        <a href="#" data-jump="2">How it works</a>
        <a href="#" data-jump="3">Plug &amp; Play</a>
        <a href="#" data-jump="4">Command</a>
        <a href="#" data-jump="5">Marketplace</a>
        <a href="#" data-jump="6">Built for</a>
        <a href="#" data-jump="8">Founders</a>
        <a href="#" class="cta" data-jump="9">Request brief
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
      </nav>
    </header>
  `)
}
