import { htmlEl } from '../lib/dom'
import type { Founder } from './ch-5'
import '../styles/chapters/ch-5-dossier.css'

/**
 * Founder dossier — the full-screen overlay that surfaces when a card is
 * clicked. Layout: left preview panel (oversized index + portrait
 * placeholder), right body (header, bio, three-entry track record,
 * three stat cells in a row). Closes on Esc, on backdrop click outside
 * the panel, and on the × button.
 *
 * The overlay is mounted lazily and torn down on close, so the rest of
 * the page pays nothing for it when it's not visible.
 */

export interface FounderDossierHandle {
  dispose(): void
}

let backdrop: HTMLElement | null = null
let lastFocus: HTMLElement | null = null

function buildDossier(f: Founder): HTMLElement {
  const trackRowsHtml = f.trackRecord
    .map(
      (t, i) => `
        <li class="fd-track-item">
          <span class="fd-track-num">${String(i + 1).padStart(2, '0')}</span>
          <div class="fd-track-body">
            <h4 class="fd-track-company">${t.company}</h4>
            <p class="fd-track-desc">${t.description}</p>
          </div>
          <span class="fd-track-range">${t.range}</span>
        </li>
      `,
    )
    .join('')

  const statsHtml = f.stats
    .map(
      s => `
        <div class="fd-stat">
          <span class="fd-stat-label">${s.label}</span>
          <span class="fd-stat-val">${s.value}</span>
        </div>
      `,
    )
    .join('')

  return htmlEl(`
    <div class="fd-backdrop" role="dialog" aria-modal="true" aria-labelledby="fd-name">
      <div class="fd-panel" tabindex="-1">
        <button class="fd-close" type="button" aria-label="Close dossier">
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4L12 12M12 4L4 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>
        </button>

        <aside class="fd-preview" aria-hidden="true">
          <div class="fd-preview-head">
            <span class="fd-preview-num">${f.index}</span>
            <span class="fd-preview-tick"></span>
          </div>
          <div class="fd-preview-portrait">
            <div class="fc-portrait-placeholder">
              <div class="fc-portrait-circle"></div>
              <div class="fc-portrait-label">Portrait pending</div>
            </div>
          </div>
          <div class="fd-preview-foot">
            <span class="fc-meta-dot"></span>
            <span>Nevula &middot; Dossier · 2026</span>
          </div>
        </aside>

        <main class="fd-body">
          <header class="fd-header">
            <span class="fd-index">${f.index}</span>
            <span class="fd-sep" aria-hidden="true"></span>
            <span class="fd-role">Founder &middot; ${f.role}</span>
          </header>

          <h2 class="fd-name" id="fd-name">${f.name}</h2>
          <p class="fd-tag">${f.tagline}</p>

          <p class="fd-bio">${f.bio}</p>

          <section class="fd-track" aria-label="Track record">
            <h3 class="fd-section-label">Track record</h3>
            <ol class="fd-track-list">${trackRowsHtml}</ol>
          </section>

          <section class="fd-stats" aria-label="Headline stats">
            ${statsHtml}
          </section>
        </main>
      </div>
    </div>
  `)
}

export function openFounderDossier(f: Founder): void {
  // If already open, swap contents in place rather than animate a fresh
  // mount — feels snappier when a user opens one then immediately clicks
  // a different card via keyboard nav.
  if (backdrop) {
    backdrop.replaceWith(buildDossier(f))
    backdrop = document.querySelector('.fd-backdrop')
    backdrop?.querySelector<HTMLElement>('.fd-panel')?.focus()
    return
  }
  lastFocus = (document.activeElement as HTMLElement | null) ?? null
  backdrop = buildDossier(f)
  document.body.appendChild(backdrop)
  document.body.classList.add('fd-open')

  // Move focus into the panel for keyboard users; the panel itself has
  // tabindex=-1 so it's focusable programmatically without entering the
  // tab order.
  requestAnimationFrame(() => {
    backdrop?.querySelector<HTMLElement>('.fd-panel')?.focus()
  })
}

export function closeFounderDossier(): void {
  if (!backdrop) return
  backdrop.remove()
  backdrop = null
  document.body.classList.remove('fd-open')
  lastFocus?.focus?.()
  lastFocus = null
}

/** Wire global handlers (Esc, click-on-backdrop, ×-button). Idempotent —
 *  guarded against double-init. */
export function initFounderDossier(): FounderDossierHandle {
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && backdrop) {
      e.preventDefault()
      closeFounderDossier()
    }
  }
  // Delegated click on document — handles both the backdrop (closes when
  // the user clicks outside the panel) and the × button. Live on document
  // so re-renders of the dossier don't drop the binding.
  const onClick = (e: Event): void => {
    if (!backdrop) return
    const target = e.target as HTMLElement | null
    if (!target) return
    if (target.closest('.fd-close')) {
      closeFounderDossier()
      return
    }
    // Clicking the backdrop itself (not the panel within it) closes.
    if (target === backdrop) closeFounderDossier()
  }

  window.addEventListener('keydown', onKey)
  document.addEventListener('click', onClick)

  return {
    dispose(): void {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClick)
      if (backdrop) {
        backdrop.remove()
        backdrop = null
      }
      document.body.classList.remove('fd-open')
    },
  }
}
