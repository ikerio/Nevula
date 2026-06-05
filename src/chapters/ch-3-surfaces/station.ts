/**
 * Chapter 3 · Surface 1 — Station ("Compose").
 *
 * Ported from Nevula Demo/_unpacked/station (assets/a1.js services +
 * a6.js engine). Renders the real "compose your command center" canvas —
 * KPI bar, service palette, workspace of live module tiles, stack meter —
 * then auto-plays the signature beat: a service flies from the palette into
 * the workspace, pops in as a live module, and the KPIs + stack meter bump.
 *
 * Module bodies use synthesized per-service summaries (statline + feed rows)
 * rather than porting the full NEV_FLEET dataset — same faithful look.
 */

import type { SurfaceController } from './types'

const LANG: 'es' | 'en' = 'en'

const ICONS: Record<string, string> = {
  monitoreo: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="4"/></svg>',
  panico: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/></svg>',
  senior: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 12h3l2-5 4 10 2-5h7"/></svg>',
  ambulancia: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 8h11v9H3z"/><path d="M14 11h4l3 3v3h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M7 10v4M5 12h4"/></svg>',
  acceso: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="8" cy="9" r="3"/><path d="m10.5 11 6 6M14.5 13l2 2M16 18l2-2"/><path d="M4 21h16"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 7h13v10H3z"/><path d="m16 10 5-3v10l-5-3z"/><circle cx="8" cy="12" r="2"/></svg>',
  iot: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></svg>',
  incendio: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 9 12 3"/></svg>',
  geocerca: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/></svg>',
}

interface Svc { id: string; cat: 'subscribed' | 'available'; accent: string; soft: string; es: string; en: string; sub: { es: string; en: string }; devices: number; events: number; sla: string }

const SERVICES: Svc[] = [
  { id: 'monitoreo', cat: 'subscribed', accent: 'var(--crit)', soft: 'var(--crit-soft)', es: 'Monitoreo en Vivo', en: 'Live Monitoring', sub: { es: 'cola de alarmas', en: 'live alarm queue' }, devices: 0, events: 124, sla: '< 90 s' },
  { id: 'panico', cat: 'subscribed', accent: 'var(--orange-500)', soft: 'var(--signal-soft)', es: 'Botón de Pánico', en: 'Panic Button', sub: { es: 'SOS · despacho', en: 'SOS · dispatch' }, devices: 12, events: 38, sla: '< 1 min' },
  { id: 'senior', cat: 'subscribed', accent: 'var(--cobalt-500)', soft: 'var(--cobalt-50)', es: 'Cuidado Senior', en: 'Senior Care', sub: { es: 'monitoreo asistido', en: 'assisted monitoring' }, devices: 9, events: 14, sla: '< 2 min' },
  { id: 'ambulancia', cat: 'subscribed', accent: 'var(--crit)', soft: 'var(--crit-soft)', es: 'Coordinación Ambulancia', en: 'Ambulance Coord.', sub: { es: 'flota médica', en: 'medical fleet' }, devices: 0, events: 6, sla: '< 4 min' },
  { id: 'acceso', cat: 'subscribed', accent: 'var(--ice-500)', soft: 'var(--info-soft)', es: 'Gestión de Acceso', en: 'Access Mgmt', sub: { es: 'perímetro · puertas', en: 'perimeter · doors' }, devices: 7, events: 22, sla: '< 30 s' },
  { id: 'iot', cat: 'subscribed', accent: 'var(--ok)', soft: 'var(--ok-soft)', es: 'Salud de Dispositivos', en: 'Device Health', sub: { es: 'telemetría IoT', en: 'IoT telemetry' }, devices: 0, events: 4, sla: '—' },
  { id: 'video', cat: 'available', accent: 'var(--ink-200)', soft: 'rgba(10,15,31,0.08)', es: 'Video Verificación', en: 'Video Verification', sub: { es: 'IA · intrusos', en: 'AI · intrusion' }, devices: 6, events: 19, sla: '< 1 min' },
  { id: 'incendio', cat: 'available', accent: 'var(--orange-600)', soft: 'var(--signal-soft)', es: 'Detección de Incendio', en: 'Fire Detection', sub: { es: 'humo · temp', en: 'smoke · temp' }, devices: 8, events: 2, sla: '< 1 min' },
]

