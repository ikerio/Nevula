/**
 * Chapter 3 · Surface 2 — Console ("Monitor").
 *
 * Ported from Nevula Demo/_unpacked/console (assets/a3.js). Renders the real
 * operator cockpit — live alarm queue + event detail (with the yellow operator
 * note) + guided response plan — then auto-plays the signature beat: a new
 * alarm slides into the queue, the operator works the 4-step plan, and the
 * event closes and drains from the queue.
 */

import type { SurfaceController } from './types'

const LANG: 'es' | 'en' = 'en'
const t = (es: string, en: string) => (LANG === 'en' ? en : es)

const IC: Record<string, string> = {
  panic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/></svg>',
  temp: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 9 12 3"/></svg>',
  motion: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/></svg>',
  assist: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M9 11V6a1.5 1.5 0 0 1 3 0v4m0-1a1.5 1.5 0 0 1 3 0v1m0 0a1.5 1.5 0 0 1 3 0v3a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-3a1.6 1.6 0 0 1 2.6-1.8L9 13"/></svg>',
}
const SEV: Record<string, { c: string; s: string }> = {
  crit: { c: 'var(--crit)', s: 'var(--crit-soft)' },
  warn: { c: 'var(--orange-600)', s: 'var(--warn-soft)' },
  info: { c: 'var(--ice-500)', s: 'var(--info-soft)' },
}

interface Alarm { id: string; sev: string; icon: string; account: string; client: string; event: string; dtype: string; did: string; dname: string; keyword: string; origin: string; prio: string; note: string; addr: string; state: string; t: string }

const NOTE = 'Woman 25–35 years old. Long black hair to the shoulder. 1.59 m tall. Slim build. Round face. Black eyes. Tan complexion.'

const ALARMS: Alarm[] = [
  { id: '#8485', sev: 'crit', icon: 'panic', account: '2000-0001', client: 'María L. Quintana Pérez', event: 'Attack / Assault · Pink Button', dtype: 'SMPLPCK4P', did: '12CA918', dname: 'PINK BUTTON', keyword: 'MARIA', origin: 'IoT device', prio: 'High', note: NOTE, addr: 'Salvador Alvarado 8, Hipódromo Condesa', state: 'On attention', t: '12:42:09' },
  { id: '#8520', sev: 'warn', icon: 'temp', account: '2000-0001', client: 'María L. Quintana Pérez', event: 'Temperature above threshold A', dtype: 'Simple Pack V4.0', did: '12C99BB', dname: 'KITCHEN SENSOR', keyword: '—', origin: 'IoT sensor', prio: 'Medium', note: 'Reading 41 °C. Configured threshold 38 °C. Verify with client.', addr: 'Salvador Alvarado 8, Hipódromo Condesa', state: 'From time hold', t: '12:40:52' },
  { id: '#9559', sev: 'crit', icon: 'fire', account: '0002', client: 'Bodega Vallejo', event: 'Mobile Panic · Fire', dtype: 'FIRESENSE-01', did: '1F0AA8', dname: 'SMOKE SENSOR', keyword: 'FIRE', origin: 'IoT device', prio: 'High', note: 'Panic activation with fire code. Smoke confirmed by adjacent thermal sensor.', addr: 'Av. Vallejo 1200, Industrial Vallejo', state: 'On attention', t: '12:39:31' },
  { id: '#9550', sev: 'crit', icon: 'assist', account: '7788', client: 'Farmacia del Valle', event: 'Attack / Assault · Assistance Button', dtype: 'SMPLPCK4P', did: '1F25089', dname: 'COUNTER BUTTON', keyword: 'HELP', origin: 'IoT device', prio: 'High', note: 'Sustained press at counter. No answer to verification call.', addr: 'Av. Coyoacán 230, Del Valle', state: 'From time hold', t: '12:37:14' },
  { id: '#8678', sev: 'warn', icon: 'motion', account: '1463-0001', client: 'Residencial Polanco', event: 'Asset in motion · Geofence', dtype: 'GEOTRACK-LTE', did: '1F0ED20', dname: 'TRACKER A-12', keyword: '—', origin: 'IoT device', prio: 'Medium', note: 'Asset left the authorized geofence at 03:38. Speed 42 km/h.', addr: 'Av. Presidente Masaryk 400, Polanco', state: 'From time hold', t: '12:35:02' },
  { id: '#8519', sev: 'info', icon: 'temp', account: '2000-0001', client: 'María L. Quintana Pérez', event: 'Temperature below threshold A', dtype: 'Simple Pack V4.0', did: '12C99BB', dname: 'KITCHEN SENSOR', keyword: '—', origin: 'IoT sensor', prio: 'Low', note: 'Reading 4 °C. Possible prolonged fridge opening.', addr: 'Salvador Alvarado 8, Hipódromo Condesa', state: 'On attention', t: '12:33:40' },
]

