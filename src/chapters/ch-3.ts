import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-3.css'
import '../styles/chapters/ch-3-surfaces.css'

/**
 * Chapter 3 — Plug & Play.
 *
 * Right column is a self-running "one console" demo that auto-loops the
 * product story across three surfaces: Buy (Marketplace) → Compose (Station)
 * → Monitor (Console). The left rail switches surface as the loop advances.
 * This module renders static markup only; the phase sequencer lives in
 * `./ch-3-console.ts`.
 *
 * NOTE: the three `.pp-view` surface bodies are scaffold placeholders for now
 * (`.pp-ph`). They get replaced one at a time with the real, condensed
 * surfaces ported from the Nevula Demo (Marketplace / Station / Console).
 */
export function renderChapter3(): HTMLElement {
  // Rail / surface icons lifted from the Nevula Demo nav (mountChrome).
  const IC_MARKET = '<path d="M3 9h18l-1.5 10.5a2 2 0 0 1-2 1.5H6.5a2 2 0 0 1-2-1.5z"/><path d="M3 9 5 4h14l2 5"/><path d="M9 13a3 3 0 0 0 6 0"/>'
  const IC_STATION = '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'
  const IC_CONSOLE = '<path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/>'

  return htmlEl(`
    <section class="nv-chapter ch-3" data-chapter="3" data-screen-label="03 Plug & Play">
      <div class="layout">
        <div class="pp-head">
          <div class="nv-eyebrow">
            <span class="num">03</span>
            <span class="bar"></span>
            <span>Plug &amp; Play</span>
          </div>
          <h2 class="nv-title size-l">
            One console.<br/><em>Every device family.</em>
          </h2>
          <p class="nv-lede">
            Fire sensors, panic buttons, door contacts, health monitors, mobility
            trackers &mdash; link any device family and Nevula's console reconfigures
            itself in real time. Widgets self-configure, telemetry flows,
            alerts land on the same pane of glass. No custom integrations.
            No separate vendor consoles.
          </p>

          <div class="pp-stats">
            <div class="pp-stat">
              <span class="lbl">01 &middot; Families</span>
              <span class="v">12+<span class="u">supported</span></span>
              <span class="ds">Fire &middot; panic &middot; access &middot; health &middot; mobility &middot; more.</span>
            </div>
            <div class="pp-stat">
              <span class="lbl">02 &middot; Setup</span>
              <span class="v">0<span class="u">SDKs</span></span>
              <span class="ds">Widgets self-configure when a family is linked.</span>
            </div>
            <div class="pp-stat">
              <span class="lbl">03 &middot; Glass</span>
              <span class="v">1<span class="u">console</span></span>
              <span class="ds">Cross-vendor, cross-protocol, one operator view.</span>
            </div>
          </div>
        </div>

        <div class="pp-stage" id="ppStage">
          <button class="pp-replay" id="ppReplay" aria-label="Replay sequence">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 12a9 9 0 1 0 3-6.7"/>
              <path d="M3 4v5h5"/>
            </svg>
          </button>

          <div class="pp-console">
            <div class="pp-top">
              <div class="left">
                <span class="brand">
                  <span class="mark"><svg viewBox="0 0 2160 2160"><use href="#nv-iso"/></svg></span>
                  nevula
                </span>
                <span class="sep"></span>
                <span class="crumb" id="ppCrumb">marketplace</span>
              </div>
              <div class="right">
                <span class="pill alerts"><span class="dot"></span><span id="ppAlertCount">0</span> alerts</span>
                <span class="pill live"><span class="dot"></span>live</span>
                <span class="clock" id="ppClock">12:42:18</span>
              </div>
            </div>

            <div class="pp-rail" role="tablist" aria-label="Console surfaces">
              <button class="pp-surf" data-surf="1" type="button" aria-label="Station">
                <span class="ico"><svg viewBox="0 0 24 24">${IC_STATION}</svg></span>
                <span class="nm">Station</span>
              </button>
              <button class="pp-surf" data-surf="0" type="button" aria-label="Marketplace">
                <span class="ico"><svg viewBox="0 0 24 24">${IC_MARKET}</svg></span>
                <span class="nm">Market</span>
              </button>
              <button class="pp-surf" data-surf="2" type="button" aria-label="Console">
                <span class="ico"><svg viewBox="0 0 24 24">${IC_CONSOLE}</svg></span>
                <span class="nm">Console</span>
              </button>
            </div>

            <div class="pp-views" id="ppViews">
              <!-- Surface 0 · Buy — Marketplace. Filled by mountMarketplace(). -->
              <section class="pp-view" data-surf="0" aria-label="Buy — Marketplace"></section>
              <!-- Surface 1 · Compose — Station. Filled by mountStation(). -->
              <section class="pp-view" data-surf="1" aria-label="Compose — Station"></section>
              <!-- Surface 2 · Monitor — Console. Filled by mountConsole(). -->
              <section class="pp-view" data-surf="2" aria-label="Monitor — Console"></section>
            </div>

            <div class="pp-foot">
              <div class="left">
                <span class="surface">surface <span class="v" id="ppSurfaceName">marketplace</span></span>
              </div>
              <div class="right">
                <span class="pq" id="ppStatus">browsing catalog</span>
                <span class="auto">auto-provisioned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `)
}
