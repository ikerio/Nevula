import { htmlEl } from '../lib/dom'
import '../styles/components/demo-disclaimer.css'

/**
 * Demo disclaimer — an interstitial modal shown before any demo / preview link
 * opens, so investors know they're entering an illustrative environment.
 *
 * Any `<a data-demo-link href="…" target="_blank">` on the page is intercepted:
 * the click is captured, the modal explains the preview, and only on "Accept &
 * continue" is the destination opened (in a new tab). Cancel / backdrop / Esc
 * dismiss it. The anchors keep their real `href`, so with JS disabled they
 * still work — they just skip the disclaimer.
 *
 * Mounted once from main.ts (returns a dispose() for HMR). Mirrors the founder
 * dossier's overlay conventions (body scroll-lock class, focus handling).
 */

export interface DemoDisclaimerHandle {
  dispose(): void
}

const EYE =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>'

let backdrop: HTMLElement | null = null
let pendingHref = ''
let lastFocus: HTMLElement | null = null

function build(): HTMLElement {
  return htmlEl(`
    <div class="dd-backdrop" role="dialog" aria-modal="true" aria-labelledby="dd-title">
      <div class="dd-panel" tabindex="-1">
        <div class="dd-head">
          <span class="dd-ic">${EYE}</span>
          <span class="dd-kicker"><span class="dd-dot"></span>Preview environment</span>
        </div>
        <h2 class="dd-title" id="dd-title">You're entering a <em>visual preview</em>.</h2>
        <p class="dd-body">
          This is a guided preview of the Nevula orchestration platform. The
          interface, data, metrics and alerts shown are illustrative &mdash; for
          demonstration purposes only &mdash; and don't represent live systems or
          real customer information.
        </p>
        <div class="dd-actions">
          <button type="button" class="nv-btn nv-btn-ghost dd-cancel">Cancel</button>
          <button type="button" class="nv-btn nv-btn-primary dd-accept">Accept &amp; continue
            <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `)
}

function open(href: string): void {
  if (backdrop) return
  pendingHref = href
  lastFocus = (document.activeElement as HTMLElement | null) ?? null
  backdrop = build()
  document.body.appendChild(backdrop)
  document.body.classList.add('dd-open')
  requestAnimationFrame(() => backdrop?.querySelector<HTMLElement>('.dd-accept')?.focus())
}

function close(): void {
  if (!backdrop) return
  backdrop.remove()
  backdrop = null
  document.body.classList.remove('dd-open')
  lastFocus?.focus?.()
  lastFocus = null
}

function accept(): void {
  const href = pendingHref
  close()
  if (!href) return
  // Triggered by the Accept click (a user gesture), so this isn't popup-blocked.
  const win = window.open(href, '_blank', 'noopener')
  if (!win) window.location.href = href // fallback if a blocker still intervened
}

export function initDemoDisclaimer(): DemoDisclaimerHandle {
  const onClick = (e: Event): void => {
    const t = e.target as HTMLElement | null
    if (!t) return

    // Intercept demo links → show the disclaimer instead of navigating.
    const link = t.closest<HTMLAnchorElement>('a[data-demo-link]')
    if (link && !backdrop) {
      e.preventDefault()
      open(link.href)
      return
    }

    if (!backdrop) return
    if (t.closest('.dd-accept')) { accept(); return }
    if (t.closest('.dd-cancel')) { close(); return }
    if (t === backdrop) close() // click outside the panel
  }

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && backdrop) {
      e.preventDefault()
      close()
    }
  }

  document.addEventListener('click', onClick)
  window.addEventListener('keydown', onKey)

  return {
    dispose(): void {
      document.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
      if (backdrop) { backdrop.remove(); backdrop = null }
      document.body.classList.remove('dd-open')
    },
  }
}