const INCOMING: Alarm = { id: '#9601', sev: 'crit', icon: 'panic', account: '5010-9821', client: 'Depto. Condesa 4B', event: 'Mobile Panic · Assault', dtype: 'SMPLPCK4P', did: '12CA9F1', dname: 'MOBILE BUTTON', keyword: 'THEFT', origin: 'IoT device', prio: 'High', note: 'Panic activation on public road. GPS location in motion.', addr: 'Av. Michoacán 50, Hipódromo Condesa', state: 'New · unassigned', t: 'now' }

const PLAN_STEPS = [
  { ttl: 'Phone call', det: 'Call the client to verify the signal before escalating.' },
  { ttl: 'Verify with contact', det: "If the holder doesn't answer, contact the registered relative." },
  { ttl: 'Authority dispatch', det: 'Coordinate with public / private security per protocol.' },
  { ttl: 'Register & close', det: 'Document cause and action in the log to close the event.' },
]
const CONTACTS = [
  { n: 'IoT client · holder', phone: '55 1022 3344' },
  { n: 'CONT1 · relative', phone: '98 7645 6323' },
  { n: 'Security · booth', phone: '55 4411 2299' },
]
const CALL_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>'

export function mountConsole(view: HTMLElement): SurfaceController {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const timers: number[] = []
  const after = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, ms)) }

  let alarms: Alarm[] = ALARMS.slice()
  let selectedId = alarms[0].id
  let planIdx = 0

  view.innerHTML = `
    <div class="console-wrap">
      <div class="ev-banner">
        <span class="eid" data-eid>#8485</span>
        <span class="etitle" data-etitle>—</span>
        <span class="ebtns">
          <button class="btn btn-ghost btn-sm">Transfer</button>
          <button class="btn btn-ghost btn-sm">Hold</button>
          <button class="btn btn-signal btn-sm">Close</button>
        </span>
      </div>
      <div class="cwrap">
        <div class="pane">
          <div class="ph"><span class="pt">Alarms <span class="qcount" data-qcount></span></span><span class="live" style="font-size:9px">live</span></div>
          <div class="pbody" data-queue></div>
        </div>
        <div class="pane">
          <div class="ph"><span class="pt">Event detail</span></div>
          <div class="pbody" data-detail></div>
        </div>
      </div>
    </div>
  `

  const q = <T extends HTMLElement = HTMLElement>(sel: string) => view.querySelector(sel) as T
  const queue = q('[data-queue]')
  const detail = q('[data-detail]')

  const cur = () => alarms.find(a => a.id === selectedId) || alarms[0]

  function renderQueue(freshId?: string) {
    const qc = q('[data-qcount]'); if (qc) qc.textContent = String(alarms.length)
    queue.innerHTML = ''
    alarms.forEach(a => {
      const sv = SEV[a.sev]
      const el = document.createElement('div')
      el.className = 'qrow' + (a.id === selectedId ? ' sel' : '') + (a.id === freshId ? ' fresh' : '')
      el.style.setProperty('--sev', sv.c)
      el.style.setProperty('--sevsoft', sv.s)
      el.innerHTML = `<span class="qic">${IC[a.icon]}</span><span class="qm"><span class="qe">${a.id} · ${a.event}</span><span class="qa">Acct ${a.account} · ${a.client}</span><span class="qs">${a.state}</span></span><span class="qt">${a.t}</span>`
      el.addEventListener('click', () => { selectedId = a.id; planIdx = 0; renderQueue(); renderDetail() })
      queue.appendChild(el)
    })
  }

  function renderDetail() {
    const a = cur()
    if (!a) { detail.innerHTML = '<div style="padding:40px 20px;text-align:center;color:var(--ink-400);font-size:12px">Queue empty · no alarms to handle</div>'; return }
    q('[data-eid]').textContent = a.id
    q('[data-etitle]').textContent = `Acct ${a.account} · ${a.event}`
    const di = (k: string, v: string, mono?: boolean) => `<div class="dc"><div class="k">${k}</div><div class="v${mono ? ' mono' : ''}">${v}</div></div>`
    detail.innerHTML =
      `<div class="dgrid">` +
        di('Account', `${a.account} · ${a.client}`) +
        di('Event', a.event) +
        di('Origin', a.origin) +
        di('Priority', a.prio) +
        di('Device type', a.dtype, true) +
        di('Device ID', a.did, true) +
        di('Device name', a.dname, true) +
        di('Keyword', a.keyword, true) +
        `<div class="dc full"><div class="k">Address</div><div class="v">${a.addr}</div></div>` +
      `</div>` +
      `<div class="notes"><div class="nh">Active note</div><div class="sticky-note">${a.note}<span class="nf">12:42:10</span></div></div>` +
      `<div class="plan-wrap" data-plan></div>`
    renderPlan()
  }

  function renderPlan() {
    const wrap = view.querySelector('[data-plan]')
    if (!wrap) return
    const s = PLAN_STEPS[planIdx]
    wrap.innerHTML =
      `<div class="plan-card"><div class="pch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" style="width:16px;height:16px"><path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/></svg>${s.ttl}<span class="pnum" style="margin-left:auto">Step ${planIdx + 1} of 4</span></div>` +
      `<div class="pcb"><div class="det">${s.det}</div><div class="contact-pick">` +
      CONTACTS.map((c, i) => `<div class="cp${i === 0 ? ' sel' : ''}"><span class="cn">${c.n}</span><span style="display:flex;align-items:center;gap:10px"><span class="cph">${c.phone}</span><span class="callb">${CALL_SVG}</span></span></div>`).join('') +
      `</div></div></div>` +
      `<div class="plan-nav"><button data-prev${planIdx === 0 ? ' disabled' : ''}>← Prev</button><span>Step ${planIdx + 1} of 4</span><button data-next${planIdx === 3 ? ' disabled' : ''}>Next →</button></div>`
    wrap.querySelector('[data-next]')?.addEventListener('click', () => { if (planIdx < 3) { planIdx++; renderPlan() } })
    wrap.querySelector('[data-prev]')?.addEventListener('click', () => { if (planIdx > 0) { planIdx--; renderPlan() } })
  }

  function closeCurrent() {
    const closed = cur()
    alarms = alarms.filter(a => a.id !== closed.id)
    if (alarms.length) { selectedId = alarms[0].id; planIdx = 0; renderQueue(); renderDetail() }
    else { renderQueue(); renderDetail() }
  }

  function reset() {
    timers.forEach(clearTimeout); timers.length = 0
    alarms = ALARMS.slice()
    selectedId = alarms[0].id
    planIdx = 0
    renderQueue(); renderDetail()
    const wrap = q('.console-wrap'); if (wrap) { const qb = q('[data-queue]'); if (qb) qb.scrollTop = 0 }
  }

  function play() {
    reset()
    if (reduce) { planIdx = 3; renderDetail(); return }
    // alarm slides in → operator works the plan 1→4 → close drains
    after(1300, () => { alarms.unshift(INCOMING); selectedId = INCOMING.id; planIdx = 0; renderQueue(INCOMING.id); renderDetail() })
    after(2900, () => { planIdx = 1; renderPlan() })
    after(4100, () => { planIdx = 2; renderPlan() })
    after(5300, () => { planIdx = 3; renderPlan() })
    after(6800, () => { closeCurrent() })
  }

  reset()

  return {
    play,
    reset,
    dispose() { timers.forEach(clearTimeout) },
  }
}