const SLA_SEC: Record<string, number> = { acceso: 30, panico: 60, video: 60, incendio: 60, geocerca: 120, senior: 120, ambulancia: 240, iot: 9999, monitoreo: 90 }

// Synthesized per-service module body (statline + feed) — faithful look without
// porting the whole fleet dataset.
const SUMMARY: Record<string, { stats: [string, string][]; rows: [string, string, string, string][] }> = {
  monitoreo: { stats: [['In queue', '7'], ['Critical', '3'], ['SLA', '< 90s']], rows: [['var(--crit)', '#8485 assault', 'María L. Q.', 'now'], ['var(--orange-500)', '#8520 temp', 'threshold A', '4m']] },
  panico: { stats: [['Stations', '12'], ['Today', '38'], ['SLA', '< 1m']], rows: [['var(--orange-500)', 'STA-04 button', 'Insurgentes 1602', '12:38'], ['var(--ok)', 'STA-11 test', 'verified', '12:31']] },
  senior: { stats: [['Residents', '9'], ['Watch', '1'], ['Avg HR', '72']], rows: [['var(--warn)', 'R-15 elevated', '102 bpm', 'now'], ['var(--ok)', 'R-04 resting', '68 bpm', '2m']] },
  ambulancia: { stats: [['Units', '6'], ['En route', '1'], ['ETA', '2:18']], rows: [['var(--crit)', 'AMB-02 dispatch', 'Polanco', '2:18'], ['var(--ok)', 'AMB-05 available', 'base', '—']] },
  acceso: { stats: [['Doors', '47'], ['Open', '3'], ['SLA', '< 30s']], rows: [['var(--ice-500)', 'DR-09 main', 'propped open', '0m'], ['var(--ok)', 'DR-15 lobby', 'closed', '12m']] },
  iot: { stats: [['Devices', '38'], ['Online', '98%'], ['Low batt', '2']], rows: [['var(--ok)', 'Heartbeat', 'all nominal', '8s'], ['var(--warn)', '12C99BB', 'battery 41%', '1m']] },
  video: { stats: [['Cameras', '6'], ['Alerts', '2'], ['SLA', '< 1m']], rows: [['var(--ice-500)', 'CAM-03 motion', 'loading dock', 'now'], ['var(--ok)', 'CAM-01 clear', 'lobby', '—']] },
  incendio: { stats: [['Sensors', '8'], ['Alerts', '0'], ['SLA', '< 1m']], rows: [['var(--ok)', 'Zone A', 'nominal', '12s'], ['var(--ok)', 'Zone B', 'nominal', '30s']] },
}

const PALETTE_ORDER = ['panico', 'senior', 'ambulancia', 'acceso', 'iot', 'monitoreo', 'video', 'incendio']

