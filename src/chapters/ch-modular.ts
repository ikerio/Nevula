import { htmlEl } from '../lib/dom'
import '../styles/chapters/ch-modular.css'

/**
 * Chapter 4 — Modular by design.
 *
 * Left column: section head (eyebrow / distinct headline / lede / 3-stat strip).
 *
 * Right column: a genuine three.js stage. A central "console" monitor with a
 * 2x2 group grid is ringed by FOUR floating satellite SCREENS. Each screen
 * starts EMPTY ("awaiting signal"); when the matching signal is dragged onto
 * it (auto-loop or by hand) it fills with a real mini-dashboard. Curved
 * connectors link them and a dashed arc traces the active drag.
 *
 * The card DOM (incl. each screen's hidden filled content) is authored HERE so
 * it doubles as the mobile / no-JS fallback. On desktop, `initModularStage()`
 * (./ch-modular-stage.ts) re-parents each `.mc-card` into a CSS3DObject, drives
 * the scene, and toggles `.is-active` to reveal a screen's content; on mobile /
 * reduced-motion it bails and CSS shows every screen filled in a flat stack.
 */

// ---- Stroke icons (viewBox 0 0 24 24) ----
const IC: Record<string, string> = {
  layers: '<path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>',
  heart: '<path d="M19.5 13.5 12 21l-7.5-7.5a4.6 4.6 0 0 1 6.5-6.5l1 1 1-1a4.6 4.6 0 0 1 6.5 6.5Z"/>',
  run: '<circle cx="13" cy="4" r="2"/><path d="m6 17 3-4 3 2 2-3"/><path d="M9 13 8 9l4-1 2 3 3 1"/>',
  flame: '<path d="M12 2c1.5 3 4 4.2 4 7.5a4 4 0 0 1-8 0c0-1.3.5-2.2 1-3 .2 1 .8 1.6 1.7 1.8C10 6.8 11 4.6 12 2Z"/><path d="M9 14a3 3 0 0 0 6 0c0-1-.4-1.8-1-2.5"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  pulse: '<path d="M2 12h4l2.5-6 4 12 2.5-6H22"/>',
  home: '<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  map: '<path d="m9 4 6 2 6-2v14l-6 2-6-2-6 2V6z"/><path d="M9 4v14M15 6v14"/>',
  gauge: '<path d="M12 13 16 9"/><path d="M4 18a8 8 0 1 1 16 0"/>',
}
const svg = (paths: string, sw = 1.6) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`

// ---- Screen building blocks ----
const winHead = (icon: string, title: string) => `
  <header class="mc-scr-top">
    <span class="mc-scr-ic">${svg(icon, 1.7)}</span>
    <span class="mc-scr-ttl">${title}</span>
    <span class="mc-scr-dots"><i></i><i></i><i></i></span>
  </header>`

const rail = (icons: string[]) =>
  `<div class="mc-rail">${icons.map(i => `<span>${svg(IC[i], 1.6)}</span>`).join('')}</div>`

type Row = { nm: string; sub?: string; badge?: string; kind?: 'crit' | 'warn' | 'ok'; rt?: string }
const badge = (t: string, kind = 'ok') => `<span class="mc-badge is-${kind}">${t}</span>`
const list = (rows: Row[]) => `
  <ul class="mc-list">
    ${rows.map(r => `
      <li class="mc-li">
        <span class="mc-li-dot is-${r.kind ?? 'ok'}"></span>
        <span class="mc-li-tx"><span class="nm">${r.nm}</span>${r.sub ? `<span class="sub">${r.sub}</span>` : ''}</span>
        <span class="mc-li-rt">${r.badge ? badge(r.badge, r.kind) : ''}${r.rt ? `<span class="rt">${r.rt}</span>` : ''}</span>
      </li>`).join('')}
  </ul>`

const lineSvg = (vals: number[]) => {
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 116 + 2},${42 - v * 38}`).join(' ')
  const last = vals[vals.length - 1]
  return `
  <svg class="mc-chart mc-linechart" viewBox="0 0 120 46" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pts}"></polyline>
    <circle cx="118" cy="${42 - last * 38}" r="2.4"></circle>
  </svg>`
}

const trio = (items: { v: string; l: string }[]) =>
  `<div class="mc-trio">${items.map(i => `<div class="mc-tri"><span class="v">${i.v}</span><span class="l">${i.l}</span></div>`).join('')}</div>`

const filled = (inner: string) => `<div class="mc-filled">${inner}</div>`
const empty = (icon: string) =>
  `<div class="mc-empty"><span class="mc-empty-ic">${svg(icon)}</span><span class="mc-empty-tx">Awaiting signal</span></div>`

/**
 * One satellite screen: a tilted monitor that starts EMPTY and reveals its
 * `filledInner` dashboard once `.is-active` is set (a signal docked here).
 */
