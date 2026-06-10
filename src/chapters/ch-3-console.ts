/**
 * Plug & Play console — phase director for chapter 3.
 *
 * Auto-loops the product story across three surfaces:
 *   0 · Buy     — Marketplace  (pick a device, it auto-provisions)
 *   1 · Compose — Station      (drag a service onto the canvas)   [placeholder]
 *   2 · Monitor — Console      (signals arrive as alarms)         [placeholder]
 *
 * Each phase highlights its rail item, crossfades its `.pp-view` in, updates
 * the topbar breadcrumb + footer status, and — for surfaces that have a real
 * controller — resets and plays that surface's signature beat. The loop only
 * runs while chapter 3 is in view (gated on `nv:chapter`) and restarts from
 * phase 0 each time the chapter is (re)entered. Off-screen it parks on a static
 * representative frame. Reduced-motion collapses each surface to a static state.
 */

import type { NvChapterEvent } from '../lib/events'
import { isMobile } from '../lib/responsive'
import type { SurfaceController } from './ch-3-surfaces/types'
import { mountMarketplace } from './ch-3-surfaces/marketplace'
import { mountStation } from './ch-3-surfaces/station'
import { mountConsole } from './ch-3-surfaces/console'

const CHAPTER_INDEX = 3

interface Phase {
  surf: number
  crumb: string
  status: string
  alerts: number
  dur: number
}

const PHASES: Phase[] = [
  { surf: 0, crumb: 'marketplace',     status: 'browsing catalog', alerts: 0, dur: 11500 },
  { surf: 1, crumb: 'station',         status: 'composing stack',  alerts: 0, dur: 8000 },
  { surf: 2, crumb: 'live monitoring', status: 'monitoring live',  alerts: 4, dur: 8500 },
]

export interface PpConsoleHandle {
  reset(): void
  /** Dev/debug: jump to a phase and hold it (pauses auto-advance). */
  goto(ix: number): void
  dispose(): void
}

export function initPpConsole(): PpConsoleHandle | null {
  const stage = document.getElementById('ppStage')
  if (!stage) return null

  const crumbEl = document.getElementById('ppCrumb')
  const clockEl = document.getElementById('ppClock')
  const alertEl = document.getElementById('ppAlertCount')
  const statusEl = document.getElementById('ppStatus')
  const surfNameEl = document.getElementById('ppSurfaceName')
  const replay = document.getElementById('ppReplay') as HTMLButtonElement | null

  const rail = Array.from(document.querySelectorAll<HTMLElement>('.pp-surf'))
  const views = Array.from(document.querySelectorAll<HTMLElement>('.pp-view'))

  // Mobile renders the console as a single static frame: the auto-loop is gated
  // on `nv:chapter`, which never fires without the scroll engine, so `active`
  // stays false and no surface timer/RAF ever starts. Treat it like
  // reduced-motion so the (unused) surface crossfade can't introduce jank.
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce || isMobile()) document.querySelector('.pp-console')?.classList.add('pp-reduce')

  // Mount per-surface controllers (only Marketplace is real so far; Station and
  // Console are still placeholder views with no controller).
  const controllers: (SurfaceController | null)[] = [null, null, null]
  const view0 = views.find(v => v.dataset.surf === '0')
  if (view0) controllers[0] = mountMarketplace(view0)
  const view1 = views.find(v => v.dataset.surf === '1')
  if (view1) controllers[1] = mountStation(view1)
  const view2 = views.find(v => v.dataset.surf === '2')
  if (view2) controllers[2] = mountConsole(view2)

  let phaseIx = 0
  let phaseStart = performance.now()
  const pageStart = performance.now()
  let active = false
  let held = false   // dev: when true, auto-advance is paused (see goto)
  let rafId = 0
  let disposed = false

  function applyPhase(ix: number) {
    const p = PHASES[ix]
    rail.forEach(r => r.classList.toggle('is-on', Number(r.dataset.surf) === p.surf))
    views.forEach(v => v.classList.toggle('is-active', Number(v.dataset.surf) === p.surf))
    if (crumbEl) crumbEl.textContent = p.crumb
    if (statusEl) statusEl.textContent = p.status
    if (surfNameEl) surfNameEl.textContent = p.crumb
    if (alertEl) alertEl.textContent = String(p.alerts)
    // Park every other surface on its static state; play the current one if the
    // chapter is in view.
    controllers.forEach((c, surf) => { if (c && surf !== p.surf) c.reset() })
    const cur = controllers[p.surf]
    if (cur) { cur.reset(); if (active) cur.play() }
  }

  function reset() {
    held = false
    phaseIx = 0
    phaseStart = performance.now()
    applyPhase(0)
  }

  function goto(ix: number) {
    held = true
    active = true
    phaseIx = ((ix % PHASES.length) + PHASES.length) % PHASES.length
    phaseStart = performance.now()
    applyPhase(phaseIx)
    start()
  }

  function tickClock(now: number) {
    if (!clockEl) return
    const base = 12 * 3600 + 42 * 60 + 18
    const sec = base + Math.floor((now - pageStart) / 1000)
    const hh = Math.floor(sec / 3600) % 24
    const mm = Math.floor(sec / 60) % 60
    const ss = sec % 60
    clockEl.textContent =
      String(hh).padStart(2, '0') + ':' +
      String(mm).padStart(2, '0') + ':' +
      String(ss).padStart(2, '0')
  }

  function loop(now: number) {
    if (disposed || !active) { rafId = 0; return }
    if (!held && now - phaseStart >= PHASES[phaseIx].dur) {
      phaseIx = (phaseIx + 1) % PHASES.length
      phaseStart = now
      applyPhase(phaseIx)
    }
    tickClock(now)
    rafId = requestAnimationFrame(loop)
  }

  function start() {
    if (rafId || disposed) return
    phaseStart = performance.now()
    rafId = requestAnimationFrame(loop)
  }
  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
  }

  // ---- listeners ----
  const replayFn = () => {
    reset()
    if (active) { applyPhase(0); start() }
  }
  replay?.addEventListener('click', replayFn)

  const chapterFn = (e: NvChapterEvent) => {
    const entering = e.detail.index === CHAPTER_INDEX
    if (entering && !active) {
      active = true
      reset()
      start()
    } else if (!entering && active) {
      active = false
      stop()
      controllers.forEach(c => c?.reset())
    }
  }
  window.addEventListener('nv:chapter', chapterFn)

  // Show phase 0 statically until the chapter is entered.
  applyPhase(0)

  return {
    reset,
    goto,
    dispose() {
      disposed = true
      stop()
      window.removeEventListener('nv:chapter', chapterFn)
      replay?.removeEventListener('click', replayFn)
      controllers.forEach(c => c?.dispose())
    },
  }
}
