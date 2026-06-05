/**
 * Chapter 3 · Surface 0 — Marketplace ("Buy").
 *
 * Ported from Nevula Demo/_unpacked/marketplace (assets/a1.js + template).
 * Renders the real catalog (KPIs, filter chips, device cards) into the view,
 * then auto-plays the signature beat: filter → add to cart → open drawer →
 * checkout → 4-step provisioning → "LIVE" device reveal + KPI tick.
 *
 * Self-contained: no NEV/NEV_STORE globals. Copy defaults to English (the data
 * keeps both languages so the es/en choice can flip later).
 */

import type { SurfaceController } from './types'
export type { SurfaceController }

const LANG: 'es' | 'en' = 'en'
const t = (es: string, en: string) => (LANG === 'en' ? en : es)

const IC: Record<string, string> = {
  panic: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M12 8v4M12 16h.01"/></svg>',
  sensor: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="7" y="7" width="10" height="10" rx="1"/><path d="M10 2v3M14 2v3M10 19v3M14 19v3M2 10h3M2 14h3M19 10h3M19 14h3"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  gps: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><circle cx="12" cy="11" r="2.5"/><path d="M12 21c4-4.5 7-8 7-11a7 7 0 0 0-14 0c0 3 3 6.5 7 11"/></svg>',
  hub: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><circle cx="12" cy="12" r="2.5"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 7 3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M3 7h13v10H3z"/><path d="m16 10 5-3v10l-5-3z"/><circle cx="8" cy="12" r="2"/></svg>',
  leak: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 3c3 5 6 8 6 12a6 6 0 0 1-12 0c0-2 1-4 2-5"/></svg>',
  fire: '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6"><path d="M12 3c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 11 9 9 12 3"/></svg>',
}

// device id → photo filename in public/assets/devices/<name>.png
const DIMG: Record<string, string> = {
  btn: 'panic', rosa: 'pinkbutton', pack: 'simplepack', leak: 'leak', con: 'drycontact',
  smartlock: 'smartlock', geo: 'tracker', fire: 'smoke', hub: 'smarthub', cam: 'camera',
}

interface Dev { id: string; icon: string; cat: string; n: { es: string; en: string }; model: string; tele: { es: string; en: string }; protos: string[]; price: number }

const CATS = [
  { id: 'all', es: 'Todos', en: 'All' },
  { id: 'panico', es: 'Pánico', en: 'Panic' },
  { id: 'sensor', es: 'Sensores', en: 'Sensors' },
  { id: 'acceso', es: 'Acceso', en: 'Access' },
  { id: 'rastreo', es: 'Rastreo', en: 'Tracking' },
  { id: 'hub', es: 'Hubs', en: 'Hubs' },
]

const DEVICES: Dev[] = [
  { id: 'btn', icon: 'panic', cat: 'panico', n: { es: 'Botón de Pánico Inalámbrico', en: 'Wireless Panic Button' }, model: 'SMPLPCK4P', tele: { es: 'Pulsación SOS', en: 'SOS press' }, protos: ['BLE', 'LTE'], price: 740 },
  { id: 'rosa', icon: 'panic', cat: 'panico', n: { es: 'Botón Rosa · Pendiente Personal', en: 'Pink Button · Personal Pendant' }, model: 'BTNROSA-V2', tele: { es: 'Geolocalización', en: 'Geolocation' }, protos: ['LTE', 'GPS'], price: 890 },
  { id: 'pack', icon: 'sensor', cat: 'sensor', n: { es: 'Simple Pack V4.0', en: 'Simple Pack V4.0' }, model: 'SMPLPCK4-MS', tele: { es: 'Temp · Geoloc WiFi', en: 'Temp · WiFi geoloc' }, protos: ['WiFi', 'Zigbee'], price: 1250 },
  { id: 'leak', icon: 'leak', cat: 'sensor', n: { es: 'Sensor de Fuga · Simple Leak', en: 'Leak Sensor · Simple Leak' }, model: 'SMPLEAK-01', tele: { es: 'Estado húmedo/seco', en: 'Wet/dry status' }, protos: ['Zigbee'], price: 520 },
  { id: 'con', icon: 'lock', cat: 'acceso', n: { es: 'Contacto Seco · Apertura', en: 'Dry Contact · Opening' }, model: 'RBS101-CON', tele: { es: 'Estado puerta', en: 'Door state' }, protos: ['Zigbee'], price: 410 },
  { id: 'smartlock', icon: 'lock', cat: 'acceso', n: { es: 'Cerradura Inteligente Gen 2', en: 'Smart Lock Gen 2' }, model: 'SMARTLOCK-G2', tele: { es: 'Acceso remoto', en: 'Remote access' }, protos: ['WiFi', 'BLE'], price: 2150 },
  { id: 'geo', icon: 'gps', cat: 'rastreo', n: { es: 'Rastreador GPS de Activos', en: 'Asset GPS Tracker' }, model: 'GEOTRACK-LTE', tele: { es: 'Ubicación en movimiento', en: 'In-motion location' }, protos: ['LTE', 'GLONASS'], price: 1180 },
  { id: 'fire', icon: 'fire', cat: 'sensor', n: { es: 'Sensor de Humo / Térmico', en: 'Smoke / Thermal Sensor' }, model: 'FIRESENSE-01', tele: { es: 'Humo + temperatura', en: 'Smoke + temperature' }, protos: ['Zigbee'], price: 680 },
  { id: 'hub', icon: 'hub', cat: 'hub', n: { es: 'Nevula Smart Hub Gen 2', en: 'Nevula Smart Hub Gen 2' }, model: 'NVHUB-G2', tele: { es: 'Gateway multiprotocolo', en: 'Multi-protocol gateway' }, protos: ['WiFi', 'Zigbee', 'LTE'], price: 1990 },
  { id: 'cam', icon: 'camera', cat: 'acceso', n: { es: 'Cámara de Verificación IA', en: 'AI Verification Camera' }, model: 'VCAM-PRO', tele: { es: 'Video + detección IA', en: 'Video + AI detection' }, protos: ['WiFi', 'RTSP'], price: 1690 },
]

