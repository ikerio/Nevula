import { htmlEl } from '../lib/dom'
import type { FieldHandle, ParticleState } from '../engine/types'
import {
  getMicroprocessorHoveredChipIndex,
  getMicroprocessorChipScreenPositions,
} from '../engine/states/microprocessor'
import '../styles/chapters/ch-1.css'

// ---------------------------------------------------------------------------
// Per-card mapping: card id → particle state to morph into when expanded.
// Cards without a `state` entry don't react to clicks (this pass only ships
// Public Safety end-to-end; Smart Cities / Logistics / Connected Life come
// in a follow-up).
// ---------------------------------------------------------------------------
const CARD_STATES: Record<string, ParticleState> = {
  'public-safety': 'public-safety',
  'logistics': 'microprocessor',
}

/** Default state for chapter 01 when no card is expanded — matches the
 *  scroll-engine's `chapter-config.ts` entry for `platform`. */
const CH1_DEFAULT_STATE: ParticleState = 'city'

/** Scale applied to the field when a card is expanded. The expanded panel
 *  takes up the left half, so the particle viz needs to read smaller than
 *  the chapter's default 1.05 — otherwise the GLB shape (normalized to a
 *  3-unit extent) overflows into the panel area. */
const CH1_EXPANDED_SCALE = 0.8
const CH1_DEFAULT_SCALE = 1.05  // matches chapter-config.ts entry for platform

/** Per-particle size while expanded. Smaller than the chapter's default 0.022
 *  so individual dots read sharper against the GLB's denser geometry — the
 *  user wanted higher density + smaller dots so plate/building silhouettes
 *  are easier to discern. */
const CH1_EXPANDED_SIZE = 0.015
const CH1_DEFAULT_SIZE = 0.022  // default base size from SlotInternal defaults