export function mountStation(view: HTMLElement): SurfaceController {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const timers: number[] = []
  const after = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, ms)) }
  let liveTimer = 0
  const byId = (id: string) => SERVICES.find(s => s.id === id)!
  const t = (s: { es: string; en: string }) => (LANG === 'en' ? s.en : s.es)

  const INITIAL = ['panico']
  let placed = INITIAL.slice()

  view.innerHTML = `
    <div class="station-wrap">
      <div class="station-head">
        <div class="kicker">Station · Modular ops</div>
        <h1>Compose your command center</h1>
      </div>
      <div class="kpibar">
        <div class="kpi" data-kpi="svc"><span class="nm">Services</span><span class="val"><span data-val>0</span></span><span class="delta">live modules</span></div>
        <div class="kpi" data-kpi="dev"><span class="nm">Devices</span><span class="val"><span data-val>0</span></span><span class="delta">across stack</span></div>
        <div class="kpi" data-kpi="evt"><span class="nm">Events today</span><span class="val"><span data-val>0</span></span><span class="delta">auto-handled</span></div>
        <div class="kpi" data-kpi="sla"><span class="nm">SLA</span><span class="val" data-sla>—</span><span class="delta">target reaction</span></div>
      </div>
      <div class="station">
        <aside class="palette" data-palette>
          <div class="cat-label"><span>Subscribed · ready</span><span class="ln"></span></div>
        </aside>
        <section>
          <div class="ws-head">
            <span class="left">Your station</span>
            <span class="stackmeter"><span>stack</span><span class="bars" data-bars></span></span>
          </div>
          <div class="workspace" data-ws></div>
        </section>
      </div>
    </div>
    <div class="pp-ghost" data-ghost></div>
  `

  const q = <T extends HTMLElement = HTMLElement>(sel: string) => view.querySelector(sel) as T
  const palette = q('[data-palette]')
  const ws = q('[data-ws]')
  const bars = q('[data-bars]')
  const ghost = q('[data-ghost]')

  for (let i = 0; i < 8; i++) bars.appendChild(document.createElement('i'))

  function svcCard(s: Svc) {
    const inWs = placed.includes(s.id)
    const el = document.createElement('div')
    el.className = 'svc' + (inWs ? ' placed-out' : '')
    el.style.setProperty('--accent', s.accent)
    el.style.setProperty('--accent-soft', s.soft)
    el.dataset.id = s.id
    el.innerHTML = `<span class="sic">${ICONS[s.id]}</span><span class="smeta"><span class="snm">${t(s)}</span><span class="ssub">${t(s.sub)}</span></span><span class="grip"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg></span>`
    return el
  }

  function renderPalette() {
    palette.querySelectorAll('.svc').forEach(n => n.remove())
    PALETTE_ORDER.filter(id => byId(id).cat === 'subscribed').forEach(id => palette.appendChild(svcCard(byId(id))))
  }

  function widgetHtml(id: string) {
    const sm = SUMMARY[id]
    if (!sm) return '<div class="upper">—</div>'
    const stats = `<div class="statline">${sm.stats.map(([k, v]) => `<div class="c"><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')}</div>`
    const feed = `<div class="feed">${sm.rows.map(([c, p, m, v]) => `<div class="feedrow"><span class="fdot" style="background:${c}"></span><span class="ftxt"><span class="fp">${p}</span><br/><span class="fm">${m}</span></span><span class="ft">${v}</span></div>`).join('')}</div>`
    return stats + feed
  }

  function buildModule(s: Svc) {
    const el = document.createElement('div')
    el.className = 'mod'
    el.style.setProperty('--accent', s.accent)
    el.style.setProperty('--accent-soft', s.soft)
    el.dataset.id = s.id
    const slaTxt = SLA_SEC[s.id] < 9999 ? s.sla : 'telemetry'
    el.innerHTML =
      `<div class="mhead"><span class="mic">${ICONS[s.id]}</span>` +
      `<span class="mt"><span class="mn">${t(s)}</span><span class="ms"><span class="live" style="font-size:8px">live</span> · ${slaTxt}</span></span>` +
      `<button class="mexp" aria-label="Expand"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/></svg></button>` +
      `<button class="mx" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>` +
      `<div class="mbody">${widgetHtml(s.id)}</div>`
    el.querySelector('.mx')!.addEventListener('click', () => removeModule(s.id))
    requestAnimationFrame(() => { el.classList.add('justadded'); window.setTimeout(() => el.classList.remove('justadded'), 480) })
    return el
  }

  function renderWorkspace() {
    ws.innerHTML = ''
    if (placed.length === 0) {
      ws.innerHTML = '<div class="empty-hint"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><path d="M14 7h4a3 3 0 0 1 3 3M10 17H6a3 3 0 0 1-3-3"/></svg><div class="big">Your station is empty</div><div class="sm">Drag a service from the catalog to plug it in as a live module.</div></div>'
      return
    }
    placed.forEach(id => ws.appendChild(buildModule(byId(id))))
  }

  function recompute(bumpId?: string) {
    let devices = 0, events = 0, sla = 9999
    const svc = placed.length
    placed.forEach(id => { const s = byId(id); devices += s.devices; events += s.events; sla = Math.min(sla, SLA_SEC[id]) })
    setKpi('svc', svc, bumpId === 'svc')
    setKpi('dev', devices, bumpId === 'dev')
    setKpi('evt', events, bumpId === 'evt')
    const slaEl = q('[data-sla]')
    if (slaEl) slaEl.textContent = sla >= 9999 ? '—' : (sla < 60 ? '< ' + sla + 's' : '< ' + Math.round(sla / 60) + ' min')
    Array.from(bars.children).forEach((b, i) => (b as HTMLElement).classList.toggle('on', i < svc))
    view.querySelectorAll('.svc').forEach(c => (c as HTMLElement).classList.toggle('placed-out', placed.includes((c as HTMLElement).dataset.id!)))
  }

  function setKpi(kind: string, val: number, bump: boolean) {
    const tile = q(`[data-kpi="${kind}"]`)
    if (!tile) return
    const v = tile.querySelector('[data-val]')
    if (v) v.textContent = String(val)
    if (bump) { tile.classList.remove('bump'); void tile.offsetWidth; tile.classList.add('bump') }
  }

  function addModule(id: string) {
    if (placed.includes(id)) return
    placed.push(id)
    renderWorkspace()
    recompute('svc')
    // bump devices too for a beat
    const dev = q('[data-kpi="dev"]'); if (dev) { dev.classList.remove('bump'); void dev.offsetWidth; dev.classList.add('bump') }
  }

  function removeModule(id: string) {
    const el = ws.querySelector(`.mod[data-id="${id}"]`)
    const finish = () => { placed = placed.filter(x => x !== id); renderWorkspace(); recompute() }
    if (el) { el.classList.add('leaving'); window.setTimeout(finish, 300) } else finish()
  }

  function dragInAndAdd(id: string) {
    const card = palette.querySelector<HTMLElement>(`.svc[data-id="${id}"]`)
    const s = byId(id)
    if (!card) { addModule(id); return }
    const vr = view.getBoundingClientRect()
    const cr = card.getBoundingClientRect()
    const wr = ws.getBoundingClientRect()
    const start = `translate(${Math.round(cr.left - vr.left + 8)}px, ${Math.round(cr.top - vr.top + 6)}px)`
    const end = `translate(${Math.round(wr.left - vr.left + wr.width / 2 - 48)}px, ${Math.round(wr.top - vr.top + 30)}px)`
    ghost.innerHTML = `<span class="gic">${ICONS[s.id]}</span>${t(s)}`
    ghost.style.opacity = '1'
    card.classList.add('dragging')
    ws.classList.add('drop-active')
    const anim = ghost.animate([{ transform: start }, { transform: end }], { duration: 560, easing: 'cubic-bezier(.22,1.2,.36,1)', fill: 'forwards' })
    anim.onfinish = () => {
      ghost.style.opacity = '0'
      card.classList.remove('dragging')
      ws.classList.remove('drop-active')
      addModule(id)
    }
  }

  function startLive() {
    if (liveTimer) return
    liveTimer = window.setInterval(() => {
      const evt = q('[data-kpi="evt"] [data-val]')
      if (evt && Math.random() > 0.5) evt.textContent = String(parseInt(evt.textContent || '0', 10) + 1)
      const rows = ws.querySelectorAll<HTMLElement>('.feedrow')
      const r = rows[0]
      if (r) { r.classList.remove('fresh'); void r.offsetWidth; r.classList.add('fresh') }
    }, 2600)
  }

  function reset() {
    timers.forEach(clearTimeout); timers.length = 0
    if (liveTimer) { clearInterval(liveTimer); liveTimer = 0 }
    ghost.getAnimations().forEach(a => a.cancel())
    ghost.style.opacity = '0'
    ws.classList.remove('drop-active')
    placed = INITIAL.slice()
    renderPalette(); renderWorkspace(); recompute()
    const wrap = q('.station-wrap'); if (wrap) wrap.scrollTop = 0
  }

  function play() {
    reset()
    if (reduce) {
      placed = ['panico', 'senior', 'ambulancia', 'acceso']
      renderWorkspace(); recompute()
      return
    }
    after(1300, () => dragInAndAdd('senior'))
    after(3100, () => dragInAndAdd('ambulancia'))
    after(4900, () => dragInAndAdd('acceso'))
    after(5600, startLive)
  }

  reset()

  return {
    play,
    reset,
    dispose() { timers.forEach(clearTimeout); if (liveTimer) clearInterval(liveTimer) },
  }
}