const fmt = (n: number) => '$' + n.toLocaleString('en-US')
const newHex = () => Array.from({ length: 6 }, (_, i) => '4A7F2C91D63B'[i]).join('') // deterministic-ish placeholder id

export function mountMarketplace(view: HTMLElement): SurfaceController {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const timers: number[] = []
  const after = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, ms)) }
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0 }

  let activeCat = 'all'
  let cart: string[] = []
  let integratedToday = 0

  view.innerHTML = `
    <div class="mkt-wrap">
      <div class="mkt-head">
        <div class="kicker"><span>${t('Marketplace IoT', 'IoT Marketplace')}</span><span style="color:var(--ink-500)">·</span><span>${t('Dispositivos aprobados', 'Approved devices')}</span></div>
        <h1>${t('Dispositivos listos para tu stack', 'Devices ready for your stack')}</h1>
      </div>
      <div class="mkt-kpis">
        <div class="kpi"><span class="nm">${t('En inventario', 'In inventory')}</span><span class="val" data-k="inv">1,284</span><span class="delta">${t('dispositivos activos', 'active devices')}</span></div>
        <div class="kpi"><span class="nm">${t('Modelos aprobados', 'Approved models')}</span><span class="val">42</span><span class="delta">plug-and-play</span></div>
        <div class="kpi"><span class="nm">${t('Integración', 'Integration')}</span><span class="val">~8<span class="unit">s</span></span><span class="delta">${t('compra → vivo', 'buy → live')}</span></div>
        <div class="kpi"><span class="nm">${t('Integrados hoy', 'Integrated today')}</span><span class="val" data-k="today">0</span><span class="delta">${t('esta sesión', 'this session')}</span></div>
      </div>
      <div class="recent" data-recent>
        <div class="rh"><span class="live">${t('Recién integrados en tu stack', 'Just integrated into your stack')}</span></div>
        <div class="rlist" data-recent-list></div>
      </div>
      <div class="filterbar">
        <div class="chips" data-chips></div>
        <div class="search"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><circle cx="11" cy="11" r="7"></circle><path d="m21 21-4.3-4.3"></path></svg><input class="input" placeholder="${t('Buscar dispositivo…', 'Search device…')}" data-search></div>
      </div>
      <div class="devgrid" data-grid></div>
    </div>
    <button class="cartfab" data-fab><svg viewBox="0 0 24 24" fill="none" stroke-width="1.7"><path d="M3 4h2l2.5 12.5a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5L21 8H6"></path><circle cx="10" cy="21" r="1"></circle><circle cx="17" cy="21" r="1"></circle></svg><span>${t('Carrito', 'Cart')}</span><span class="cc" data-cart-count>0</span></button>
    <div class="drawer" data-drawer>
      <div class="scr" data-close></div>
      <div class="panel">
        <div class="dh"><h3>${t('Tu carrito', 'Your cart')}</h3><button class="iconbtn" data-close><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M18 6 6 18M6 6l12 12"></path></svg></button></div>
        <div class="items" data-cart-items></div>
        <div class="foot">
          <div class="tot"><span class="l">${t('Total', 'Total')}</span><span class="v" data-cart-total>$0</span></div>
          <button class="btn btn-signal" data-checkout style="width:100%;justify-content:center"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="m13 2-9 12h7l-2 8 9-12h-7z"></path></svg><span>${t('Comprar e integrar', 'Buy & integrate')}</span></button>
        </div>
      </div>
    </div>
    <div class="scrim" data-scrim><div class="dialog" data-dialog></div></div>
  `

  const q = <T extends HTMLElement = HTMLElement>(sel: string) => view.querySelector(sel) as T
  const grid = q('[data-grid]')
  const chips = q('[data-chips]')
  const fab = q('[data-fab]')
  const drawer = q('[data-drawer]')
  const scrim = q('[data-scrim]')
  const dialog = q('[data-dialog]')
  const recent = q('[data-recent]')
  const recentList = q('[data-recent-list]')

  function renderChips() {
    chips.innerHTML = ''
    CATS.forEach(c => {
      const b = document.createElement('button')
      b.className = 'chip' + (c.id === activeCat ? ' on' : '')
      b.textContent = t(c.es, c.en)
      b.onclick = () => { activeCat = c.id; renderChips(); renderGrid() }
      chips.appendChild(b)
    })
  }

  function renderGrid() {
    grid.innerHTML = ''
    DEVICES.filter(d => activeCat === 'all' || d.cat === activeCat).forEach(d => {
      const el = document.createElement('div')
      el.className = 'dev'
      el.innerHTML =
        `<div class="thumb"><span class="approved"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>${t('Aprobado Nevula', 'Nevula approved')}</span>` +
        `<img class="dphoto" src="${import.meta.env.BASE_URL}assets/devices/${DIMG[d.id] ?? 'panic'}.png" alt="" onerror="this.remove()">` +
        `<span class="dic">${IC[d.icon].replace('stroke-width="1.6"', 'stroke-width="1.4"')}</span><span class="ph">${t('FOTO DISPOSITIVO', 'DEVICE PHOTO')}</span></div>` +
        `<div class="db"><div class="n">${t(d.n.es, d.n.en)}</div><div class="m">${d.model}</div>` +
        `<div class="protos">${d.protos.map(p => `<span class="proto">${p}</span>`).join('')}</div>` +
        `<div class="tele">${t(d.tele.es, d.tele.en)}</div></div>` +
        `<div class="df"><div class="price">${fmt(d.price)}<small> /${t('u', 'ea')}</small></div>` +
        `<button class="btn btn-cobalt btn-sm" data-add="${d.id}"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.9"><path d="M12 5v14M5 12h14"/></svg>${t('Agregar', 'Add')}</button></div>`
      el.querySelector('[data-add]')!.addEventListener('click', () => addToCart(d.id))
      grid.appendChild(el)
    })
  }

  function addToCart(id: string) {
    cart.push(id)
    renderCart()
    fab.classList.add('show')
    fab.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 300 })
  }

  function renderCart() {
    q('[data-cart-count]').textContent = String(cart.length)
    if (cart.length === 0) fab.classList.remove('show')
    const items = q('[data-cart-items]')
    if (cart.length === 0) {
      items.innerHTML = `<div class="empty">${t('Tu carrito está vacío.', 'Your cart is empty.')}</div>`
    } else {
      items.innerHTML = cart.map((id, i) => {
        const d = DEVICES.find(x => x.id === id)!
        return `<div class="ci"><span class="cic">${IC[d.icon]}</span><span class="cinfo"><span class="n">${t(d.n.es, d.n.en)}</span><span class="p">${d.model} · ${fmt(d.price)}</span></span><button class="rm" data-rm="${i}"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div>`
      }).join('')
      items.querySelectorAll('[data-rm]').forEach(b => (b as HTMLElement).addEventListener('click', () => { cart.splice(Number((b as HTMLElement).dataset.rm), 1); renderCart() }))
    }
    const tot = cart.reduce((s, id) => s + DEVICES.find(x => x.id === id)!.price, 0)
    q('[data-cart-total]').textContent = fmt(tot)
    ;(q('[data-checkout]') as HTMLButtonElement).disabled = cart.length === 0
  }

  function startCheckout() {
    if (cart.length === 0) return
    drawer.classList.remove('open')
    const steps = [
      t('Pago confirmado', 'Payment confirmed'),
      t('Aprovisionando dispositivos', 'Provisioning devices'),
      t('Vinculando a tu cuenta', 'Linking to your account'),
      t('Activando en monitoreo', 'Activating in monitoring'),
    ]
    dialog.innerHTML =
      `<div class="dhead"><div>${t('Integrando tu compra', 'Integrating your purchase')}</div><div class="upper" style="margin-top:4px">${cart.length} ${t('dispositivos · plug-and-play', 'devices · plug-and-play')}</div></div>` +
      `<div class="dbody"><div class="prov">` +
      steps.map((s, i) => (i ? '<div class="prov-line"></div>' : '') + `<div class="pstep" data-step="${i}"><span class="pn">${i + 1}</span><span class="pt">${s}</span></div>`).join('') +
      `</div></div>`
    scrim.classList.add('open')
    runStep(0, steps.length)
  }

  function runStep(i: number, total: number) {
    const els = dialog.querySelectorAll('.pstep')
    if (i >= total) { after(500, finishCheckout); return }
    const el = els[i] as HTMLElement
    el.classList.add('active')
    el.querySelector('.pn')!.innerHTML = '<span class="spin"></span>'
    after(reduce ? 200 : 850, () => {
      el.classList.remove('active'); el.classList.add('done')
      el.querySelector('.pn')!.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.6"><path d="M20 6 9 17l-5-5"/></svg>'
      runStep(i + 1, total)
    })
  }

  function finishCheckout() {
    const bought = cart.slice()
    dialog.innerHTML =
      `<div class="dbody" style="text-align:center;padding-top:24px">` +
      `<div class="success-check"><svg viewBox="0 0 24 24" fill="none" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg></div>` +
      `<div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:var(--ink-100)">${t('¡Listo! Ya están en vivo', "Done! They're live")}</div>` +
      `<p style="margin:9px auto 0;max-width:320px;font-size:13px;line-height:1.5;color:var(--ink-300)">${t('Aparecen en tu monitoreo y en el inventario de tu estación. Sin pasos técnicos.', 'They appear in your monitoring and station inventory. No technical steps.')}</p></div>`
    integratedToday += bought.length
    q('[data-k="today"]').textContent = String(integratedToday)
    q('[data-k="inv"]').textContent = (1284 + integratedToday).toLocaleString('en-US')
    addRecent(bought)
    cart = []; renderCart()
  }

  function addRecent(ids: string[]) {
    recent.classList.add('show')
    ids.forEach(id => {
      const d = DEVICES.find(x => x.id === id)!
      const el = document.createElement('div')
      el.className = 'ritem'
      el.innerHTML = `<span class="ic">${IC[d.icon]}</span><span class="ri"><span class="n">${t(d.n.es, d.n.en)}</span><span class="m">${d.model} · ID ${newHex()}</span><span class="tele"><i></i></span></span><span class="badge badge-ok" style="flex:0 0 auto"><span class="pip"></span>${t('EN VIVO', 'LIVE')}</span>`
      recentList.insertBefore(el, recentList.firstChild)
    })
  }

  // manual interactions (also driven by the auto-beat)
  fab.addEventListener('click', () => drawer.classList.add('open'))
  view.querySelectorAll('[data-close]').forEach(e => e.addEventListener('click', () => drawer.classList.remove('open')))
  q('[data-checkout]').addEventListener('click', startCheckout)

  function reset() {
    clearTimers()
    activeCat = 'all'
    cart = []
    integratedToday = 0
    scrim.classList.remove('open')
    drawer.classList.remove('open')
    fab.classList.remove('show')
    recent.classList.remove('show')
    recentList.innerHTML = ''
    q('[data-k="today"]').textContent = '0'
    q('[data-k="inv"]').textContent = '1,284'
    const wrap = q('.mkt-wrap'); if (wrap) wrap.scrollTop = 0
    renderChips(); renderGrid(); renderCart()
  }

  function play() {
    reset()
    if (reduce) {
      // Static representative end-state, no scripted animation.
      activeCat = 'panico'; renderChips(); renderGrid()
      addRecent(['rosa'])
      return
    }
    after(2200, () => { activeCat = 'panico'; renderChips(); renderGrid() })
    after(3300, () => addToCart('rosa'))
    after(4300, () => drawer.classList.add('open'))
    after(5300, startCheckout)
  }

  reset()

  return {
    play,
    reset,
    dispose() { clearTimers() },
  }
}