export function renderChapter1(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-1" data-chapter="1" data-screen-label="01 What Is Nevula">
      <div class="layout">
        <div class="ch1-head">
          <div class="nv-eyebrow">
            <span class="num">01</span>
            <span class="bar"></span>
            <span>What Is Nevula?</span>
          </div>
          <h2 class="nv-title size-l">
            Digital infrastructure<br/><em>for SafeTech.</em>
          </h2>
          <p class="nv-lede-lead">
            Nevula is a digital infrastructure provider (SaaS / IoTaaS) that
            transforms how integrators, developers, and service providers
            deliver SafeTech services.
          </p>
          <p class="nv-lede">
            Our platform powers solutions in smart cities, public safety,
            logistics, home security, healthcare, and pet care &mdash; among other
            industries &mdash; using AI, LPWAN connectivity, and an open API ecosystem.
          </p>
          <ul class="hero-chips" aria-label="Platform qualities">
            <li class="hero-chip"><span class="dot"></span>Scalable</li>
            <li class="hero-chip"><span class="dot"></span>Interoperable</li>
            <li class="hero-chip"><span class="dot"></span>Cost-effective</li>
          </ul>
        </div>

        <!-- Expanded panel — Public Safety. Hidden by default; revealed BELOW
             the head when the matching card is clicked. The .ch1-head stays
             visible; the panel slides in below it. -->
        <div class="use-panel" data-card-id="public-safety" aria-hidden="true">
          <div class="up-badge">
            <span class="up-shield" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 2 L17 5 V10 C17 14 14 17 10 18 C6 17 3 14 3 10 V5 Z"/>
              </svg>
            </span>
            <span class="up-eyebrow">Public safety</span>
          </div>
          <h3 class="up-title">Responsive intelligence at city scale.</h3>
          <p class="up-lede">
            Modernize emergency response and operations with real-time
            situational awareness, predictive insights, and secure coordination
            across agencies and systems.
          </p>
          <ul class="up-bullets">
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              Real-time incident detection &amp; alerts
            </li>
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              AI-assisted decision support
            </li>
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              Secure multi-agency coordination
            </li>
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              Interoperable data &amp; system integration
            </li>
          </ul>
          <div class="up-stats">
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="9" r="7"/>
                  <path d="M9 5 L9 9 L12 11"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">99.99%</span>
                <span class="up-stat-label">Platform uptime</span>
              </div>
            </div>
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9 L7 9 L8.5 5 L11 13 L12.5 9 L15 9"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">&lt;200ms</span>
                <span class="up-stat-label">Event latency</span>
              </div>
            </div>
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="4" y="8" width="10" height="7" rx="1.2"/>
                  <path d="M6 8 V5.5 a3 3 0 0 1 6 0 V8"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">256-bit</span>
                <span class="up-stat-label">End-to-end encryption</span>
              </div>
            </div>
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="9" r="7"/>
                  <path d="M2 9 H16"/>
                  <path d="M9 2 C11.5 5 11.5 13 9 16 C6.5 13 6.5 5 9 2 Z"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">24/7</span>
                <span class="up-stat-label">Global support</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Expanded panel — Logistics. Placeholder copy until the user
             provides final text; structure mirrors Public Safety. -->
        <div class="use-panel" data-card-id="logistics" aria-hidden="true">
          <div class="up-badge">
            <span class="up-shield" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="6" width="9" height="7" rx="0.6"/>
                <path d="M11 8 L15 8 L17.5 11 L17.5 13 L11 13 Z"/>
                <circle cx="5.5" cy="14.5" r="1.4"/>
                <circle cx="14" cy="14.5" r="1.4"/>
              </svg>
            </span>
            <span class="up-eyebrow">Logistics</span>
          </div>
          <h3 class="up-title">End-to-end fleet &amp; supply visibility.</h3>
          <p class="up-lede">
            Track vehicles, monitor cold chain integrity, and orchestrate
            logistics operations across your entire LPWAN-connected fleet &mdash;
            one backbone, every link in the chain.
          </p>
          <ul class="up-bullets">
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              Real-time fleet telemetry &amp; routing
            </li>
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              Cold chain integrity monitoring
            </li>
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              Asset tracking &amp; smart geofencing
            </li>
            <li>
              <span class="up-check" aria-hidden="true">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 6.2 L5 8.7 L9.5 3.8"/></svg>
              </span>
              Predictive maintenance alerts
            </li>
          </ul>
          <div class="up-stats">
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="9" cy="9" r="7"/>
                  <path d="M2 9 H16"/>
                  <path d="M9 2 C11.5 5 11.5 13 9 16 C6.5 13 6.5 5 9 2 Z"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">99.7%</span>
                <span class="up-stat-label">LPWAN coverage</span>
              </div>
            </div>
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 9 L7 9 L8.5 5 L11 13 L12.5 9 L15 9"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">&lt;500ms</span>
                <span class="up-stat-label">Tracking update</span>
              </div>
            </div>
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="5" y="4" width="8" height="11" rx="1.2"/>
                  <path d="M7.5 4 V3 H10.5 V4"/>
                  <path d="M9 7 V12"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">10-yr</span>
                <span class="up-stat-label">Sensor battery life</span>
              </div>
            </div>
            <div class="up-stat">
              <span class="up-stat-icon" aria-hidden="true">
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 14 L7 8 L10 11 L15 4"/>
                  <path d="M11 4 L15 4 L15 8"/>
                </svg>
              </span>
              <div>
                <span class="up-stat-value">1M+</span>
                <span class="up-stat-label">Events / day</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Connector line — SVG L-shape from panel bottom to active card top.
           Coordinates are recomputed in JS on mount + resize + state change. -->
      <svg class="use-connector" aria-hidden="true">
        <path d=""></path>
      </svg>

      <!-- Chip hover overlays — Logistics. One floating card per chip in
           the Microprocessor.glb. Positioned in screen-pixel coords each
           frame by initChapter1Cards's RAF loop (only runs while Logistics
           is expanded). pointer-events: none so they don't block raycasting. -->
      <div class="chip-overlays" aria-hidden="true">
        <div class="chip-overlay" data-chip-ix="0">
          <span class="co-eyebrow">Telemetry</span>
          <p>Real-time vehicle tracking &amp; route optimization</p>
        </div>
        <div class="chip-overlay" data-chip-ix="1">
          <span class="co-eyebrow">Cold chain</span>
          <p>Temperature &amp; humidity integrity monitoring</p>
        </div>
        <div class="chip-overlay" data-chip-ix="2">
          <span class="co-eyebrow">Assets</span>
          <p>Cargo tags, smart geofencing &amp; alerts</p>
        </div>
        <div class="chip-overlay" data-chip-ix="3">
          <span class="co-eyebrow">Maintenance</span>
          <p>Predictive failure detection across the fleet</p>
        </div>
      </div>

      <div class="use-strip">
        <div class="use-card" data-card-id="smart-cities">
          <span class="ix">01 &middot; Smart cities</span>
          <h5>Utilities &middot; mobility</h5>
          <p>Environmental telemetry, municipal coordination, public infra.</p>
        </div>
        <div class="use-card" data-card-id="public-safety">
          <span class="ix">02 &middot; Public safety</span>
          <h5>Response &amp; intelligence</h5>
          <p>911 modernization, crime intelligence, dispatch coordination.</p>
        </div>
        <div class="use-card" data-card-id="logistics">
          <span class="ix">03 &middot; Logistics</span>
          <h5>Fleet &amp; cold chain</h5>
          <p>Trucks, cargo seals, asset tags on a single LPWAN backbone.</p>
        </div>
        <div class="use-card" data-card-id="connected-life">
          <span class="ix">04 &middot; Connected life</span>
          <h5>Home &middot; health &middot; pet</h5>
          <p>Residential, healthcare, and pet-care sensors at SMS-level cost.</p>
        </div>
      </div>
    </section>
  `)
}

export interface Chapter1CardsHandle {
  dispose(): void
}

/**
 * Wire chapter 01 card clicks to particle-state morphs + expanded-panel UI.
 *
 *   - Click a card with a configured state → expand it (highlight card, reveal
 *     its panel, fade out the default head, dispatch the state to the field).
 *   - Click the active card again → collapse back to the default head + state.
 *   - Click a different configured card → switch (collapse current, expand new).
 *   - Scroll away from chapter 01 → silently collapse the panel; the scroll
 *     engine's onChapterChange already handles the state morph for the new
 *     chapter, so we don't dispatch state here.
 *
 * Only Public Safety is wired in this pass. Cards without a `CARD_STATES`
 * entry stay non-interactive.
 */
export function initChapter1Cards(field: FieldHandle): Chapter1CardsHandle {
  const section = document.querySelector<HTMLElement>('.ch-1')
  if (!section) {
    return { dispose: () => {} }
  }

  const strip = section.querySelector<HTMLElement>('.use-strip')
  if (!strip) {
    return { dispose: () => {} }
  }

  // ---- Connector line geometry ---------------------------------------------
  // SVG sits absolutely positioned over the chapter, with size matching the
  // section. The path is an L-shape from the bottom-left of the active
  // panel down to the top-center of the active card. Recomputed on
  // mount, resize, and every state change.
  const connectorSvg = section.querySelector<SVGSVGElement>('.use-connector')
  const connectorPath = section.querySelector<SVGPathElement>('.use-connector path')

  function updateConnector(): void {
    if (!section || !connectorSvg || !connectorPath) return
    const activeCard = section.querySelector<HTMLElement>('.use-card.is-active')
    const activePanel = section.querySelector<HTMLElement>('.use-panel.is-active')
    if (!activeCard || !activePanel) {
      connectorPath.setAttribute('d', '')
      return
    }
    const sectionRect = section.getBoundingClientRect()
    const panelRect = activePanel.getBoundingClientRect()
    const cardRect = activeCard.getBoundingClientRect()

    // Coords relative to the section.
    const startX = panelRect.left - sectionRect.left + 20  // slight inset from panel's left edge
    const startY = panelRect.bottom - sectionRect.top + 2
    const endX = cardRect.left + cardRect.width / 2 - sectionRect.left
    const endY = cardRect.top - sectionRect.top - 2
    // Mid-Y for the elbow — about 70% of the way down from panel to card.
    const elbowY = startY + (endY - startY) * 0.65
    const cornerR = 10

    // L-shape with one rounded corner at the elbow:
    //   M startX startY
    //   V (elbowY - cornerR)              vertical drop
    //   Q elbow corner over to horizontal
    //   H (endX - cornerR or +cornerR)    horizontal toward card
    //   Q rounded turn up
    //   V endY                            short vertical into card top
    const goesRight = endX > startX
    const hCornerSign = goesRight ? 1 : -1
    const beforeCornerX = endX - hCornerSign * cornerR
    const afterTurnY = elbowY + cornerR
    const d = [
      `M ${startX} ${startY}`,
      `V ${elbowY - cornerR}`,
      `Q ${startX} ${elbowY} ${startX + hCornerSign * cornerR} ${elbowY}`,
      `H ${beforeCornerX}`,
      `Q ${endX} ${elbowY} ${endX} ${afterTurnY}`,
      `V ${endY}`,
    ].join(' ')
    connectorPath.setAttribute('d', d)

    // Size the SVG to span the whole section so its coord space matches.
    connectorSvg.setAttribute('width', String(sectionRect.width))
    connectorSvg.setAttribute('height', String(sectionRect.height))
    connectorSvg.setAttribute('viewBox', `0 0 ${sectionRect.width} ${sectionRect.height}`)
  }

  function clearActive(): void {
    if (!section) return
    section.classList.remove('is-expanded')
    section
      .querySelectorAll<HTMLElement>('.use-card.is-active')
      .forEach(el => el.classList.remove('is-active'))
    section
      .querySelectorAll<HTMLElement>('.use-panel.is-active')
      .forEach(el => {
        el.classList.remove('is-active')
        el.setAttribute('aria-hidden', 'true')
      })
    updateConnector()
  }

  function collapse(): void {
    clearActive()
    field.setState(CH1_DEFAULT_STATE)
    field.setScale(CH1_DEFAULT_SCALE)
    field.setSize(CH1_DEFAULT_SIZE)
  }

  function expand(card: HTMLElement, state: ParticleState, cardId: string): void {
    if (!section) return
    clearActive()
    card.classList.add('is-active')
    const panel = section.querySelector<HTMLElement>(
      `.use-panel[data-card-id="${cardId}"]`,
    )
    if (panel) {
      panel.classList.add('is-active')
      panel.setAttribute('aria-hidden', 'false')
    }
    section.classList.add('is-expanded')
    field.setState(state)
    field.setScale(CH1_EXPANDED_SCALE)
    field.setSize(CH1_EXPANDED_SIZE)
    // Recompute the connector once the panel's expand transition completes
    // so the path lands on the final layout rather than the mid-animation one.
    requestAnimationFrame(() => updateConnector())
    setTimeout(() => updateConnector(), 380)
  }

  const onCardClick = (e: Event): void => {
    const target = e.target as HTMLElement | null
    if (!target) return
    const card = target.closest<HTMLElement>('.use-card')
    if (!card) return
    const cardId = card.dataset.cardId
    if (!cardId) return
    const state = CARD_STATES[cardId]
    // Cards without a state mapping aren't wired yet — silently ignore.
    if (!state) return
    if (card.classList.contains('is-active')) {
      collapse()
    } else {
      expand(card, state, cardId)
    }
  }
  strip.addEventListener('click', onCardClick)

  // Auto-collapse when the scroll engine moves the dominant chapter off ch-1.
  // We DON'T dispatch state here — the engine's onChapterChange will set the
  // new chapter's state immediately. Just tidy the UI classes.
  const onChapterChange = (e: WindowEventMap['nv:chapter']): void => {
    if (e.detail.index === 1) return
    if (!section || !section.classList.contains('is-expanded')) return
    clearActive()
  }
  window.addEventListener('nv:chapter', onChapterChange)

  // Recompute the connector on any window resize.
  const onResize = (): void => updateConnector()
  window.addEventListener('resize', onResize)

  // ---- Chip hover overlay loop ---------------------------------------------
  // Runs while Logistics is expanded. Each frame: read the engine's hover
  // index + chip screen positions, update each overlay's left/top + visible
  // class. RAF (no setInterval) so it pauses naturally when the tab is
  // backgrounded. Stops on collapse / state-change to avoid extra work
  // when no overlays are showing.
  const chipOverlays = Array.from(
    section.querySelectorAll<HTMLElement>('.chip-overlay'),
  )
  let chipOverlayRaf = 0

  function tickChipOverlays(): void {
    const hovered = getMicroprocessorHoveredChipIndex()
    const positions = getMicroprocessorChipScreenPositions()
    for (let i = 0; i < chipOverlays.length; i++) {
      const el = chipOverlays[i]
      const pos = positions[i]
      if (pos) {
        el.style.left = pos.x + 'px'
        el.style.top = pos.y + 'px'
      }
      el.classList.toggle('is-visible', i === hovered && pos != null)
    }
    chipOverlayRaf = requestAnimationFrame(tickChipOverlays)
  }
  function startChipOverlays(): void {
    if (chipOverlayRaf) return
    chipOverlayRaf = requestAnimationFrame(tickChipOverlays)
  }
  function stopChipOverlays(): void {
    if (chipOverlayRaf) cancelAnimationFrame(chipOverlayRaf)
    chipOverlayRaf = 0
    for (const el of chipOverlays) el.classList.remove('is-visible')
  }

  // Hook into expand/collapse via a post-step. The existing expand()/collapse()
  // are above; we re-wrap by listening for class changes — simplest: monkey-
  // patch by replacing the click handler with one that also toggles overlays.
  // (Actually simpler: just check after a microtask which state is active.)
  // We instead wire start/stop directly inside the click handler path by
  // observing section's .is-expanded + the active card's id.
  const observeForChipOverlays = (): void => {
    const isLogisticsActive =
      section?.classList.contains('is-expanded') &&
      !!section.querySelector('.use-card.is-active[data-card-id="logistics"]')
    if (isLogisticsActive) startChipOverlays()
    else stopChipOverlays()
  }
  // Run after every click (event bubbles up after the handler runs).
  strip.addEventListener('click', () => requestAnimationFrame(observeForChipOverlays))
  // Also when the chapter changes away.
  window.addEventListener('nv:chapter', () => requestAnimationFrame(observeForChipOverlays))

  return {
    dispose: () => {
      strip.removeEventListener('click', onCardClick)
      window.removeEventListener('nv:chapter', onChapterChange)
      window.removeEventListener('resize', onResize)
      stopChipOverlays()
    },
  }
}