function screen(family: string, icon: string, title: string, filledInner: string): string {
  return `
    <article class="mc-card mc-sat" data-mc-card="sat" data-mc-family="${family}">
      <div class="mc-scr">
        ${winHead(icon, title)}
        <div class="mc-scr-body">
          ${empty(icon)}
          ${filled(filledInner)}
        </div>
      </div>
    </article>`
}

/** Central console group tile. */
function cell(key: string, name: string, count: string, icon: string): string {
  return `
    <div class="mc-cell" data-mc-cell="${key}">
      <div class="mc-cell-tx"><span class="nm">${name}</span><span class="ct">${count} signals</span></div>
      <span class="mc-cell-ic">${svg(icon, 1.7)}</span>
      <span class="mc-cell-spark" aria-hidden="true"></span>
    </div>`
}

export function renderChapterModular(): HTMLElement {
  return htmlEl(`
    <section class="nv-chapter ch-modular" data-chapter="4" data-screen-label="04 Modular by design">
      <div class="layout">
        <div class="mc-head">
          <div class="nv-eyebrow">
            <span class="num">04</span>
            <span class="bar"></span>
            <span>Modular by design</span>
          </div>
          <h2 class="nv-title size-l">
            Every signal,<br/><em>on the screen you choose.</em>
          </h2>
          <p class="nv-lede">
            Fire sensors, panic buttons, door contacts, health monitors and
            mobility trackers connect into one modular Nevula console. Operators
            drag each signal into different screens for clearer visualization,
            faster triage and immediate response.
          </p>
        </div>

        <div class="mc-stage" id="mcStage">
          <div class="mc-cards" id="mcCards">
            <!-- Central console (origin of the 3D ring). -->
            <article class="mc-card mc-console" data-mc-card="console">
              <header class="mc-console-top">
                <span class="brand">
                  <span class="mark"><svg viewBox="0 0 2160 2160"><use href="#nv-iso"/></svg></span>
                  nevula
                </span>
                <span class="sep"></span>
                <span class="crumb">console</span>
                <span class="grow"></span>
                <span class="pill alerts"><span class="dot"></span>3 alerts</span>
                <span class="pill live"><span class="dot"></span>live</span>
              </header>
              <div class="mc-grid">
                ${cell('ops', 'Operations Floor', '12', IC.layers)}
                ${cell('perimeter', 'Perimeter', '8', IC.shield)}
                ${cell('health', 'Health &amp; Wellness', '7', IC.heart)}
                ${cell('mobility', 'Mobility', '9', IC.run)}
              </div>
            </article>

            <!-- Four satellite screens (start empty, fill on drag). -->
            ${screen('fire', IC.flame, 'Fire systems', rail(['home', 'grid', 'bell']) + `<div class="mc-scr-main">${list([
              { nm: 'Fire Detector', sub: '2nd Floor · Corridor', badge: 'Alert', kind: 'crit' },
              { nm: 'Smoke Detector', sub: '1st Floor · Lobby', badge: 'Warning', kind: 'warn' },
              { nm: 'Sprinkler Valve', sub: 'Basement', badge: 'Normal', kind: 'ok' },
            ])}</div>`)}

            ${screen('access', IC.lock, 'Access control', rail(['home', 'grid', 'gauge']) + `<div class="mc-scr-main">${list([
              { nm: 'Main Entrance', sub: 'Door unlocked', rt: '09:14:32', kind: 'warn' },
              { nm: 'Server Room', sub: 'Door locked', rt: '09:14:10', kind: 'ok' },
              { nm: 'Loading Dock', sub: 'Door locked', rt: '09:13:54', kind: 'ok' },
            ])}</div>`)}

            ${screen('health', IC.pulse, 'Health monitoring', rail(['home', 'heart', 'gauge']) + `<div class="mc-scr-main">${list([
              { nm: 'Health Kiosk 1', sub: 'Lobby', rt: '72 bpm', kind: 'ok' },
              { nm: 'Area 2 (East)', sub: '2nd Floor', rt: '66 bpm', kind: 'ok' },
              { nm: 'Device 3A-22', sub: 'Floor 3', rt: '75 bpm', kind: 'ok' },
            ])}</div>`)}

            ${screen('mobility', IC.run, 'Mobility tracking', rail(['home', 'map', 'gauge']) + `<div class="mc-scr-main">${trio([
              { v: '24', l: 'Active assets' }, { v: '68%', l: 'Utilization' }, { v: '2', l: 'Alerts' },
            ])}${lineSvg([0.3, 0.5, 0.42, 0.62, 0.55, 0.78, 0.7])}</div>`)}
          </div>
        </div>
      </div>
    </section>
  `)
}
