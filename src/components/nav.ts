import { htmlEl } from '../lib/dom'
import { LOGO_USE_HTML } from './logo-mark'
import type { ChapterConfig } from '../scroll/types'

/**
 * Top floating brand + CTA + (mobile) section menu.
 *
 * Desktop: brand (left) + "Request brief" CTA (right); the right-side rail
 * handles section navigation. `data-nav-show` is consumed by the scroll engine,
 * which sets `--nav-show` on the host.
 *
 * Mobile (≤820px, via CSS): the CTA is hidden and a hamburger button reveals a
 * compact section menu — the rail is hidden there, so this is how you jump
 * between chapters without scrolling the whole page. Menu items carry
 * `data-jump`, so the global handler in main.ts does the actual scroll-into-view
 * (native on mobile); this component only owns open/close + marking the section
 * you're currently in.
 */
export function renderNav(chapters: ChapterConfig[]): HTMLElement {
  const items = chapters
    .map((c, i) => `
      <li role="none">
        <button class="nv-menu-item" role="menuitem" data-jump="${i}" data-ix="${i}">
          <span class="ix">${String(i).padStart(2, '0')}</span>
          <span class="nm">${c.label}</span>
          <svg class="go" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </li>`)
    .join('')

  const el = htmlEl(`
    <header class="nv-nav" data-nav-show="1,2,3">
      <a class="brand" href="#" data-jump="0">
        <span class="mark">${LOGO_USE_HTML}</span>
        <span>nevula</span>
      </a>
      <a href="#" class="cta" data-jump="6">Request brief
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
      <button class="nv-menu-btn" type="button" aria-label="Open sections menu" aria-expanded="false" aria-controls="nv-menu">
        <span class="bars" aria-hidden="true"><i></i><i></i><i></i></span>
      </button>
      <div class="nv-menu" id="nv-menu" aria-hidden="true">
        <div class="nv-menu-scrim"></div>
        <nav class="nv-menu-panel" role="menu" aria-label="Sections">
          <p class="nv-menu-head">Sections</p>
          <ul role="none">${items}</ul>
        </nav>
      </div>
    </header>
  `)

  const btn = el.querySelector<HTMLButtonElement>('.nv-menu-btn')!
  const menu = el.querySelector<HTMLElement>('.nv-menu')!
  const scrim = el.querySelector<HTMLElement>('.nv-menu-scrim')!
  const itemEls = Array.from(el.querySelectorAll<HTMLButtonElement>('.nv-menu-item'))

  // Mark whichever section currently sits under the top of the viewport, so the
  // open menu shows "where am I" — computed on open, no per-frame tracking.
  function markCurrent(): void {
    let cur = 0
    for (let i = 0; i < itemEls.length; i++) {
      const sec = document.querySelector(`[data-chapter="${i}"]`)
      if (!sec) continue
      const r = sec.getBoundingClientRect()
      if (r.top <= 120 && r.bottom > 120) { cur = i; break }
      if (r.top <= 120) cur = i
    }
    itemEls.forEach(it => it.classList.toggle('is-current', Number(it.dataset.ix) === cur))
  }

  const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') close() }

  function open(): void {
    markCurrent()
    el.classList.add('is-menu-open')
    menu.setAttribute('aria-hidden', 'false')
    btn.setAttribute('aria-expanded', 'true')
    btn.setAttribute('aria-label', 'Close sections menu')
    document.addEventListener('keydown', onKey)
  }
  function close(): void {
    el.classList.remove('is-menu-open')
    menu.setAttribute('aria-hidden', 'true')
    btn.setAttribute('aria-expanded', 'false')
    btn.setAttribute('aria-label', 'Open sections menu')
    document.removeEventListener('keydown', onKey)
  }

  btn.addEventListener('click', () =>
    el.classList.contains('is-menu-open') ? close() : open(),
  )
  scrim.addEventListener('click', close)
  // Tapping an item closes the menu; the global data-jump handler (main.ts)
  // performs the scroll-into-view.
  itemEls.forEach(it => it.addEventListener('click', close))

  return el
}
